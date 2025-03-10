"use client";

import SideBarWrapper from "@/components/shared/sidebar/SideBarWrapper";
import React from "react";

type Props = React.PropsWithChildren<object>;

const Layout = ({ children }: Props) => {
  return <SideBarWrapper>{children}</SideBarWrapper>;
};

export default Layout;
