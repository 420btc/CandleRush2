import React from "react";

interface AnimatedBorderProps {
  children: React.ReactNode;
  isActive: boolean;
}

/**
 * Animated border for bet cards.
 * Shows animated lines around the card when isActive is true.
 */
export default function AnimatedBorder({ children, isActive }: AnimatedBorderProps) {
  return (
    <div className="relative">
      {/* Animated border only when active */}
      {isActive && (
        <span className="pointer-events-none absolute inset-0 z-10 rounded-xl border-2 border-yellow-400">
          {/* Four animated lines (top, right, bottom, left) */}
          <span className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 animate-border-x" />
          <span className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-yellow-400 via-yellow-200 to-yellow-400 animate-border-y" />
          <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-l from-yellow-400 via-yellow-200 to-yellow-400 animate-border-x-reverse" />
          <span className="absolute top-0 left-0 w-1 h-full bg-gradient-to-t from-yellow-400 via-yellow-200 to-yellow-400 animate-border-y-reverse" />
        </span>
      )}
      <div className="relative z-20">{children}</div>
    </div>
  );
}
