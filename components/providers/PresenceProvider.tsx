"use client";

import { usePresence } from "@/hooks/usePresence";
import React from "react";

type Props = React.PropsWithChildren<object>;

/**
 * Provider component that manages user presence tracking
 * Automatically handles online/offline status updates
 */
const PresenceProvider = ({ children }: Props) => {
  usePresence();
  return <>{children}</>;
};

export default PresenceProvider;
