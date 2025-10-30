"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessageSearchDialogProps {
    conversationId: Id<"conversations">;
    onMessageClick?: (messageId: Id<"messages">) => void;
}

export default function MessageSearchDialog({
    conversationId,
    onMessageClick,
}: MessageSearchDialogProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const searchResults = useQuery(
        api.search.searchMessages,
        searchQuery.length >= 2
            ? { query: searchQuery, conversationId }
            : "skip"
    );

    const handleMessageClick = (messageId: Id<"messages">) => {
        setOpen(false);
        onMessageClick?.(messageId);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Search className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle>Search Messages</DialogTitle>
                </DialogHeader>

                {/* Search Input */}
                <div className="px-6 py-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search in conversation..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-10"
                            autoFocus
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                                onClick={() => setSearchQuery("")}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Search Results */}
                <ScrollArea className="flex-1 px-6 pb-6">
                    {!searchQuery && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Search className="h-12 w-12 text-muted-foreground/40 mb-3" />
                            <p className="text-sm text-muted-foreground">
                                Type at least 2 characters to search
                            </p>
                        </div>
                    )}

                    {searchQuery && searchQuery.length < 2 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-sm text-muted-foreground">
                                Type at least 2 characters
                            </p>
                        </div>
                    )}

                    {searchQuery && searchQuery.length >= 2 && !searchResults && (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {searchResults && searchResults.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-sm text-muted-foreground">
                                No messages found
                            </p>
                        </div>
                    )}

                    {searchResults && searchResults.length > 0 && (
                        <div className="space-y-2">
                            {searchResults.map((result) => (
                                <button
                                    key={result.messageId}
                                    onClick={() => handleMessageClick(result.messageId)}
                                    className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors border border-border/30 hover:border-primary/30"
                                >
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-9 w-9 flex-shrink-0">
                                            <AvatarImage src={result.senderImage} />
                                            <AvatarFallback>
                                                {result.senderName.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-sm">
                                                    {result.senderName}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(result.createdAt, "MMM d, HH:mm")}
                                                </span>
                                            </div>
                                            <p className="text-sm text-foreground/80 line-clamp-2 break-words">
                                                {highlightSearchTerm(result.content, searchQuery)}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// Helper function to highlight search term in text
function highlightSearchTerm(text: string, searchTerm: string) {
    if (!searchTerm) return text;

    const parts = text.split(new RegExp(`(${searchTerm})`, "gi"));
    return parts.map((part, index) =>
        part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark key={index} className="bg-primary/30 rounded px-0.5">
                {part}
            </mark>
        ) : (
            part
        )
    );
}
