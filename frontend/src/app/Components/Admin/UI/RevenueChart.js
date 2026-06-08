"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,} 
  
from "../../DashboardUIComponents/UI/Card";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} 

from "recharts";

export const RevenueChart = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Breakdown</CardTitle>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--gold))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--gold))" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="colorTips" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--emerald))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--emerald))" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--coral))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--coral))" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis stroke="hsl(var(--muted-foreground))" />

            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />

            <Area
              type="monotone"
              dataKey="streams"
              stroke="hsl(var(--gold))"
              fill="url(#colorStreams)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="tips"
              stroke="hsl(var(--emerald))"
              fill="url(#colorTips)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="downloads"
              stroke="hsl(var(--coral))"
              fill="url(#colorDownloads)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gold" />
            <span className="text-sm text-muted-foreground">Streams</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald" />
            <span className="text-sm text-muted-foreground">Tips</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-coral" />
            <span className="text-sm text-muted-foreground">Downloads</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
