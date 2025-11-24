"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MessageSquare, Copy, Check } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type Props = {
  conversationId: Id<"conversations">;
  onUse?: () => void;
};

type Tone = "casual" | "professional" | "friendly" | "formal";

export function ResponseSuggestionsTab({ conversationId, onUse }: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [tone, setTone] = useState<Tone>("casual");
  const [numberOfSuggestions, setNumberOfSuggestions] = useState("3");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateSuggestions = async () => {
    setLoading(true);
    setSuggestions([]);

    try {
      const response = await fetch("/api/ai/suggest-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          tone,
          numberOfSuggestions: parseInt(numberOfSuggestions),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate suggestions");
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
      toast.success(`Generated ${data.suggestions.length} suggestions`);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast.error("Failed to generate suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copySuggestion = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Tone</Label>
          <Select value={tone} onValueChange={(value) => setTone(value as Tone)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="formal">Formal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Number of Suggestions</Label>
          <Select
            value={numberOfSuggestions}
            onValueChange={setNumberOfSuggestions}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 suggestion</SelectItem>
              <SelectItem value="3">3 suggestions</SelectItem>
              <SelectItem value="5">5 suggestions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={generateSuggestions} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Suggestions...
          </>
        ) : (
          <>
            <MessageSquare className="mr-2 h-4 w-4" />
            Generate Suggestions
          </>
        )}
      </Button>

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-xs sm:text-sm">Suggested Responses</h3>
          {suggestions.map((suggestion, index) => (
            <Card
              key={index}
              className="p-3 sm:p-4 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Option {index + 1}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed">{suggestion}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => copySuggestion(suggestion, index)}
                  className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                >
                  {copiedIndex === index ? (
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
