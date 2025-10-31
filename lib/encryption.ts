/**
 * End-to-End Encryption Utilities
 * Uses Web Crypto API for RSA-OAEP (key exchange) and AES-GCM (message encryption)
 */

// Types
export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface EncryptedMessage {
  encryptedContent: string;
  iv: string;
  encryptedSymmetricKey: string;
}

export interface ExportedPublicKey {
  key: string;
  fingerprint: string;
}

/**
 * Generate RSA key pair for user
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  };
}

/**
 * Export public key to storable format
 */
export async function exportPublicKey(
  publicKey: CryptoKey
): Promise<ExportedPublicKey> {
  const exported = await window.crypto.subtle.exportKey("spki", publicKey);
  const exportedAsString = arrayBufferToBase64(exported);
  const fingerprint = await generateKeyFingerprint(exportedAsString);

  return {
    key: exportedAsString,
    fingerprint,
  };
}

/**
 * Import public key from stored format
 */
export async function importPublicKey(keyString: string): Promise<CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(keyString);
  return await window.crypto.subtle.importKey(
    "spki",
    keyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

/**
 * Export private key for storage
 */
export async function exportPrivateKey(privateKey: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
  return arrayBufferToBase64(exported);
}

/**
 * Import private key from storage
 */
export async function importPrivateKey(keyString: string): Promise<CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(keyString);
  return await window.crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
}

/**
 * Generate symmetric key for message encryption
 */
async function generateSymmetricKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a message using recipient's public key
 */
export async function encryptMessage(
  message: string,
  recipientPublicKey: CryptoKey
): Promise<EncryptedMessage> {
  // Generate symmetric key for this message
  const symmetricKey = await generateSymmetricKey();

  // Generate IV for AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt message with symmetric key
  const encoder = new TextEncoder();
  const encodedMessage = encoder.encode(message);
  const encryptedContent = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    symmetricKey,
    encodedMessage
  );

  // Export symmetric key
  const exportedSymmetricKey = await window.crypto.subtle.exportKey(
    "raw",
    symmetricKey
  );

  // Encrypt symmetric key with recipient's public key
  const encryptedSymmetricKey = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    recipientPublicKey,
    exportedSymmetricKey
  );

  return {
    encryptedContent: arrayBufferToBase64(encryptedContent),
    iv: arrayBufferToBase64(iv),
    encryptedSymmetricKey: arrayBufferToBase64(encryptedSymmetricKey),
  };
}

/**
 * Decrypt a message using user's private key
 */
export async function decryptMessage(
  encryptedMessage: EncryptedMessage,
  privateKey: CryptoKey
): Promise<string> {
  try {
    // Decrypt symmetric key with private key
    const encryptedSymmetricKeyBuffer = base64ToArrayBuffer(
      encryptedMessage.encryptedSymmetricKey
    );
    const symmetricKeyBuffer = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      privateKey,
      encryptedSymmetricKeyBuffer
    );

    // Import symmetric key
    const symmetricKey = await window.crypto.subtle.importKey(
      "raw",
      symmetricKeyBuffer,
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["decrypt"]
    );

    // Decrypt message content
    const encryptedContentBuffer = base64ToArrayBuffer(
      encryptedMessage.encryptedContent
    );
    const ivBuffer = base64ToArrayBuffer(encryptedMessage.iv);

    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBuffer,
      },
      symmetricKey,
      encryptedContentBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedContent);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt message");
  }
}

/**
 * Generate fingerprint for key verification
 */
export async function generateKeyFingerprint(
  publicKeyString: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(publicKeyString);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  // Format as readable fingerprint (e.g., "AB:CD:EF:...")
  return hashHex.match(/.{1,2}/g)?.slice(0, 8).join(":").toUpperCase() || hashHex;
}

/**
 * Verify if two fingerprints match
 */
export function verifyFingerprint(
  fingerprint1: string,
  fingerprint2: string
): boolean {
  return fingerprint1.toLowerCase() === fingerprint2.toLowerCase();
}

// Helper functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
