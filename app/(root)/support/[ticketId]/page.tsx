"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const TicketDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.ticketId as Id<"supportTickets">;

  const [replyMessage, setReplyMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ticketDetails = useQuery(api.support.getTicketDetails, { ticketId });
  const isAdmin = useQuery(api.support.isAdmin);
  const addReply = useMutation(api.support.addReply);
  const updateStatus = useMutation(api.support.updateTicketStatus);
  const updatePriority = useMutation(api.support.updateTicketPriority);

  // Auto-scroll to bottom when new replies come in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ticketDetails?.replies]);

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    // Prevent sending on closed tickets
    if (ticketDetails?.status === "closed") {
      toast.error("Cannot send messages on closed tickets");
      return;
    }

    setIsSubmitting(true);

    try {
      await addReply({
        ticketId,
        message: replyMessage.trim(),
      });

      setReplyMessage("");
      toast.success("Reply sent successfully!");
    } catch (error) {
      toast.error("Failed to send reply");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopenTicket = async () => {
    try {
      await updateStatus({
        ticketId,
        status: "open",
      });
      toast.success("Ticket reopened successfully!");
    } catch (error) {
      toast.error("Failed to reopen ticket");
      console.error(error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({
        ticketId,
        status: newStatus as "open" | "in_progress" | "resolved" | "closed",
      });
      toast.success("Status updated successfully!");
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      await updatePriority({
        ticketId,
        priority: newPriority as "low" | "medium" | "high",
      });
      toast.success("Priority updated successfully!");
    } catch (error) {
      toast.error("Failed to update priority");
      console.error(error);
    }
  };

  if (!ticketDetails) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

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
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-none border-b border-border p-4">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold mb-2">{ticketDetails.subject}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin ? (
                <>
                  <Select value={ticketDetails.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[140px] h-7">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ticketDetails.status === "open" && (
                        <SelectItem value="open" disabled>
                          Open (user created)
                        </SelectItem>
                      )}
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={ticketDetails.priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger className="w-[120px] h-7">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", statusColors[ticketDetails.status])}
                  >
                    {ticketDetails.status.replace("_", " ")}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", priorityColors[ticketDetails.priority])}
                  >
                    {ticketDetails.priority}
                  </Badge>
                </>
              )}
              <span className="text-xs text-muted-foreground">
                Created {formatDistanceToNow(ticketDetails.createdAt, { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {/* Original Ticket */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={ticketDetails.user?.imageUrl} />
                <AvatarFallback>
                  {ticketDetails.user?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">
                    {ticketDetails.user?.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(ticketDetails.createdAt, { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {ticketDetails.description}
                </p>
              </div>
            </div>
          </Card>

          {/* Replies */}
          {ticketDetails.replies.map((reply) => (
            <Card
              key={reply._id}
              className={cn(
                "p-4",
                reply.isAdminReply && "bg-primary/5 border-primary/20"
              )}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={reply.user?.imageUrl} />
                  <AvatarFallback>
                    {reply.user?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{reply.user?.username}</span>
                    {reply.isAdminReply && (
                      <Badge variant="secondary" className="text-xs">
                        Admin
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(reply.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{reply.message}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Reply Input */}
      <div className="flex-none border-t border-border p-4">
        <div className="max-w-3xl mx-auto">
          {ticketDetails.status === "closed" ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                This ticket is closed. No further messages can be sent.
              </p>
              {!isAdmin && (
                <p className="text-xs text-muted-foreground mt-1">
                  This ticket cannot be reopened.
                </p>
              )}
            </div>
          ) : ticketDetails.status === "resolved" && !isAdmin ? (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                This ticket has been resolved.
              </p>
              <Button onClick={handleReopenTicket} variant="outline" size="sm">
                Reopen Ticket
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
                disabled={isSubmitting}
                rows={3}
                className="resize-none"
              />
              <Button
                onClick={handleSendReply}
                disabled={isSubmitting || !replyMessage.trim()}
                className="shrink-0"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;
