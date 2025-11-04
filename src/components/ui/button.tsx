import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-custom-md hover:shadow-custom-lg",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-custom-md hover:shadow-custom-lg",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-custom-sm hover:shadow-custom-md",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-custom-sm hover:shadow-custom-md",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-primary text-white hover:shadow-glow hover:scale-[1.02] font-semibold border-none",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-custom-md hover:shadow-custom-lg",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-custom-md hover:shadow-custom-lg",
        premium: "bg-gradient-hero text-white hover:shadow-glow hover:scale-[1.02] font-semibold shadow-custom-lg",
        glass: "glass text-primary hover:bg-white/20 backdrop-blur-lg",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
