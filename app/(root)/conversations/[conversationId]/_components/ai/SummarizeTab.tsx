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
import { Loader2, FileText } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type Props = {
  conversationId: Id<"conversations">;
};

type SummaryType = "brief" | "detailed" | "bullet-points";

export function SummarizeTab({ conversationId }: Props) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryType, setSummaryType] = useState<SummaryType>("brief");
  const [messageLimit, setMessageLimit] = useState("50");

  const generateSummary = async () => {
    setLoading(true);
    setSummary("");

    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          summaryType,
          messageLimit: parseInt(messageLimit),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await response.json();
      setSummary(data.summary);
      toast.success(`Summary generated from ${data.messageCount} messages`);
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Summary Type</Label>
          <Select
            value={summaryType}
            onValueChange={(value) => setSummaryType(value as SummaryType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="brief">Brief (2-3 sentences)</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
              <SelectItem value="bullet-points">Bullet Points</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Message Limit</Label>
          <Select value={messageLimit} onValueChange={setMessageLimit}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">Last 25 messages</SelectItem>
              <SelectItem value="50">Last 50 messages</SelectItem>
              <SelectItem value="100">Last 100 messages</SelectItem>
              <SelectItem value="200">Last 200 messages</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={generateSummary}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Summary...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Generate Summary
          </>
        )}
      </Button>

      {summary && (
        <Card className="p-3 sm:p-4 bg-muted/50">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold text-xs sm:text-sm">Summary</h3>
              <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {summary}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
