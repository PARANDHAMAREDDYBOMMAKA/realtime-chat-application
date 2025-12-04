"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Languages, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MessageTranslationProps {
  messageText: string;
  className?: string;
}

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "tr", name: "Turkish" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  // Indian Languages
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "te", name: "Telugu" },
  { code: "mr", name: "Marathi" },
  { code: "ta", name: "Tamil" },
  { code: "gu", name: "Gujarati" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "pa", name: "Punjabi" },
  { code: "or", name: "Odia" },
  { code: "as", name: "Assamese" },
  { code: "mai", name: "Maithili" },
  { code: "sa", name: "Sanskrit" },
  { code: "ks", name: "Kashmiri" },
  { code: "ur", name: "Urdu" },
];

export default function MessageTranslation({
  messageText,
  className,
}: MessageTranslationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  const translateMessage = useAction(api.translation.translateMessage);

  const handleTranslate = async () => {
    if (!targetLanguage) {
      toast.error("Please select a target language");
      return;
    }

    setIsTranslating(true);
    try {
      const result = await translateMessage({
        text: messageText,
        targetLanguage:
          LANGUAGES.find((l) => l.code === targetLanguage)?.name || "English",
      });

      if (result.success) {
        setTranslatedText(result.translatedText);
        setShowTranslation(true);
        setIsOpen(false);
      } else {
        toast.error(result.error || "Translation failed");
      }
    } catch (error) {
      console.error("Translation error:", error);
      toast.error("Failed to translate message");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <>
      {/* Translation Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-primary/10"
            title="Translate message"
          >
            <Languages className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-4 bg-popover border border-border shadow-lg"
          align="start"
          side="top"
        >
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Languages className="h-4 w-4 text-primary" />
                Translate Message
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                Select a language to translate this message
              </p>
            </div>

            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleTranslate}
              disabled={isTranslating}
              className="w-full"
              size="sm"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Languages className="h-3.5 w-3.5 mr-2" />
                  Translate
                </>
              )}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Translated Text Display - Portal to avoid position issues */}
      {showTranslation && translatedText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20" onClick={() => setShowTranslation(false)}>
          <div className="max-w-md w-full p-4 bg-background/95 backdrop-blur-sm rounded-lg border border-border shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">
                  Translated to {LANGUAGES.find((l) => l.code === targetLanguage)?.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowTranslation(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-3 bg-muted/30 rounded-md">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{translatedText}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
