import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Admin email addresses
const ADMIN_EMAILS = ["rparandhama63@gmail.com", "sunnyreddy2005sun@gmail.com"];

// Check if user is admin
export const isAdmin = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return false;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();

        return user ? ADMIN_EMAILS.includes(user.email) : false;
    }
});

// Create a new support ticket
export const createTicket = mutation({
    args: {
        subject: v.string(),
        description: v.string(),
        priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        const now = Date.now();

        const ticketId = await ctx.db.insert("supportTickets", {
            userId: user._id,
            subject: args.subject,
            description: args.description,
            status: "open",
            priority: args.priority,
            createdAt: now,
            updatedAt: now,
        });

        return ticketId;
    }
});

// Get all tickets (admin only)
export const getAllTickets = query({
    args: {
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user || !ADMIN_EMAILS.includes(user.email)) {
            throw new Error("Admin access required");
        }

        let tickets;

        if (args.status && (args.status === "open" || args.status === "in_progress" || args.status === "resolved" || args.status === "closed")) {
            tickets = await ctx.db
                .query("supportTickets")
                .withIndex("by_status", (q) => q.eq("status", args.status as "open" | "in_progress" | "resolved" | "closed"))
                .order("desc")
                .collect();
        } else {
            tickets = await ctx.db
                .query("supportTickets")
                .order("desc")
                .collect();
        }


        // Get user details for each ticket
        const ticketsWithUsers = await Promise.all(
            tickets.map(async (ticket) => {
                const ticketUser = await ctx.db.get(ticket.userId);
                return {
                    ...ticket,
                    user: ticketUser,
                };
            })
        );

        return ticketsWithUsers;
    }
});

// Get user's own tickets
export const getUserTickets = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        const tickets = await ctx.db
            .query("supportTickets")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .order("desc")
            .collect();

        return tickets;
    }
});

// Get ticket details with replies
export const getTicketDetails = query({
    args: {
        ticketId: v.id("supportTickets"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        const ticket = await ctx.db.get(args.ticketId);
        if (!ticket) throw new Error("Ticket not found");

        // Check if user is ticket owner or admin
        const isUserAdmin = ADMIN_EMAILS.includes(user.email);
        if (ticket.userId !== user._id && !isUserAdmin) {
            throw new Error("Access denied");
        }

        // Get ticket owner details
        const ticketOwner = await ctx.db.get(ticket.userId);

        // Get all replies
        const replies = await ctx.db
            .query("ticketReplies")
            .withIndex("by_ticketId", (q) => q.eq("ticketId", args.ticketId))
            .collect();

        // Get user details for each reply
        const repliesWithUsers = await Promise.all(
            replies.map(async (reply) => {
                const replyUser = await ctx.db.get(reply.userId);
                return {
                    ...reply,
                    user: replyUser,
                };
            })
        );

        return {
            ...ticket,
            user: ticketOwner,
            replies: repliesWithUsers,
        };
    }
});

// Add reply to ticket
export const addReply = mutation({
    args: {
        ticketId: v.id("supportTickets"),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        const ticket = await ctx.db.get(args.ticketId);
        if (!ticket) throw new Error("Ticket not found");

        // Prevent replies on closed tickets
        if (ticket.status === "closed") {
            throw new Error("Cannot reply to closed tickets");
        }

        // Check if user is ticket owner or admin
        const isUserAdmin = ADMIN_EMAILS.includes(user.email);
        if (ticket.userId !== user._id && !isUserAdmin) {
            throw new Error("Access denied");
        }

        const now = Date.now();

        // Create reply
        await ctx.db.insert("ticketReplies", {
            ticketId: args.ticketId,
            userId: user._id,
            message: args.message,
            isAdminReply: isUserAdmin,
            createdAt: now,
        });

        // Update ticket status and updatedAt
        // If ticket is resolved and user replies, reopen it
        if (ticket.status === "resolved" && !isUserAdmin) {
            await ctx.db.patch(args.ticketId, {
                status: "open",
                updatedAt: now,
            });
        } else if (ticket.status === "resolved" && isUserAdmin) {
            // Admin can reply to resolved tickets without reopening
            await ctx.db.patch(args.ticketId, {
                updatedAt: now,
            });
        } else {
            await ctx.db.patch(args.ticketId, {
                updatedAt: now,
            });
        }

        return { success: true };
    }
});

// Update ticket status
// Admins can update to any status except "open" (reopen)
// Only ticket owners can reopen tickets
export const updateTicketStatus = mutation({
    args: {
        ticketId: v.id("supportTickets"),
        status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        const ticket = await ctx.db.get(args.ticketId);
        if (!ticket) throw new Error("Ticket not found");

        const isUserAdmin = ADMIN_EMAILS.includes(user.email);
        const isTicketOwner = ticket.userId === user._id;

        // Reopening (status = "open") is only allowed for ticket owners
        if (args.status === "open") {
            if (!isTicketOwner) {
                throw new Error("Only ticket owner can reopen tickets");
            }
        } else {
            // Other status changes require admin access
            if (!isUserAdmin) {
                throw new Error("Admin access required");
            }
        }

        await ctx.db.patch(args.ticketId, {
            status: args.status,
            updatedAt: Date.now(),
        });

        return { success: true };
    }
});

// Update ticket priority (admin only)
export const updateTicketPriority = mutation({
    args: {
        ticketId: v.id("supportTickets"),
        priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user || !ADMIN_EMAILS.includes(user.email)) {
            throw new Error("Admin access required");
        }

        await ctx.db.patch(args.ticketId, {
            priority: args.priority,
            updatedAt: Date.now(),
        });

        return { success: true };
    }
});
