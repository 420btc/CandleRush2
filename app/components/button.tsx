import * as React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline"
}

export function Button({ variant = "default", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`
        inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background
        transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
        ${variant === "default"
          ? "bg-yellow-400 text-black hover:bg-yellow-500"
          : "border border-yellow-400 bg-black hover:bg-yellow-400/10 text-yellow-400 hover:text-black"}
      `}
    >
      {props.children}
    </button>
  )
}
