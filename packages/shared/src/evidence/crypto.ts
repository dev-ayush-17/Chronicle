export interface EncryptedFile {
  encrypted: Blob;
  iv: Uint8Array;
}

export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptFile(
  file: File,
  key: CryptoKey
): Promise<EncryptedFile> {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const buffer = await file.arrayBuffer();

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    buffer
  );

  return {
    iv,
    encrypted: new Blob([encryptedBuffer]),
  };
}

export async function decryptFile(
  encrypted: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array | number[]
): Promise<ArrayBuffer> {
  const normalizedIv: Uint8Array = new Uint8Array(iv)

  return crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: normalizedIv as BufferSource,
    },
    key,
    encrypted
  );
}

export async function exportKey(
  key: CryptoKey
): Promise<JsonWebKey> {
  return crypto.subtle.exportKey("jwk", key);
}

export async function importKey(
  jwk: JsonWebKey
): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "AES-GCM",
    },
    true,
    ["encrypt", "decrypt"]
  );
}