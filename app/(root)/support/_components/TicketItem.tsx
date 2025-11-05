"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

type Props = {
  id: Id<"supportTickets">;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  createdAt: number;
  replyCount?: number;
  isAdmin?: boolean;
  userName?: string;
};

const TicketItem = ({ id, subject, status, priority, createdAt, replyCount, isAdmin, userName }: Props) => {
  const statusColors = {
    open: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    in_progress: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    resolved: "bg-green-500/10 text-green-500 border-green-500/20",
    closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  };

  const priorityColors = {
    low: "bg-slate-500/10 text-slate-500",
    medium: "bg-orange-500/10 text-orange-500",
    high: "bg-red-500/10 text-red-500",
  };

  return (
    <Link href={`/support/${id}`}>
      <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer border-border/50">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate text-sm">{subject}</h3>
              {isAdmin && userName && (
                <p className="text-xs text-muted-foreground mt-0.5">by {userName}</p>
              )}
            </div>
            <Badge variant="outline" className={cn("text-xs shrink-0", priorityColors[priority])}>
              {priority}
            </Badge>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={cn("text-xs", statusColors[status])}>
                {status.replace("_", " ")}
              </Badge>
              {replyCount !== undefined && replyCount > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{replyCount}</span>
                </div>
              )}
            </div>
            <span>{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default TicketItem;
