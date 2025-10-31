"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useConversation } from "@/hooks/useConversation";
import { cn } from "@/lib/utils";
import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn("hidden h-full w-full lg:flex-none lg:w-80", {
        block: !isActive,
        "lg:block": isActive,
      })}
    >
      <Card className="h-full w-full p-4 border-0 shadow-none bg-background/50 backdrop-blur-sm">
        {/* Subtle top border accent */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        {/* Content */}
        <div className="relative h-full flex flex-col">
          {/* Header & Search */}
          {isSearchExpanded ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mb-3 overflow-hidden"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="pl-10 pr-10 h-12 bg-muted/30 border-0 focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={searchQuery ? handleClearSearch : handleSearchToggle}
                    className="h-8 w-8 rounded-full hover:bg-muted/50 transition-colors"
                    title={searchQuery ? "Clear search" : "Close search"}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="mb-4 flex items-center justify-between pb-3"
            >
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSearchToggle}
                  className="h-9 w-9 rounded-full hover:bg-muted/50 transition-all hover:scale-105 active:scale-95"
                >
                  <Search className="h-4 w-4" />
                </Button>
                {Action && <div>{Action}</div>}
              </div>
            </motion.div>
          )}

          {/* Content Area */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={cn(
              "flex-1 w-full flex flex-col gap-1.5 overflow-y-auto pr-2 custom-scrollbar"
            )}
          >
            {children}
          </motion.div>
        </div>

        {/* Custom scrollbar styles */}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: hsl(var(--muted-foreground) / 0.2);
            border-radius: 10px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--muted-foreground) / 0.3);
          }
        `}</style>
      </Card>
    </motion.div>
  );
};

export default ItemList;
