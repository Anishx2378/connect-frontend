import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  fallback: string;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ className, src, fallback, size = "md", ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full bg-brand-100",
        {
          "h-8 w-8 text-xs": size === "sm",
          "h-10 w-10 text-sm": size === "md",
          "h-12 w-12 text-base": size === "lg",
        },
        className
      )}
      {...props}
    >
      {src ? (
        <img className="aspect-square h-full w-full object-cover" src={src} alt={fallback} />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-brand-700 font-medium uppercase">
          {fallback.substring(0, 2)}
        </div>
      )}
    </div>
  )
}
