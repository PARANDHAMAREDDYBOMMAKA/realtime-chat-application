"use client";

import LoadingLogo from "@/components/shared/LoadingLogo";
import { useAuth } from "@clerk/clerk-react";
import { ClerkProvider, SignInButton } from "@clerk/nextjs";
import { Authenticated, AuthLoading, Unauthenticated, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import React from "react";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

const convex = new ConvexReactClient(CONVEX_URL);

const ConvexClientProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
        <AuthLoading>
          <LoadingLogo />
        </AuthLoading>
        <Authenticated>
          {children}
        </Authenticated>
        <Unauthenticated>
          <div className="flex min-h-screen flex-col gap-4 items-center justify-center">
            <SignInButton mode="modal">
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
                Sign In
              </button>
            </SignInButton>
          </div>
        </Unauthenticated>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};

export default ConvexClientProvider;
