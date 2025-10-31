"use client";

import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useConversation } from "@/hooks/useConversation";
import { api } from "@/convex/_generated/api";
import { useTyping } from "@/hooks/useTyping";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SendHorizontal, Smile, Paperclip, Mic, X, Square, Image, Video, FileText, Reply, AtSign } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  conversationId: Id<"conversations">;
  replyTo?: Id<"messages"> | null;
  onCancelReply?: () => void;
}

export default function ChatInput({ conversationId, replyTo, onCancelReply }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showRecordingPrompt, setShowRecordingPrompt] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionedUsers, setMentionedUsers] = useState<Map<string, Id<"users">>>(new Map());
  const [mentionStartPos, setMentionStartPos] = useState<number>(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const mentionSuggestionsRef = useRef<HTMLDivElement>(null);

  const { user } = useUser();
  const { toast } = useToast();
  const { theme, systemTheme } = useTheme();
  const createMessage = useMutation(api.message.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const { startTyping, stopTyping } = useTyping({ conversationId });

  // Query mentionable users
  const mentionableUsers = useQuery(
    api.mentions.getMentionableUsers,
    conversationId && showMentionSuggestions
      ? { conversationId, searchQuery: mentionSearch }
      : "skip"
  );

  // Get the message being replied to
  const replyToMessageData = useQuery(
    api.message.getById,
    replyTo ? { messageId: replyTo } : "skip"
  );

  // Determine the current theme for emoji picker
  const currentTheme = theme === "system" ? systemTheme : theme;
  const emojiTheme = (currentTheme === "dark" ? "dark" : "light") as Theme;

  const handleTyping = () => {
    startTyping();
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    if (!user?.id || !conversationId) return;

    setIsUploading(true);
    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();

      // Determine message type based on file type
      let messageType = "file";
      if (file.type.startsWith("image/")) {
        messageType = "image";
      } else if (file.type.startsWith("video/")) {
        messageType = "video";
      } else if (file.type.startsWith("audio/")) {
        messageType = "audio";
      }

      // Create message with file
      await createMessage({
        conversationId,
        type: messageType,
        content: [storageId, file.name, file.size.toString()],
      });

      toast({
        title: "File uploaded",
        description: `${file.name} has been sent successfully`,
      });

      setSelectedFile(null);
      stopTyping();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Audio recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      isCancelledRef.current = false;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Only upload if not cancelled
        if (!isCancelledRef.current) {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, {
            type: "audio/webm",
          });

          await uploadFile(audioFile);
        }

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        audioChunksRef.current = [];
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setShowRecordingPrompt(false);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast({
        title: "Recording started",
        description: "Speak your message",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      isCancelledRef.current = false;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      isCancelledRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      audioChunksRef.current = [];

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      // Stop all tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }

      toast({
        title: "Recording cancelled",
        description: "Audio recording was cancelled",
      });
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      setShowRecordingPrompt(true);
    }
  };

  // Extract mentioned user IDs from message and tracked mentions
  const extractMentionedUserIds = (text: string): Id<"users">[] => {
    const mentionRegex = /@(\w+)/g;
    const userIds: Id<"users">[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1];
      const userId = mentionedUsers.get(username);
      if (userId) {
        userIds.push(userId);
      }
    }

    return userIds;
  };

  // Insert mention at cursor position
  const insertMention = (username: string, userId: Id<"users">) => {
    if (!textareaRef.current) return;

    // Replace spaces with underscores for mention format
    const mentionUsername = username.replace(/\s+/g, '_');

    const before = message.substring(0, mentionStartPos);
    const after = message.substring(textareaRef.current.selectionStart);
    const newMessage = `${before}@${mentionUsername} ${after}`;

    setMessage(newMessage);

    // Track this mention using the formatted username
    setMentionedUsers(prev => new Map(prev).set(mentionUsername, userId));

    setShowMentionSuggestions(false);
    setMentionSearch("");
    setSelectedMentionIndex(0);

    // Set cursor position after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = before.length + mentionUsername.length + 2; // +2 for @ and space
        textareaRef.current.selectionStart = newPos;
        textareaRef.current.selectionEnd = newPos;
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Handle message input change
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    setMessage(value);
    handleTyping();

    // Check for @ mentions
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

      // Check if there's a space or newline after @, if so, don't show suggestions
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionStartPos(lastAtIndex);
        setMentionSearch(textAfterAt);
        setShowMentionSuggestions(true);
        setSelectedMentionIndex(0);
        return;
      }
    }

    // Hide suggestions if @ is not found or conditions not met
    setShowMentionSuggestions(false);
    setMentionSearch("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user?.id || !conversationId) return;

    try {
      // Extract mentioned user IDs
      const mentionedIds = extractMentionedUserIds(message);

      const messageData = {
        conversationId,
        type: "text",
        content: [message],
        replyTo: replyTo || undefined,
        mentionedUserIds: mentionedIds.length > 0 ? mentionedIds : undefined,
      };

      // Create message in database
      await createMessage(messageData);

      // Clear input, stop typing, and clear reply
      setMessage("");
      setMentionedUsers(new Map());
      stopTyping();
      if (onCancelReply) onCancelReply();

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Handle ESC key to close recording prompt
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showRecordingPrompt) {
        setShowRecordingPrompt(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showRecordingPrompt]);

  return (
    <div className="relative bg-gradient-to-t from-background/95 to-background/80 backdrop-blur-sm border-t border-border/30">
      {/* Reply Preview */}
      <AnimatePresence>
        {replyTo && replyToMessageData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 pt-3 pb-2"
          >
            <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-3 border-l-2 border-primary">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Reply className="h-3 w-3 text-primary" />
                  <span className="text-xs font-semibold text-primary">
                    Replying to {replyToMessageData.senderName}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {replyToMessageData.content[0]}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancelReply}
                className="h-6 w-6 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4">
      <AnimatePresence>
        {showRecordingPrompt && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              onClick={() => setShowRecordingPrompt(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-[-50px] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[90%] max-w-md"
            >
              <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 text-center space-y-6">
                <motion.div
                  className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Mic className="h-10 w-10 text-primary" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Record Audio Message</h3>
                  <p className="text-muted-foreground text-sm">
                    Do you want to start recording?
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowRecordingPrompt(false)}
                    className="gap-2 flex-1"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={startRecording}
                    className="gap-2 flex-1 bg-primary hover:bg-primary/90"
                  >
                    <Mic className="h-4 w-4" />
                    Start
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 right-4 z-50"
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={emojiTheme}
              searchDisabled
              skinTonesDisabled
              height={400}
              width={350}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording Overlay */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 bg-background/95 backdrop-blur-md z-40 flex items-center justify-center rounded-2xl border border-destructive/50"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-4 h-4 bg-destructive rounded-full"
                />
                <span className="text-2xl font-mono font-bold">
                  {formatTime(recordingTime)}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">Recording audio...</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelRecording}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={stopRecording}
                  className="gap-2 bg-destructive hover:bg-destructive/90"
                >
                  <Square className="h-4 w-4" />
                  Stop & Send
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Input container */}
      <motion.div
        className={`relative flex items-end gap-3 p-3 rounded-2xl bg-gradient-to-r from-muted/50 to-muted/30 border transition-all duration-300 backdrop-blur-sm ${
          isFocused
            ? "border-primary/50 shadow-lg shadow-primary/10 bg-gradient-to-r from-primary/5 to-background/50"
            : "border-border/40 hover:border-border/60"
        }`}
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Animated background */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0"
            animate={isFocused ? { opacity: [0, 0.5, 0] } : { opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Action buttons - left side */}
        <div className="flex items-center gap-1 relative z-10">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isRecording}
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-all duration-200"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              // Handle mention suggestions navigation
              if (showMentionSuggestions && mentionableUsers && mentionableUsers.length > 0) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSelectedMentionIndex((prev) =>
                    prev < mentionableUsers.length - 1 ? prev + 1 : 0
                  );
                  return;
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSelectedMentionIndex((prev) =>
                    prev > 0 ? prev - 1 : mentionableUsers.length - 1
                  );
                  return;
                } else if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const selectedUser = mentionableUsers[selectedMentionIndex];
                  if (selectedUser) {
                    insertMention(selectedUser.username, selectedUser.id);
                  }
                  return;
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setShowMentionSuggestions(false);
                  setMentionSearch("");
                  return;
                }
              }

              // Normal enter key behavior
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Type your message..."
            className="w-full resize-none bg-transparent border-0 outline-none placeholder:text-muted-foreground/60 text-foreground text-sm leading-relaxed min-h-[24px] max-h-[120px] py-1"
            rows={1}
            style={{ lineHeight: '1.5' }}
          />

          {/* Mention suggestions dropdown */}
          <AnimatePresence>
            {showMentionSuggestions && mentionableUsers && mentionableUsers.length > 0 && (
              <motion.div
                ref={mentionSuggestionsRef}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute bottom-full left-0 mb-2 w-64 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50"
              >
                <div className="py-1 max-h-48 overflow-y-auto">
                  {mentionableUsers.map((user, index) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => insertMention(user.username, user.id)}
                      onMouseEnter={() => setSelectedMentionIndex(index)}
                      className={cn(
                        "w-full px-3 py-2 flex items-center gap-2 hover:bg-accent transition-colors text-left",
                        {
                          "bg-accent": index === selectedMentionIndex,
                        }
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.imageUrl} alt={user.username} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.username}</p>
                      </div>
                      {index === selectedMentionIndex && (
                        <AtSign className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons - right side */}
        <div className="flex items-center gap-1 relative z-10">
          {isUploading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-8 w-8 flex items-center justify-center"
            >
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            </motion.div>
          ) : (
            <>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={isRecording}
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-all duration-200"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMicClick}
                  disabled={isUploading}
                  className={`h-8 w-8 rounded-full transition-all duration-200 ${
                    isRecording
                      ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                  }`}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </motion.div>
            </>
          )}

          {/* Send button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Button
              onClick={handleSubmit}
              disabled={!message.trim() || isUploading || isRecording}
              size="icon"
              className={`h-9 w-9 rounded-full transition-all duration-300 shadow-sm ${
                message.trim() && !isUploading && !isRecording
                  ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-primary/20 hover:shadow-primary/30"
                  : "bg-muted/50 text-muted-foreground cursor-not-allowed hover:bg-muted/50"
              }`}
            >
              <motion.div
                animate={message.trim() ? { rotate: [0, 15, -15, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                <SendHorizontal className="h-4 w-4" />
              </motion.div>
            </Button>
          </motion.div>
        </div>

        {/* Input focus ring effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={isFocused ? {
            boxShadow: [
              "0 0 0 0px rgba(var(--primary-rgb, 59 130 246), 0.1)",
              "0 0 0 4px rgba(var(--primary-rgb, 59 130 246), 0.1)",
              "0 0 0 0px rgba(var(--primary-rgb, 59 130 246), 0.1)",
            ]
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>

      {/* Character count (optional) */}
      <AnimatePresence>
        {message.length > 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-1 right-16 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full border border-border/30"
          >
            {message.length}/500
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
