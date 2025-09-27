import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Id } from "@/convex/_generated/dataModel";
import { User } from "lucide-react";
import Link from "next/link";
import React from "react";
import { motion } from "framer-motion";

type Props = {
  id: Id<"conversations">;
  imageUrl: string;
  username: string;
  lstMsgSender?: string;
  lstMsgContent?: string;
  index?: number;
};

const DMConversationItem = ({
  id,
  imageUrl,
  username,
  lstMsgContent,
  lstMsgSender,
  index = 0,
}: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="w-full"
    >
      <Link href={`/conversations/${id}`} className="w-full block">
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Card className="p-3 flex flex-row items-center gap-4 truncate border border-border/20 hover:border-primary/40 transition-all duration-300 hover:shadow-md bg-gradient-to-r hover:from-primary/5 hover:to-transparent relative overflow-hidden group">
            {/* Background elements */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
              <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
              <div className="absolute -inset-[100%] bg-gradient-to-tr from-primary/10 via-transparent to-transparent rotate-45 group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
            </div>

            {/* Content */}
            <div className="flex flex-row items-center gap-4 truncate w-full relative z-10">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-primary-foreground/20 blur-md opacity-0 group-hover:opacity-100"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                />
                <Avatar className="border-2 border-border/30 group-hover:border-primary/50 transition-all duration-300 h-10 w-10 ring-2 ring-background shadow-sm">
                  <AvatarImage src={imageUrl} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-muted/80 to-muted-foreground/10">
                    <User className="text-foreground/70 h-5 w-5" />
                  </AvatarFallback>
                </Avatar>

                {/* Status indicator - could be dynamic based on user status */}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background"></span>
              </motion.div>

              <div className="flex flex-col truncate w-full">
                <div className="flex items-center justify-between">
                  <h4 className="truncate font-medium group-hover:text-primary transition-colors duration-300 flex items-center gap-1">
                    {username}
                    <motion.span
                      className="inline-block h-1 w-1 rounded-full bg-primary/80 opacity-0 group-hover:opacity-100"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </h4>

                  {/* Time indicator - could be dynamic */}
                  <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {lstMsgSender && lstMsgContent ? (
                  <span className="text-sm text-muted-foreground flex truncate overflow-ellipsis">
                    <p className="font-semibold">
                      {lstMsgSender}
                      {":"}&nbsp;
                    </p>
                    <motion.p
                      className="truncate overflow-ellipsis"
                      initial={{ color: "var(--muted-foreground)" }}
                      whileHover={{ color: "var(--foreground)" }}
                    >
                      {lstMsgContent}
                    </motion.p>
                  </span>
                ) : (
                  <p className="text-sm text-muted-foreground truncate italic group-hover:text-muted-foreground/80">
                    <motion.span
                      initial={{ backgroundPosition: "0% 100%" }}
                      whileHover={{ backgroundPosition: "100% 100%" }}
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, var(--muted-foreground), var(--primary))",
                        backgroundSize: "200% 100%",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        color: "transparent",
                        backgroundRepeat: "no-repeat",
                        display: "inline-block",
                      }}
                      transition={{ duration: 0.8 }}
                    >
                      Start the conversation!
                    </motion.span>
                  </p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default DMConversationItem;
