"use client";

import ItemList from "@/components/shared/item-list/ItemList";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Loader2, ShieldCheck } from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import CreateTicketDialog from "./_components/CreateTicketDialog";
import TicketItem from "./_components/TicketItem";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = React.PropsWithChildren<object>;

const SupportLayout = ({ children }: Props) => {
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isAdmin = useQuery(api.support.isAdmin);
  const userTickets = useQuery(api.support.getUserTickets);
  const allTickets = useQuery(
    api.support.getAllTickets,
    isAdmin ? (statusFilter !== "all" ? { status: statusFilter } : {}) : "skip"
  );

  // Use appropriate tickets based on admin status
  const tickets = isAdmin ? allTickets : userTickets;

  // Filter tickets based on search query
  const filteredTickets = useMemo(() => {
    if (!tickets || !searchQuery.trim()) return tickets;

    const query = searchQuery.toLowerCase();
    return tickets.filter((ticket) => {
      const subjectMatch = ticket.subject.toLowerCase().includes(query);
      // For admin viewing all tickets, also search by username
      if (isAdmin && "user" in ticket && ticket.user) {
        const userMatch = ticket.user.username?.toLowerCase().includes(query);
        return subjectMatch || userMatch;
      }
      return subjectMatch;
    });
  }, [tickets, searchQuery, isAdmin]);

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <>
      <ItemList
        title={isAdmin ? "Support - Admin" : "My Tickets"}
        action={!isAdmin ? <CreateTicketDialog /> : undefined}
        onSearch={(query) => setSearchQuery(query)}
      >
        {isAdmin && (
          <div className="px-2 pb-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              <span>Admin View - All Tickets</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {filteredTickets ? (
          filteredTickets.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center p-8">
              <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center">
                <p className="text-4xl">🎫</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {searchQuery ? "No tickets found" : isAdmin ? "No support tickets" : "No support tickets yet"}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {searchQuery
                    ? "Try a different search term"
                    : isAdmin
                    ? "Tickets will appear here"
                    : "Click the + button to create a support ticket"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTickets.map((ticket) => {
                const ticketWithUser = ticket as any;
                return (
                  <TicketItem
                    key={ticket._id}
                    id={ticket._id}
                    subject={ticket.subject}
                    status={ticket.status}
                    priority={ticket.priority}
                    createdAt={ticket.createdAt}
                    isAdmin={isAdmin}
                    userName={ticketWithUser.user?.username}
                  />
                );
              })}
            </div>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        )}
      </ItemList>
      {children}
    </>
  );
};

export default SupportLayout;
