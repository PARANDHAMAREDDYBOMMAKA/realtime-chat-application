"use client";
import { useAuth } from "@clerk/clerk-react";
import { ClerkProvider, SignInButton, SignUpButton } from "@clerk/nextjs";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  ConvexReactClient,
} from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { motion } from "framer-motion";
import React, { useState } from "react";
import PresenceProvider from "@/components/providers/PresenceProvider";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const convex = new ConvexReactClient(CONVEX_URL);

// Sample message data for the chat preview
const sampleMessages = [
  {
    user: "Sunny",
    message: "Has everyone seen the latest updates?",
    time: "10:30 AM",
  },
  {
    user: "Alex",
    message: "Yes! The new design looks amazing!",
    time: "10:32 AM",
  },
  {
    user: "Jordan",
    message: "I'm still reviewing it. What do you think?",
    time: "10:35 AM",
  },
  {
    user:"Sai",
    message:"Let's have a meet to discuss about the changes",
    time:"10:40 AM"
  }
];

// Feature showcase component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <motion.div
    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
    whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
    transition={{ duration: 0.3 }}
  >
    <div className="text-blue-500 dark:text-blue-400 text-2xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-300">{description}</p>
  </motion.div>
);

// Chat bubble component
interface ChatBubbleProps {
  user: string;
  message: string;
  time: string;
  isCurrentUser: boolean;
}

const ChatBubble = ({ user, message, time, isCurrentUser }: ChatBubbleProps) => (
  <div
    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-4`}
  >
    <div
      className={`max-w-xs md:max-w-md ${isCurrentUser ? "bg-blue-500 text-white" : "bg-white dark:bg-gray-700 text-gray-800 dark:text-white"} rounded-2xl p-3 shadow-md`}
    >
      <div className="flex justify-between items-center mb-1">
        <span
          className={`font-medium ${isCurrentUser ? "text-blue-100" : "text-blue-500 dark:text-blue-300"}`}
        >
          {user}
        </span>
        <span
          className={`text-xs ${isCurrentUser ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}
        >
          {time}
        </span>
      </div>
      <p>{message}</p>
    </div>
  </div>
);

const ConvexClientProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeTab, setActiveTab] = useState("chat");

  // Optimized floating particles background
  const particles = Array.from({ length: 8 }).map((_, i) => (
    <motion.div
      key={i}
      className={`absolute rounded-full blur-2xl opacity-10 ${
        i % 3 === 0
          ? "bg-blue-500"
          : i % 3 === 1
            ? "bg-indigo-500"
            : "bg-purple-500"
      }`}
      style={{
        width: `${Math.random() * 150 + 100}px`,
        height: `${Math.random() * 150 + 100}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        y: [0, Math.random() * 40 - 20, 0],
        x: [0, Math.random() * 40 - 20, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: Math.random() * 8 + 10,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  ));

  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        layout: {
          socialButtonsPlacement: "bottom",
          socialButtonsVariant: "blockButton",
        },
        variables: {
          colorPrimary: "#6366f1",
          colorBackground: "#ffffff",
          colorText: "#1f2937",
          colorTextSecondary: "#6b7280",
          colorInputBackground: "#f9fafb",
          colorInputText: "#1f2937",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-geist-sans), sans-serif",
        },
        elements: {
          rootBox: "mx-auto",
          card: "shadow-2xl border border-gray-200 dark:border-gray-700 rounded-2xl backdrop-blur-sm bg-white/95 dark:bg-gray-800/95",
          headerTitle: "text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent",
          headerSubtitle: "text-gray-600 dark:text-gray-400",
          formButtonPrimary:
            "bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl rounded-xl normal-case transition-all",
          formFieldInput:
            "rounded-lg border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700/50 dark:text-white",
          formFieldLabel: "font-semibold text-gray-700 dark:text-gray-300",
          footerActionLink: "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold",
          footerActionText: "text-gray-600 dark:text-gray-400",
          dividerLine: "bg-gray-200 dark:bg-gray-700",
          dividerText: "text-gray-500 dark:text-gray-400",
          socialButtonsBlockButton:
            "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium dark:text-white",
          identityPreviewText: "font-medium dark:text-white",
          identityPreviewEditButton: "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300",
          formFieldInputShowPasswordButton: "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
          otpCodeFieldInput: "border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white",
          alertText: "text-sm dark:text-gray-300",
        },
      }}
    >
      <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
        <AuthLoading>
          <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
            {/* Modern animated logo */}
            <div className="relative">
              {/* Outer spinning ring */}
              <motion.div
                className="absolute inset-0 -m-12"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <svg className="w-48 h-48" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#gradient1)"
                    strokeWidth="2"
                    strokeDasharray="70 200"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="50%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>

              {/* Inner counter-spinning ring */}
              <motion.div
                className="absolute inset-0 -m-8"
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <svg className="w-40 h-40" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#gradient2)"
                    strokeWidth="1.5"
                    strokeDasharray="50 150"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                  <defs>
                    <linearGradient id="gradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="50%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>

              {/* Center brand text */}
              <motion.div
                className="relative z-10 flex flex-col items-center justify-center w-24 h-24"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <svg
                    className="w-16 h-16"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Chat bubble icon */}
                    <motion.path
                      d="M50 10 C27 10, 10 25, 10 45 C10 55, 14 64, 20 70 L15 85 L32 77 C38 80, 44 82, 50 82 C73 82, 90 67, 90 45 C90 25, 73 10, 50 10 Z"
                      fill="url(#bubbleGradient)"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                    {/* Message dots */}
                    <motion.circle
                      cx="35"
                      cy="45"
                      r="4"
                      fill="white"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1, 1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                    />
                    <motion.circle
                      cx="50"
                      cy="45"
                      r="4"
                      fill="white"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1, 1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.circle
                      cx="65"
                      cy="45"
                      r="4"
                      fill="white"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1, 1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    />
                    <defs>
                      <linearGradient id="bubbleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="50%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </motion.div>
              </motion.div>

              {/* Orbiting dots */}
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  style={{
                    top: "50%",
                    left: "50%",
                    marginTop: "-4px",
                    marginLeft: "-4px",
                  }}
                  animate={{
                    x: [0, Math.cos((i * Math.PI) / 2) * 60, 0],
                    y: [0, Math.sin((i * Math.PI) / 2) * 60, 0],
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            {/* Brand name */}
            <motion.h1
              className="mt-16 text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Converse
            </motion.h1>

            {/* Loading text */}
            <motion.p
              className="mt-4 text-gray-600 dark:text-gray-300 font-medium text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Connecting to chat servers
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ...
              </motion.span>
            </motion.p>

            {/* Progress bar */}
            <motion.div
              className="mt-8 w-64 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </div>
        </AuthLoading>
        <Authenticated>
          <PresenceProvider>{children}</PresenceProvider>
        </Authenticated>
        <Unauthenticated>
          {/* Main container with proper overflow handling */}
          <div className="relative h-screen overflow-auto bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
            {/* Fixed background particles */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
              {particles}
            </div>

            {/* Scrollable content */}
            <div className="relative z-10">
              {/* Header - Fixed at top with improved responsiveness */}
              <div className="sticky top-0 z-20 px-4 sm:px-6 pt-4">
                <nav className="flex items-center justify-between py-4 mb-8 md:mb-12 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl px-4 sm:px-6 shadow-xl border border-white/20 dark:border-gray-700/20">
                  <div className="flex items-center">
                    <span className="text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                      Converse
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <SignInButton mode="modal">
                      <motion.button
                        className="px-3 sm:px-6 py-2 text-sm sm:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Sign In
                      </motion.button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <motion.button
                        className="px-3 sm:px-6 py-2 text-sm sm:text-base bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Sign Up
                      </motion.button>
                    </SignUpButton>
                  </div>
                </nav>
              </div>

              {/* Hero Section - Improved responsive layout */}
              <div className="container mx-auto px-4 sm:px-6 py-12 md:py-20 lg:py-24">
                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
                  <motion.div
                    className="text-center lg:text-left max-w-2xl flex-1"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                        Connect & Collaborate
                      </span>
                      <span className="block mt-2 text-gray-900 dark:text-white">
                        In Real-Time
                      </span>
                    </h1>
                    <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
                      Experience seamless communication with powerful messaging,
                      video calls, and team collaboration tools designed for modern teams.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                      <SignUpButton mode="modal">
                        <motion.button
                          className="px-8 py-4 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg text-lg w-full sm:w-auto"
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          Get Started Now
                        </motion.button>
                      </SignUpButton>
                      <SignInButton mode="modal">
                        <motion.button
                          className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 text-lg transition-colors w-full sm:w-auto"
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          Sign In
                        </motion.button>
                      </SignInButton>
                    </div>

                    {/* Feature tags */}
                    <div className="mt-10 flex flex-wrap gap-3 justify-center lg:justify-start">
                      {[
                        "Real-time Sync",
                        "Secure Messaging",
                        "Video Calls",
                        "Group Chats",
                      ].map((tag, i) => (
                        <motion.span
                          key={i}
                          className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold border border-blue-200 dark:border-blue-700/50"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                        >
                          {tag}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>

                  {/* Enhanced Chat UI Preview - More responsive */}
                  <motion.div
                    className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 w-full max-w-md lg:max-w-lg flex-1 border border-gray-200 dark:border-gray-700"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  >
                    {/* Chat header with tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
                      <button
                        className={`mr-6 pb-3 border-b-2 font-semibold text-sm transition-colors ${
                          activeTab === "chat"
                            ? "border-blue-500 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                        onClick={() => setActiveTab("chat")}
                      >
                        Team Chat
                      </button>
                      <button
                        className={`pb-3 border-b-2 font-semibold text-sm transition-colors ${
                          activeTab === "channels"
                            ? "border-blue-500 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                        onClick={() => setActiveTab("channels")}
                      >
                        Channels
                      </button>
                    </div>

                  {/* Chat messages */}
                  <div className="mt-4 space-y-4 max-h-64 overflow-y-auto">
                    {sampleMessages.map((msg, index) => (
                      <ChatBubble
                        key={index}
                        user={msg.user}
                        message={msg.message}
                        time={msg.time}
                        isCurrentUser={index === 1}
                      />
                    ))}
                  </div>

                    {/* Chat input */}
                    <div className="mt-6 flex items-center bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
                      <button className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 p-2 transition-colors">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      <input
                        type="text"
                        placeholder="Type your message..."
                        className="flex-1 bg-transparent border-none focus:ring-0 px-3 py-2 text-gray-800 dark:text-white outline-none text-sm"
                      />
                      <button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white p-2 rounded-lg transition-all">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Features Section */}
              <div className="container mx-auto px-4 py-16">
                <motion.h2
                  className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  Powerful Features For Modern Teams
                </motion.h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <FeatureCard
                      icon={
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      }
                      title="Real-time Messaging"
                      description="Send and receive messages instantly with our low-latency infrastructure."
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <FeatureCard
                      icon={
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      }
                      title="Enterprise Security"
                      description="End-to-end encryption and advanced permissions keep your data secure."
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <FeatureCard
                      icon={
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                      }
                      title="Team Collaboration"
                      description="Organize your team with channels, threads, and mentions."
                    />
                  </motion.div>
                </div>
              </div>


              {/* CTA Section */}
              <div className="container mx-auto px-4 py-16 text-center">
                <motion.div
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-12 shadow-xl"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7 }}
                >
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                    Ready to elevate your team communication?
                  </h2>
                  <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto">
                    Join thousands of teams who have transformed their workflow
                    with Converse.
                  </p>
                  <SignUpButton mode="modal">
                    <motion.button
                      className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg shadow-lg"
                      whileHover={{
                        scale: 1.05,
                        boxShadow: "0 20px 25px -5px rgba(255, 255, 255, 0.2)",
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      Get Started Today
                    </motion.button>
                  </SignUpButton>
                </motion.div>
              </div>

              {/* Footer */}
              <footer className="container mx-auto px-4 py-8 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <p className="text-gray-600 dark:text-gray-300 mb-4 md:mb-0">
                    © 2025 Converse. All rights reserved.
                  </p>
                  <div className="flex space-x-6">
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
                    >
                      Terms
                    </a>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
                    >
                      Privacy
                    </a>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
                    >
                      Contact
                    </a>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </Unauthenticated>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};

export default ConvexClientProvider;
