"use client";
import LoadingLogo from "@/components/shared/LoadingLogo";
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

// Testimonial component
interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
}

const Testimonial = ({ quote, author, role }: TestimonialProps) => (
  <motion.div
    className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-indigo-900 p-6 rounded-xl shadow-md"
    whileHover={{ scale: 1.03 }}
    transition={{ duration: 0.3 }}
  >
    <p className="text-gray-700 dark:text-gray-200 italic mb-4">"{quote}"</p>
    <div className="flex items-center">
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
        {author.charAt(0)}
      </div>
      <div className="ml-3">
        <p className="font-medium text-gray-900 dark:text-white">{author}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{role}</p>
      </div>
    </div>
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

  // Floating particles background
  const particles = Array.from({ length: 15 }).map((_, i) => (
    <motion.div
      key={i}
      className={`absolute rounded-full blur-xl opacity-20 ${
        i % 3 === 0
          ? "bg-blue-400"
          : i % 3 === 1
            ? "bg-indigo-400"
            : "bg-purple-400"
      }`}
      style={{
        width: `${Math.random() * 100 + 50}px`,
        height: `${Math.random() * 100 + 50}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        y: [0, Math.random() * 30 - 15, 0],
        x: [0, Math.random() * 30 - 15, 0],
      }}
      transition={{
        duration: Math.random() * 5 + 5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  ));

  return (
    <ClerkProvider>
      <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
        <AuthLoading>
          <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotateZ: [0, 5, 0, -5, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <LoadingLogo />
            </motion.div>
            <motion.p
              className="mt-4 text-gray-600 dark:text-gray-300 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Connecting to chat servers...
            </motion.p>
            <motion.div
              className="mt-8 w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: "16rem" }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            </motion.div>
          </div>
        </AuthLoading>
        <Authenticated>{children}</Authenticated>
        <Unauthenticated>
          {/* Main container with proper overflow handling */}
          <div className="relative h-screen overflow-auto bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
            {/* Fixed background particles */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
              {particles}
            </div>

            {/* Scrollable content */}
            <div className="relative z-10">
              {/* Header with Enhanced Hover Effects - Fixed at top */}
              <div className="sticky top-0 z-20 px-4 pt-4">
                <motion.nav
                  className="flex items-center justify-between py-4 mb-8 md:mb-12 bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg rounded-xl px-6 shadow-lg"
                  whileHover={{ y: -3, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center">
                    <motion.div
                      whileHover={{ rotate: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Converse
                      </span>
                    </motion.div>
                  </div>
                  <div className="flex items-center gap-4">
                    <SignInButton mode="modal">
                      <motion.button
                        className="px-6 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500"
                        whileHover={{
                          scale: 1.05,
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        Sign In
                      </motion.button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <motion.button
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md"
                        whileHover={{
                          scale: 1.05,
                          boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)",
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        Sign Up
                      </motion.button>
                    </SignUpButton>
                  </div>
                </motion.nav>
              </div>

              {/* Hero Section with Enhanced 3D Effects */}
              <div className="container mx-auto px-4 py-12 md:py-16 flex flex-col md:flex-row items-center gap-12">
                <motion.div
                  className="text-center md:text-left max-w-xl"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                >
                  <h1 className="text-5xl md:text-6xl font-extrabold">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                      Experience Real-Time
                    </span>
                    <span className="block mt-1 text-gray-900 dark:text-white">
                      Messaging
                    </span>
                  </h1>
                  <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                    Secure, fast, and beautiful messaging for teams with
                    powerful features and seamless integrations.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                    <SignUpButton mode="modal">
                      <motion.button
                        className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow-xl"
                        whileHover={{
                          scale: 1.05,
                          boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.4)",
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        Get Started — Free
                      </motion.button>
                    </SignUpButton>
                  </div>

                  {/* Feature tags */}
                  <div className="mt-8 flex flex-wrap gap-2 justify-center md:justify-start">
                    {[
                      "Real-time sync",
                      "End-to-end encryption",
                      "Custom themes",
                      "Team collaboration",
                    ].map((tag, i) => (
                      <motion.span
                        key={i}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>

                {/* Enhanced Chat UI Preview with 3D Perspective */}
                <motion.div
                  className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700"
                  initial={{ opacity: 0, rotateY: 15, y: 50 }}
                  animate={{ opacity: 1, rotateY: 0, y: 0 }}
                  whileHover={{ scale: 1.03, rotateY: 5 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                >
                  {/* Chat header with tabs */}
                  <div className="flex border-b border-gray-200 dark:border-gray-700 pb-3">
                    <button
                      className={`mr-4 pb-3 border-b-2 font-medium ${
                        activeTab === "chat"
                          ? "border-blue-500 text-blue-600 dark:text-blue-400"
                          : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                      onClick={() => setActiveTab("chat")}
                    >
                      Team Chat
                    </button>
                    <button
                      className={`mr-4 pb-3 border-b-2 font-medium ${
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
                  <div className="mt-6 flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
                    <button className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 p-2">
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
                      className="flex-1 bg-transparent border-none focus:ring-0 px-3 py-1 text-gray-800 dark:text-white outline-none"
                    />
                    <button className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md">
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

              {/* Testimonials Section */}
              <div className="container px-4 py-16 bg-gray-50 dark:bg-gray-900/50 rounded-3xl my-8 mx-4">
                <motion.h2
                  className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  What Our Users Say
                </motion.h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                  >
                    <Testimonial
                      quote="Converse transformed how our team communicates. We're more productive and connected than ever before."
                      author="Sarah Johnson"
                      role="Product Manager at TechCorp"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <Testimonial
                      quote="The security features give us peace of mind when discussing sensitive client information."
                      author="David Chen"
                      role="Security Officer at FinanceIQ"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Testimonial
                      quote="Clean interface, powerful features, and fantastic customer support. Highly recommended!"
                      author="Alex Rivera"
                      role="CTO at StartupX"
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
                      Start Your Free Trial
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
