"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, HelpCircle, Lightbulb } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type Props = {
  conversationId: Id<"conversations">;
};

const EXAMPLE_QUESTIONS = [
  "What are the main topics discussed?",
  "What decisions were made?",
  "Are there any action items?",
  "Who said what about X?",
  "When was Y mentioned?",
];

export function AskQuestionTab({ conversationId }: Props) {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [messageLimit, setMessageLimit] = useState("100");

  const askQuestion = async () => {
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    setLoading(true);
    setAnswer("");

    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          question: question.trim(),
          messageLimit: parseInt(messageLimit),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get answer");
      }

      const data = await response.json();
      setAnswer(data.answer);
      toast.success(`Answer generated from ${data.messagesAnalyzed} messages`);
    } catch (error) {
      console.error("Error asking question:", error);
      toast.error("Failed to get answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const useExampleQuestion = (exampleQuestion: string) => {
    setQuestion(exampleQuestion);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm">Your Question</Label>
        <Textarea
          placeholder="Ask anything about this conversation..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          className="resize-none text-xs sm:text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Message Limit</Label>
        <Select value={messageLimit} onValueChange={setMessageLimit}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="50">Last 50 messages</SelectItem>
            <SelectItem value="100">Last 100 messages</SelectItem>
            <SelectItem value="200">Last 200 messages</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={askQuestion} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Getting Answer...
          </>
        ) : (
          <>
            <HelpCircle className="mr-2 h-4 w-4" />
            Ask Question
          </>
        )}
      </Button>

      {!answer && (
        <Card className="p-3 sm:p-4 bg-muted/30">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <h3 className="font-semibold text-xs sm:text-sm">Example Questions</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map((exampleQuestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => useExampleQuestion(exampleQuestion)}
                  className="text-xs h-auto py-1.5 px-2"
                >
                  {exampleQuestion}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {answer && (
        <Card className="p-3 sm:p-4 bg-muted/50">
          <div className="flex items-start gap-2">
            <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold text-xs sm:text-sm">Answer</h3>
              <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {answer}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
