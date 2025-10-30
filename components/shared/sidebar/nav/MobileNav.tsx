"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme/theme-toggle";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { useConversation } from "@/hooks/useConversation";
import { useNavigation } from "@/hooks/useNavigation";
import { UserButton } from "@clerk/nextjs";
import { TooltipContent } from "@radix-ui/react-tooltip";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const MobileNav = () => {
  const paths = useNavigation();
  const { isActive } = useConversation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isActive) return null;
  if (!mounted) return null;

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
    >
      <Card className="fixed bottom-4 left-4 right-4 flex items-center h-16 p-2 lg:hidden border border-border/20 shadow-xl bg-gradient-to-r from-background/95 to-background/90 backdrop-blur-xl z-50 rounded-2xl overflow-hidden">
        {/* Enhanced background elements */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-blue-500/10 to-primary/20 opacity-20 blur-xl"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
        </div>

        <nav className="w-full relative z-10">
          <ul className="flex justify-evenly items-center">
            {paths.map((path, id) => {
              return (
                <motion.li
                  key={id}
                  className="relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href={path.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant={path.active ? "default" : "ghost"}
                          className={`relative transition-all duration-300 h-10 w-10 rounded-xl ${
                            path.active
                              ? "bg-gradient-to-br from-primary to-primary/90 shadow-lg shadow-primary/25 border-none"
                              : "hover:bg-primary/10 hover:border-primary/30 bg-background/50 border border-border/30"
                          }`}
                        >
                          <span
                            className={`transition-all duration-300 ${
                              path.active
                                ? "text-primary-foreground scale-110"
                                : "text-muted-foreground group-hover:text-primary"
                            }`}
                          >
                            {path.icon}
                          </span>
                          {path.active && (
                            <motion.span
                              className="absolute inset-0 rounded-xl bg-primary/20"
                              animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.8, 0.2, 0.8],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "loop",
                              }}
                            />
                          )}
                          {path.count ? (
                            <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs animate-pulse bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm border-2 border-background min-w-[18px] h-[18px] flex items-center justify-center">
                              {path.count}
                            </Badge>
                          ) : null}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover/95 text-popover-foreground px-3 py-1.5 rounded-md shadow-md backdrop-blur-sm border border-border/30">
                        <p>{path.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </Link>
                </motion.li>
              );
            })}
            <motion.li whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <ThemeToggle />
            </motion.li>
            <motion.li
              className="flex flex-col items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative ring-2 ring-border/30 hover:ring-primary/50 rounded-full transition-all duration-300 p-1 bg-background/50">
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    boxShadow: [
                      "0 0 0 0px rgba(var(--primary-rgb, 59 130 246), 0.1)",
                      "0 0 0 4px rgba(var(--primary-rgb, 59 130 246), 0.05)",
                      "0 0 0 0px rgba(var(--primary-rgb, 59 130 246), 0.1)",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <UserButton afterSignOutUrl="/" />
              </div>
            </motion.li>
          </ul>
        </nav>
      </Card>
    </motion.div>
  );
};

export default MobileNav;
