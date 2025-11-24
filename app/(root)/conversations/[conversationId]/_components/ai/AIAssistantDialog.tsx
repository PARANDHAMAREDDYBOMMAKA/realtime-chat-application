"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { SummarizeTab } from "./SummarizeTab";
import { ResponseSuggestionsTab } from "./ResponseSuggestionsTab";
import { AskQuestionTab } from "./AskQuestionTab";

type Props = {
  conversationId: Id<"conversations">;
};

export function AIAssistantDialog({ conversationId }: Props) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("summarize");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="hover:bg-primary/10 hover:text-primary relative group"
          title="AI Assistant"
        >
          <Sparkles className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            AI Assistant
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Get AI-powered help with your conversation - summarize messages, get response suggestions, or ask questions.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="summarize" className="text-xs sm:text-sm px-2 sm:px-3">
              <span className="hidden sm:inline">Summarize</span>
              <span className="sm:hidden">Summary</span>
            </TabsTrigger>
            <TabsTrigger value="suggest" className="text-xs sm:text-sm px-2 sm:px-3">
              <span className="hidden sm:inline">Suggest Replies</span>
              <span className="sm:hidden">Replies</span>
            </TabsTrigger>
            <TabsTrigger value="ask" className="text-xs sm:text-sm px-2 sm:px-3">
              <span className="hidden sm:inline">Ask Questions</span>
              <span className="sm:hidden">Q&A</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summarize" className="mt-4">
            <SummarizeTab conversationId={conversationId} />
          </TabsContent>

          <TabsContent value="suggest" className="mt-4">
            <ResponseSuggestionsTab conversationId={conversationId} onUse={() => setOpen(false)} />
          </TabsContent>

          <TabsContent value="ask" className="mt-4">
            <AskQuestionTab conversationId={conversationId} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
