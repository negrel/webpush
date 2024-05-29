import { ApplicationServer } from "./application_server.ts";
import {
  ecdh,
  forgeJwt,
  hkdfSha256Expand,
  hkdfSha256Extract,
} from "./crypto_utils.ts";
import { bytes, decodeBase64Url, ece, encodeBase64Url } from "./deps.ts";

const encoder = new TextEncoder();

/**
 * PushSubscriber define a Web Push subscriber.
 */
export class PushSubscriber {
  public readonly as: ApplicationServer;
  public readonly subscription: PushSubscription;

  private uaPublicKey: CryptoKey | null = null;
  private ecdhSecret: ArrayBuffer | null = null;

  constructor(as: ApplicationServer, subscription: PushSubscription) {
    this.as = as;
    this.subscription = subscription;
  }

  private uaPublicKeyRaw(): Uint8Array {
    return decodeBase64Url(this.subscription.keys.p256dh);
  }

  authSecret(): ArrayBuffer {
    return decodeBase64Url(this.subscription.keys.auth).slice(0).buffer;
  }

  async getUaPublicKey(): Promise<CryptoKey> {
    if (this.uaPublicKey === null) {
      this.uaPublicKey = await this.as.crypto.importKey(
        "raw",
        this.uaPublicKeyRaw(),
        {
          "name": "ECDH",
          namedCurve: "P-256",
        },
        true,
        [],
      );
    }

    return this.uaPublicKey;
  }

  async getEcdhSecret(): Promise<ArrayBuffer> {
    if (this.ecdhSecret === null) {
      this.ecdhSecret = await ecdh(this.as.crypto, {
        privateKey: this.as.keys.privateKey,
        publicKey: await this.getUaPublicKey(),
      });
    }

    return this.ecdhSecret;
  }

  async getKeyInfo(): Promise<Uint8Array> {
    return bytes.concat([
      encoder.encode("WebPush: info\0"),
      this.uaPublicKeyRaw(),
      await this.as.getPublicKeyRaw(),
    ]);
  }

  getSubscriptionOrigin(): string {
    return new URL(this.subscription.endpoint).origin;
  }

  forgeVapidToken(): Promise<string> {
    return forgeJwt(this.as.vapidKeys.privateKey, {
      sub: this.as.contactInformation,
      aud: this.getSubscriptionOrigin(),
      exp: (Math.round(Date.now() / 1000) + 3600), // Expire in 1 hour.
    });
  }

  async pushMessage(
    message: ArrayBuffer,
    { urgency = Urgency.Normal, ttl = 2419200, topic }: PushMessageOptions,
  ): Promise<void> {
    const prkKey = await hkdfSha256Extract(
      this.as.crypto,
      this.authSecret(),
      await this.getEcdhSecret(),
    );

    const ikm = await hkdfSha256Expand(
      this.as.crypto,
      prkKey,
      bytes.concat([await this.getKeyInfo(), ece.ONE_BYTE]),
      32,
    );

    const record = await ece.encrypt(message, ikm, {
      header: {
        keyid: await this.as.getPublicKeyRaw(),
      },
    });

    const headers: HeadersInit = {
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      "Urgency": urgency,
      TTL: ttl.toFixed(0),
      Authorization: `vapid t=${await this.forgeVapidToken()}, k=${
        encodeBase64Url(
          await this.as.getVapidPublicKeyRaw(),
        )
      }`,
    };
    if (topic !== undefined) {
      headers["Topic"] = topic;
    }

    const response = await fetch(this.subscription.endpoint, {
      method: "POST",
      headers,
      body: record,
    });

    if (!response.ok) {
      throw new PushMessageError(response);
    }
  }

  pushTextMessage(message: string, options: PushMessageOptions): Promise<void> {
    return this.pushMessage(encoder.encode(message), options);
  }
}

/**
 * PushMessageError define error returned by push service when push fails.
 */
export class PushMessageError extends Error {
  public readonly response: Response;

  constructor(response: Response) {
    super();
    this.response = response;
  }

  /**
   * isGone returns true if subscription doesn't exist anymore.
   */
  isGone(): boolean {
    return this.response.status === 410;
  }

  toString(): string {
    return `pushing message failed: ${this.response.status} ${this.response.statusText}`;
  }
}

/**
 * PushSubscription interface contains subscription's information send by user
 * agent after subscribing.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/API/PushSubscription
 */
export interface PushSubscription {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

/**
 * Urgency define urgency level of a push message.
 * To attempt to deliver the notification immediately, specify High.
 */
export enum Urgency {
  VeryLow = "very-low",
  Low = "low",
  Normal = "normal",
  High = "high",
}

interface PushMessageOptions {
  urgency?: Urgency;
  ttl?: number;
  topic?: string;
}
