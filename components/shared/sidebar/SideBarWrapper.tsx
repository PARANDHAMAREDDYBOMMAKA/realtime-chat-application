import React, { useEffect, useState } from "react";
import DesktopNav from "./nav/DesktopNav";
import MobileNav from "./nav/MobileNav";

type Props = React.PropsWithChildren<object>;

const SideBarWrapper = ({ children }: Props) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Optional: Add subtle background animation
    const bg = document.getElementById("animated-bg");
    if (bg) {
      document.addEventListener("mousemove", (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        bg.style.setProperty("--bg-pos-x", `${x * 100}%`);
        bg.style.setProperty("--bg-pos-y", `${y * 100}%`);
      });
    }
  }, []);

  return (
    <div
      id="animated-bg"
      className="h-full w-full p-4 flex flex-col lg:flex-row relative overflow-hidden transition-all duration-500"
      style={{
        backgroundImage:
          "radial-gradient(circle at var(--bg-pos-x, 50%) var(--bg-pos-y, 50%), var(--background) 0%, var(--background) 60%, var(--muted) 100%)",
        backgroundSize: "120% 120%",
        backgroundPosition: "center",
      }}
    >
      {mounted && (
        <>
          <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background/0 pointer-events-none" />
        </>
      )}
      <MobileNav />
      <DesktopNav />
      <main className="h-[calc(100%-80px)] lg:h-full w-full flex gap-4 rounded-lg backdrop-blur-sm relative animate-fadeIn">
        <div className="absolute inset-0 bg-background/30 rounded-lg backdrop-blur-sm -z-10" />
        {children}
      </main>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .bg-grid-pattern {
          background-image: linear-gradient(
              to right,
              var(--border) 1px,
              transparent 1px
            ),
            linear-gradient(to bottom, var(--border) 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}</style>
    </div>
  );
};

export default SideBarWrapper;
