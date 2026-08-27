import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

interface EncryptedPayload {
  version: 1;
  iv: string;
  tag: string;
  ciphertext: string;
}

function isEncryptedPayload(value: unknown): value is EncryptedPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    value.version === 1 &&
    "iv" in value &&
    typeof value.iv === "string" &&
    "tag" in value &&
    typeof value.tag === "string" &&
    "ciphertext" in value &&
    typeof value.ciphertext === "string"
  );
}

@Injectable()
export class SecretEncryptionService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const configured = config.get<string>("app.credentialEncryptionKey");
    if (!configured) {
      throw new Error("CREDENTIAL_ENCRYPTION_KEY is required");
    }
    const decoded = Buffer.from(configured, "base64");
    if (decoded.length !== 32) {
      throw new Error("CREDENTIAL_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
    }
    this.key = decoded;
  }

  encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const payload: EncryptedPayload = {
      version: 1,
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      ciphertext: ciphertext.toString("base64")
    };
    return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
  }

  decrypt(value: string): string {
    const payload: unknown = JSON.parse(Buffer.from(value, "base64").toString("utf8"));
    if (!isEncryptedPayload(payload)) throw new Error("Invalid credential payload");
    const decipher = createDecipheriv("aes-256-gcm", this.key, Buffer.from(payload.iv, "base64"));
    decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(payload.ciphertext, "base64")), decipher.final()]).toString(
      "utf8"
    );
  }

  mask(value: string): string {
    if (value.length <= 8) return "********";
    return `${value.slice(0, 4)}…${value.slice(-4)}`;
  }
}
