"use client";

import SideBarWrapper from "@/components/shared/sidebar/SideBarWrapper";
import { useGlobalNotifications } from "@/hooks/useGlobalNotifications";
import React from "react";

type Props = React.PropsWithChildren<object>;

const Layout = ({ children }: Props) => {
  // Enable global notifications for all conversations
  useGlobalNotifications();

  return <SideBarWrapper>{children}</SideBarWrapper>;
};

export default Layout;
