"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Copy, Check, Key, AlertCircle } from "lucide-react";
import { useEncryption } from "@/hooks/useEncryption";
import { useToast } from "@/hooks/use-toast";

export function EncryptionSettingsDialog() {
  const { isInitialized, hasKeys, fingerprint, generateAndStoreKeys } =
    useEncryption();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleCopyFingerprint = () => {
    navigator.clipboard.writeText(fingerprint);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Fingerprint copied successfully",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateKeys = async () => {
    setGenerating(true);
    try {
      const result = await generateAndStoreKeys();
      toast({
        title: "Encryption enabled",
        description: `Your fingerprint: ${result.fingerprint}`,
      });
    } catch (error) {
      toast({
        title: "Failed to enable encryption",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Shield className="h-4 w-4" />
          Encryption
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            End-to-End Encryption
          </DialogTitle>
          <DialogDescription>
            Your messages are encrypted and only you and the recipient can read
            them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isInitialized ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Initializing encryption...
            </div>
          ) : hasKeys ? (
            <div className="space-y-4">
              {/* Encryption Status */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Encryption Enabled
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your messages are protected
                  </p>
                </div>
              </div>

              {/* Fingerprint */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Your Security Code (Fingerprint)
                </label>
                <div className="relative">
                  <code className="block p-3 rounded-lg bg-muted text-xs font-mono break-all pr-12">
                    {fingerprint}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyFingerprint}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this code with your contacts to verify your identity.
                </p>
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-blue-600 dark:text-blue-400 mb-1">
                    Important
                  </p>
                  <p>
                    Your encryption keys are stored securely on your device. If
                    you clear your browser data, you'll need to generate new
                    keys.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Not Enabled */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    Encryption Not Enabled
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Enable encryption to secure your messages
                  </p>
                </div>
              </div>

              {/* Enable Button */}
              <Button
                onClick={handleGenerateKeys}
                disabled={generating}
                className="w-full gap-2"
              >
                {generating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Generating Keys...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Enable Encryption
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                This will generate encryption keys on your device to secure your
                messages.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
