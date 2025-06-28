"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  // Define a gradient with 5 colors from red to green
  const progressGradient = "linear-gradient(to right, #f44336, #ff9800, #ffeb3b, #8bc34a, #4caf50)";
  
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-black/10",
        // Add inner shadow/glow to the background track
        "shadow-[inset_0px_0px_8px_rgba(255,255,255,0.2)]",
        className
      )}
      {...props}
    >
      <div 
        className="absolute inset-0 w-full h-full opacity-30 bg-white/5 rounded-full" 
        style={{ 
          boxShadow: "inset 0 0 10px rgba(255,255,255,0.3)"
        }} 
      />
      
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 transition-all duration-300 ease-out rounded-full",
          // Add outer glow to the progress indicator
          "shadow-[0_0_15px_rgba(120,255,150,0.6)]"
        )}
        style={{ 
          transform: `translateX(-${100 - (value || 0)}%)`,
          background: progressGradient,
          backgroundSize: "500% 100%",
          // Position the gradient based on progress value - reversed to go from red to green
          backgroundPosition: `${Math.min(100, (value || 0))}% 0`,
          boxShadow: "0 0 20px rgba(100,255,100,0.4), 0 0 10px rgba(50,200,50,0.4)"
        }}
      />
    </ProgressPrimitive.Root>
  )
})

Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
