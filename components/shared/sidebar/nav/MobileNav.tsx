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
      <Card className="fixed bottom-4 w-[calc(100vw-32px)] flex items-center h-16 p-2 lg:hidden border border-border/40 shadow-lg bg-gradient-to-r from-background/90 to-background/95 backdrop-blur-md z-50 dark:shadow-primary/10">
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="absolute inset-0 bg-noise opacity-[0.015]"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-30 blur-xl"></div>
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
                      <TooltipTrigger>
                        <Button
                          size="icon"
                          variant={path.active ? "default" : "outline"}
                          className={`transition-all duration-300 ${path.active ? "shadow-md shadow-primary/20" : "hover:border-primary/50"}`}
                        >
                          <span
                            className={`transition-all duration-300 ${path.active ? "text-primary-foreground scale-110" : "text-foreground group-hover:text-primary"}`}
                          >
                            {path.icon}
                          </span>
                          {path.active && (
                            <span className="absolute inset-0 rounded-md bg-primary/10 animate-ping opacity-75"></span>
                          )}
                        </Button>
                        {path.count ? (
                          <Badge className="absolute left-6 bottom-7 px-2 animate-pulse bg-gradient-to-r from-primary to-primary/80">
                            {path.count}
                          </Badge>
                        ) : null}
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
              <div className="ring-2 ring-border/40 hover:ring-primary/50 rounded-full transition-all duration-300 p-0.5">
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
