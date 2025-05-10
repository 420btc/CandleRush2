import * as React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline"
}

export function Button({ variant = "default", ...props }: ButtonProps) {
  const glowStyle = {
    boxShadow: '0 0 24px 6px #fde04780' // Reducido a la mitad: 48px → 24px, 12px → 6px, y opacidad de cc (80%) a 80 (50%)
  };

  return (
    <button
      {...props}
      className={`
        inline-flex items-center justify-center rounded-md text-sm font-medium
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
        ${variant === "default"
          ? "bg-yellow-400 text-black"
          : "border border-yellow-400 bg-black text-yellow-400"}
      `}
      style={glowStyle}
    >
      {props.children}
    </button>
  )
}
