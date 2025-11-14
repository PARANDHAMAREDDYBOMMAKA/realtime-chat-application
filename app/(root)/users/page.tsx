"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, UserPlus, MessageSquare, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const UsersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const allUsers = useQuery(api.user.getAll);
  const currentUser = useQuery(api.user.getCurrent);
  const friends = useQuery(api.friends.get);
  const requests = useQuery(api.requests.get);
  const conversations = useQuery(api.conversations.get);

  const sendFriendRequest = useMutation(api.request.create);

  const filteredUsers = useMemo(() => {
    if (!allUsers || !currentUser) return [];

    // Filter out current user
    let users = allUsers.filter((user) => user._id !== currentUser._id);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      users = users.filter(
        (user) =>
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    return users;
  }, [allUsers, currentUser, searchQuery]);

  const getUserStatus = (userId: string) => {
    // Check if already friends
    const isFriend = friends?.some(
      (friend) => friend._id === userId
    );
    if (isFriend) return "friend";

    // Check if received a request from this user (requests query returns requests TO current user)
    const requestReceived = requests?.some(
      (req) => req.sender._id === userId
    );
    if (requestReceived) return "received";

    // For pending requests (sent by current user), we'd need a different query
    // For now, we'll skip this check as the requests.get only returns received requests
    // TODO: Add a query to get sent requests

    return "none";
  };

  const handleSendRequest = async (username: string, userEmail: string) => {
    try {
      await sendFriendRequest({ email: userEmail });
      toast.success(`Friend request sent to ${username}`);
    } catch (error) {
      toast.error("Failed to send friend request");
      console.error(error);
    }
  };

  const handleStartConversation = async (userId: string) => {
    try {
      // Find if conversation already exists
      const conversation = conversations?.find(
        (conv) => !conv.conversation.isGroup && conv.otherMember?._id === userId
      );

      if (conversation) {
        // Navigate to existing conversation
        router.push(`/conversations/${conversation.conversation._id}`);
      } else {
        toast.error("Could not find conversation with this user");
      }
    } catch (error) {
      toast.error("Failed to start conversation");
      console.error(error);
    }
  };

  if (!allUsers || !currentUser) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <UsersIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">User Directory</h1>
            <p className="text-sm text-muted-foreground">
              Find and connect with {filteredUsers.length} users
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredUsers.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((user) => {
              const status = getUserStatus(user._id);
              const now = Date.now();
              const lastSeen = user.lastSeen || 0;
              const timeDiff = now - lastSeen;

              let userStatus: "online" | "offline" | "away" = "offline";
              if (timeDiff <= 5 * 60 * 1000) {
                userStatus = user.status || "offline";
              } else if (timeDiff <= 10 * 60 * 1000) {
                userStatus = "away";
              }

              return (
                <div
                  key={user._id}
                  className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={user.imageUrl} alt={user.username} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                          {user.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {/* Status indicator */}
                      <div
                        className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-card ${
                          userStatus === "online"
                            ? "bg-green-500"
                            : userStatus === "away"
                            ? "bg-yellow-500"
                            : "bg-gray-400"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{user.username}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>

                      {/* Status badge */}
                      <div className="mt-2">
                        {status === "friend" && (
                          <Badge variant="secondary" className="text-xs">
                            Friend
                          </Badge>
                        )}
                        {status === "received" && (
                          <Badge variant="default" className="text-xs">
                            Request Received
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex gap-2">
                    {status === "friend" ? (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleStartConversation(user._id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    ) : status === "received" ? (
                      <Button
                        size="sm"
                        className="flex-1"
                        variant="default"
                        onClick={() => router.push("/friends")}
                      >
                        View Request
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSendRequest(user.username, user.email)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Friend
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <Search className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-medium text-muted-foreground">No users found</h3>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Try adjusting your search criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
