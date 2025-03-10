import React from "react";
import DesktopNav from "./nav/DesktopNav";
import MobileNav from "./nav/MobileNav";

type Props = React.PropsWithChildren<object>;

const SideBarWrapper = ({ children }: Props) => {
  return (
    <div className="h-full w-full p-4 flex flex-col lg:flex-row">
      <MobileNav />
      <DesktopNav />
      <main className="h-[calc(100%)-80px] lg:h-full w-full flex gap-4">
        {children}
      </main>
    </div>
  );
};

export default SideBarWrapper;
