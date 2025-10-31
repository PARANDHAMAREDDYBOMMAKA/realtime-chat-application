"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useConversation } from "@/hooks/useConversation";
import { cn } from "@/lib/utils";
import React, { useEffect, useState, useRef } from "react";
import { Search, X } from "lucide-react";

type Props = React.PropsWithChildren<{
  title: string;
  action?: React.ReactNode;
  onSearch?: (query: string) => void;
}>;

const ItemList = ({ children, title, action: Action, onSearch }: Props) => {
  const { isActive } = useConversation();
  const [mounted, setMounted] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  useEffect(() => {
    if (onSearch) {
      onSearch(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      setSearchQuery("");
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  if (!mounted) return null;

  return (
    <div
      className={cn("hidden h-full w-full lg:flex-none lg:w-80", {
        block: !isActive,
        "lg:block": isActive,
      })}
    >
      <Card className="h-full w-full flex flex-col border-0 shadow-sm bg-card">
        {/* Header Section */}
        <div className="flex-none px-5 pt-5 pb-3">
          {isSearchExpanded ? (
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="h-11 pl-10 pr-10 bg-muted/50 border-border/50 focus-visible:ring-2 focus-visible:ring-primary/20 rounded-lg"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={searchQuery ? handleClearSearch : handleSearchToggle}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-background"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSearchToggle}
                  className="h-9 w-9 hover:bg-muted"
                >
                  <Search className="h-4 w-4" />
                </Button>
                {Action && <div>{Action}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="mx-5 h-px bg-border" />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar">
          <div className="flex flex-col gap-1">{children}</div>
        </div>

        {/* Custom scrollbar styles */}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
            margin: 8px 0;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: hsl(var(--muted-foreground) / 0.15);
            border-radius: 4px;
            border: 2px solid transparent;
            background-clip: padding-box;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--muted-foreground) / 0.25);
            background-clip: padding-box;
          }
        `}</style>
      </Card>
    </div>
  );
};

export default ItemList;
