import * as React from "react"
import { cn } from "../../lib/utils"

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
    <div
        ref={ref}
        role="alert"
        className={cn(
            "relative w-full rounded-lg border p-4",
            {
                "bg-destructive/15 text-destructive": variant === "destructive",
                "bg-warning/15 text-warning": variant === "warning",
            },
            className
        )}
        {...props}
    />
))
Alert.displayName = "Alert"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("text-sm [&_p]:leading-relaxed", className)}
        {...props}
    />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription }