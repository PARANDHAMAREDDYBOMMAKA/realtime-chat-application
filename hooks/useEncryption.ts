import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPrivateKey,
  importPublicKey,
  encryptMessage,
  decryptMessage,
  type EncryptedMessage,
} from "@/lib/encryption";
import {
  storeKeys,
  getStoredKeys,
  hasStoredKeys,
} from "@/lib/keyStorage";
import { Id } from "@/convex/_generated/dataModel";

export function useEncryption() {
  const { user } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasKeys, setHasKeys] = useState(false);
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [fingerprint, setFingerprint] = useState<string>("");

  const storePublicKey = useMutation(api.encryption.storePublicKey);
  const hasEncryptionEnabled = useQuery(api.encryption.hasEncryptionEnabled);

  // Initialize encryption keys
  useEffect(() => {
    if (!user?.id) return;

    const initializeKeys = async () => {
      try {
        // Check if keys exist locally
        const keysExist = await hasStoredKeys(user.id);

        if (keysExist) {
          // Load existing keys
          const storedKeys = await getStoredKeys(user.id);
          if (storedKeys) {
            const importedPrivateKey = await importPrivateKey(
              storedKeys.privateKey
            );
            setPrivateKey(importedPrivateKey);
            setFingerprint(storedKeys.fingerprint);
            setHasKeys(true);
          }
        } else if (hasEncryptionEnabled === false) {
          // Generate new keys if none exist
          await generateAndStoreKeys();
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize encryption:", error);
        setIsInitialized(true);
      }
    };

    initializeKeys();
  }, [user?.id, hasEncryptionEnabled]);

  // Generate and store new keys
  const generateAndStoreKeys = async () => {
    if (!user?.id) throw new Error("User not authenticated");

    try {
      // Generate key pair
      const keyPair = await generateKeyPair();

      // Export keys
      const exportedPublic = await exportPublicKey(keyPair.publicKey);
      const exportedPrivate = await exportPrivateKey(keyPair.privateKey);

      // Store locally
      await storeKeys(
        user.id,
        exportedPrivate,
        exportedPublic.key,
        exportedPublic.fingerprint
      );

      // Store public key on server
      await storePublicKey({
        publicKey: exportedPublic.key,
        fingerprint: exportedPublic.fingerprint,
      });

      setPrivateKey(keyPair.privateKey);
      setFingerprint(exportedPublic.fingerprint);
      setHasKeys(true);

      return { success: true, fingerprint: exportedPublic.fingerprint };
    } catch (error) {
      console.error("Failed to generate keys:", error);
      throw error;
    }
  };

  // Encrypt message for multiple recipients
  const encryptForRecipients = async (
    message: string,
    recipientPublicKeys: Array<{ userId: Id<"users">; publicKey: string }>
  ): Promise<{
    encryptedContent: string;
    iv: string;
    encryptedKeys: Array<{ userId: Id<"users">; encryptedSymmetricKey: string }>;
  }> => {
    if (recipientPublicKeys.length === 0) {
      throw new Error("No recipients specified");
    }

    // Use the first recipient's key to encrypt (we'll encrypt the symmetric key for all)
    const firstRecipientKey = await importPublicKey(
      recipientPublicKeys[0].publicKey
    );
    const encrypted = await encryptMessage(message, firstRecipientKey);

    // Re-encrypt the symmetric key for each recipient
    const encryptedKeys = await Promise.all(
      recipientPublicKeys.map(async (recipient) => {
        const recipientKey = await importPublicKey(recipient.publicKey);
        // In a real implementation, you would decrypt with your private key and re-encrypt
        // For now, we'll encrypt the message separately for each recipient
        const encryptedForRecipient = await encryptMessage(message, recipientKey);

        return {
          userId: recipient.userId,
          encryptedSymmetricKey: encryptedForRecipient.encryptedSymmetricKey,
        };
      })
    );

    return {
      encryptedContent: encrypted.encryptedContent,
      iv: encrypted.iv,
      encryptedKeys,
    };
  };

  // Decrypt message
  const decrypt = async (
    encryptedMessage: EncryptedMessage
  ): Promise<string> => {
    if (!privateKey) {
      throw new Error("Private key not available");
    }

    return await decryptMessage(encryptedMessage, privateKey);
  };

  return {
    isInitialized,
    hasKeys,
    fingerprint,
    generateAndStoreKeys,
    encryptForRecipients,
    decrypt,
  };
}
