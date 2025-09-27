"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme/theme-toggle";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigation } from "@/hooks/useNavigation";
import { UserButton } from "@clerk/nextjs";
import { TooltipContent } from "@radix-ui/react-tooltip";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const DesktopNav = () => {
  const paths = useNavigation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
    >
      <Card className="hidden lg:flex lg:flex-col justify-between lg:items-center lg:h-full lg:w-16 lg:px-2 lg:py-4 bg-gradient-to-b from-background/95 to-background/90 backdrop-blur-md border-border/40 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="absolute inset-0 bg-noise opacity-[0.015]"></div>
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary/50 via-primary/20 to-primary/50"></div>
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/50 via-primary/20 to-primary/50"></div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/50 via-primary/20 to-primary/50"></div>
        </div>

        <nav className="relative z-10">
          <ul className="flex flex-col items-center gap-4">
            {paths.map((path, id) => {
              return (
                <motion.li
                  key={id}
                  className="relative group w-full flex justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: id * 0.05 }}
                >
                  <Link href={path.href} className="w-full flex justify-center">
                    <Tooltip>
                      <TooltipTrigger className="w-full flex justify-center">
                        <Button
                          size="icon"
                          variant={path.active ? "default" : "outline"}
                          className={`transition-all duration-300 w-10 h-10 ${
                            path.active
                              ? "shadow-md shadow-primary/20 bg-gradient-to-br from-primary to-primary/90 border-none"
                              : "hover:border-primary/50 bg-background/50"
                          }`}
                        >
                          <span
                            className={`transition-all duration-300 ${
                              path.active
                                ? "text-primary-foreground scale-110"
                                : "text-foreground group-hover:text-primary"
                            }`}
                          >
                            {path.icon}
                          </span>
                          {path.active && (
                            <motion.span
                              className="absolute inset-0 rounded-md bg-primary/10"
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.8, 0.2, 0],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "loop",
                              }}
                            />
                          )}
                        </Button>
                      </TooltipTrigger>
                      {path.count ? (
                        <Badge className="absolute right-0 top-0 px-2 bg-gradient-to-r from-primary to-primary/80 shadow-sm shadow-primary/20">
                          {path.count}
                        </Badge>
                      ) : null}
                      <TooltipContent
                        side="right"
                        className="bg-popover/95 text-popover-foreground px-3 py-1.5 rounded-md shadow-md backdrop-blur-sm border border-border/30"
                      >
                        <p>{path.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>

        <div className="flex flex-col items-center gap-6 relative z-10">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <ThemeToggle />
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-1 rounded-full ring-2 ring-border/40 hover:ring-primary/50 transition-all duration-300 relative"
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  "0 0 0 0px rgba(var(--primary-rgb), 0.2)",
                  "0 0 0 4px rgba(var(--primary-rgb), 0)",
                  "0 0 0 0px rgba(var(--primary-rgb), 0.2)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <UserButton afterSignOutUrl="/" />
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};

export default DesktopNav;
