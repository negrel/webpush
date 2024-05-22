import { decodeBase64Url } from "./deps.ts";

const crypto = globalThis.crypto.subtle;

const jwk: JsonWebKey = {
  "crv": "P-256",
  "kty": "EC",
  "x": "DUfHPKLVFQzVvnCPGyfucbECzPDa7rWbXriLcysAjEc",
  "y": "F6YK5h4SDYic-dRuU_RCPCfA5aq9ojSwk5Y2EmClBPs",
};

const jwtKey = await crypto.importKey(
  "jwk",
  jwk,
  {
    name: "ECDSA",
    namedCurve: "P-256",
  },
  false,
  ["verify"],
);

console.log(jwtKey);

const rawKey = await crypto.importKey(
  "raw",
  decodeBase64Url(
    "BA1Hxzyi1RUM1b5wjxsn7nGxAszw2u61m164i3MrAIxHF6YK5h4SDYic-dRuU_RCPCfA5aq9ojSwk5Y2EmClBPs",
  ),
  {
    name: "ECDSA",
    namedCurve: "P-256",
  },
  false,
  ["verify"],
);

console.log(rawKey);
