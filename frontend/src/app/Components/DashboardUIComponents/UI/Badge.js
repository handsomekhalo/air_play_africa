


"use client";


import * as React from "react";
import { cn } from "../../lib/utils";



export const Badge = ({ className, variant = "default", children, ...props }) => {
  const base = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors";

  const variantClasses = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "border border-border text-foreground",
  };

  return (
    <div className={cn(base, variantClasses[variant], className)} {...props}>
      {children}
    </div>
  );
};
