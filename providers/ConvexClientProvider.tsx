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
import React from "react";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const convex = new ConvexReactClient(CONVEX_URL);

const ConvexClientProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
        <AuthLoading>
          <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
            <motion.div
              className="animate-pulse"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <LoadingLogo />
            </motion.div>
            <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">
              Connecting to chat servers...
            </p>
          </div>
        </AuthLoading>
        <Authenticated>{children}</Authenticated>
        <Unauthenticated>
          <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 overflow-hidden">
            {/* 3D Floating Background */}
            <motion.div
              className="absolute top-1/4 left-1/6 w-64 h-64 bg-blue-400 rounded-full blur-3xl opacity-20"
              animate={{ y: [0, 30, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
            ></motion.div>
            <motion.div
              className="absolute bottom-1/4 right-1/6 w-64 h-64 bg-indigo-400 rounded-full blur-3xl opacity-20"
              animate={{ y: [0, -30, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
            ></motion.div>

            {/* Header with Hover Effects */}
            <motion.nav
              className="relative flex items-center justify-between py-4 mb-8 md:mb-16 bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm rounded-xl px-6 shadow-lg"
              whileHover={{ y: -2, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                Converse
              </span>
              <SignInButton mode="modal">
                <motion.button
                  className="px-6 py-2 bg-gradient-to-r  from-blue-500 to-indigo-600 text-white rounded-lg shadow-md hover:bg-primary/90"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  Sign In
                </motion.button>
              </SignInButton>
            </motion.nav>

            {/* 3D Hero Section */}
            <div className="container mx-auto px-4 py-12 md:py-20 flex flex-col md:flex-row items-center gap-12">
              <motion.div
                className="text-center md:text-left"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
              >
                <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white">
                  Experience Real-Time Chat
                </h1>
                <p className="mt-6 text-xl text-gray-600 dark:text-gray-300">
                  Secure, fast, and beautiful messaging for teams.
                </p>
                <SignUpButton mode="modal">
                  <motion.button
                    className="mt-6 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow-xl hover:from-blue-600 hover:to-indigo-700 hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    Get Started
                  </motion.button>
                </SignUpButton>
              </motion.div>

              {/* Chat UI Preview with 3D Perspective */}
              <motion.div
                className="relative bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-300 dark:border-gray-700"
                initial={{ rotateY: 15 }}
                animate={{ rotateY: 0 }}
                whileHover={{ rotateY: 5 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-gray-500 dark:text-gray-300 text-sm">
                  Sample Chat UI
                </p>
                <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-md">
                  <p className="text-sm text-gray-700 dark:text-white">
                    Sunny: Has everyone seen the latest updates?
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </Unauthenticated>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};

export default ConvexClientProvider;
