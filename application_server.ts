import { PushSubscriber, PushSubscription } from "./subscriber.ts";

/**
 * ApplicationServer define a Push application server as specified in RFC 8291.
 *
 * See https://www.rfc-editor.org/rfc/rfc8291#section-1
 */
export class ApplicationServer {
  public readonly crypto: SubtleCrypto;

  // Application Server (AS) keys.
  public readonly keys: CryptoKeyPair;

  // AS public key in raw format.
  private publicKeyRaw: Uint8Array | null = null;

  // VAPID AS contact information.
  public readonly contactInformation: string;
  public readonly vapidKeys: CryptoKeyPair;
  private publicVapidKeyRaw: Uint8Array | null = null;

  constructor(
    {
      crypto = globalThis.crypto.subtle,
      keys,
      contactInformation,
      vapidKeys,
    }: {
      crypto?: SubtleCrypto;
      keys: CryptoKeyPair;
      contactInformation: string;
      vapidKeys: CryptoKeyPair;
    },
  ) {
    this.crypto = crypto;
    this.contactInformation = contactInformation;
    this.keys = keys;
    this.vapidKeys = vapidKeys;
  }

  static async new(
    { crypto = globalThis.crypto.subtle, contactInformation, vapidKeys }: {
      crypto?: SubtleCrypto;
      contactInformation: string;
      vapidKeys: CryptoKeyPair;
    },
  ): Promise<ApplicationServer> {
    const keys = await crypto.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      false,
      ["deriveKey"],
    );

    return new ApplicationServer({
      crypto,
      keys,
      contactInformation,
      vapidKeys,
    });
  }

  async getPublicKeyRaw(): Promise<Uint8Array> {
    if (this.publicKeyRaw === null) {
      this.publicKeyRaw = new Uint8Array(
        await this.crypto.exportKey(
          "raw",
          this.keys.publicKey,
        ),
      );
    }

    return this.publicKeyRaw;
  }

  async getVapidPublicKeyRaw(): Promise<Uint8Array> {
    if (this.publicVapidKeyRaw === null) {
      this.publicVapidKeyRaw = new Uint8Array(
        await this.crypto.exportKey(
          "raw",
          this.vapidKeys.publicKey,
        ),
      );
    }

    return this.publicVapidKeyRaw;
  }

  subscribe(sub: PushSubscription): PushSubscriber {
    return new PushSubscriber(this, sub);
  }
}
