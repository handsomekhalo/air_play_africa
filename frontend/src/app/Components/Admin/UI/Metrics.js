"use client";

import { Card } from "../../DashboardUIComponents/UI/Card";

import { cn } from "../../lib/utils";

export const MetricCard = ({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  variant = "default",
}) => {
  const variantStyles = {
    default: "border-border",
    gold: "border-gold/20 bg-gradient-to-br from-gold/5 to-transparent",
    emerald: "border-emerald/20 bg-gradient-to-br from-emerald/5 to-transparent",
    coral: "border-coral/20 bg-gradient-to-br from-coral/5 to-transparent",
  };

  const iconStyles = {
    default: "bg-primary/10 text-primary",
    gold: "bg-gold/10 text-gold",
    emerald: "bg-emerald/10 text-emerald",
    coral: "bg-coral/10 text-coral",
  };

  return (
    <Card
      className={cn(
        "p-6 transition-all hover:shadow-lg",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>

          <p className="text-3xl font-bold tracking-tight">
            {value}
          </p>

          {change && (
            <p
              className={cn(
                "text-sm font-medium",
                changeType === "positive" && "text-emerald",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>

        <div className={cn("p-3 rounded-xl", iconStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
};
