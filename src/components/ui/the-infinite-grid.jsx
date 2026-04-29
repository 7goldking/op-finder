import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useAnimationFrame,
} from "framer-motion";

export const GridPattern = ({ offsetX, offsetY }) => (
  <svg className="w-full h-full">
    <defs>
      <motion.pattern
        id="grid-pattern"
        width="40"
        height="40"
        patternUnits="userSpaceOnUse"
        x={offsetX}
        y={offsetY}
      >
        <path
          d="M 40 0 L 0 0 0 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-muted-foreground"
        />
      </motion.pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid-pattern)" />
  </svg>
);

// Cheap static grid for mobile - no animations, no large blurs
const StaticGrid = ({ children, className }) => (
  <div className={cn("relative w-full overflow-hidden bg-background", className)}>
    <div
      className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none"
      style={{
        backgroundImage:
          'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        color: 'hsl(var(--muted-foreground))',
      }}
    />
    <div className="relative z-10">{children}</div>
  </div>
);

export const InfiniteGrid = ({ children, className }) => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 767px)').matches ||
        window.matchMedia('(hover: none)').matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = () => setIsMobile(mq.matches || window.matchMedia('(hover: none)').matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  // On mobile, render a static cheap grid - no rAF, no mask, no big blurs
  if (isMobile) {
    return <StaticGrid className={className}>{children}</StaticGrid>;
  }

  return <DesktopInfiniteGrid className={className}>{children}</DesktopInfiniteGrid>;
};

const DesktopInfiniteGrid = ({ children, className }) => {
  const containerRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  const handleMouseMove = (e) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  useAnimationFrame(() => {
    gridOffsetX.set((gridOffsetX.get() + 0.4) % 40);
    gridOffsetY.set((gridOffsetY.get() + 0.4) % 40);
  });

  const maskImage = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn("relative w-full overflow-hidden bg-background", className)}
    >
      <div className="absolute inset-0 z-0 opacity-[0.06]">
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} />
      </div>

      <motion.div
        className="absolute inset-0 z-0 opacity-50"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} />
      </motion.div>

      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute right-[-15%] top-[-15%] w-[45%] h-[45%] rounded-full bg-orange-500/30 dark:bg-orange-600/15 blur-[130px]" />
        <div className="absolute right-[15%] top-[-5%] w-[18%] h-[18%] rounded-full bg-primary/20 blur-[90px]" />
        <div className="absolute left-[-10%] bottom-[-15%] w-[40%] h-[40%] rounded-full bg-blue-500/30 dark:bg-blue-600/15 blur-[130px]" />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
};