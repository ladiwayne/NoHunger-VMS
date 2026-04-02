'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// TODO: Backend — GET /api/volunteers/:id/hours?groupBy=month&limit=6
const monthlyData = [
  { month: 'Oct', hours: 18.5, events: 5 },
  { month: 'Nov', hours: 22.0, events: 6 },
  { month: 'Dec', hours: 14.5, events: 4 },
  { month: 'Jan', hours: 28.0, events: 7 },
  { month: 'Feb', hours: 29.0, events: 8 },
  { month: 'Mar', hours: 12.5, events: 3 },
];

const CURRENT_MONTH = 'Mar';

interface TooltipPayload {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-dropdown p-3.5 min-w-[150px]">
      <p className="text-[11px] font-600 uppercase tracking-wide text-muted-foreground mb-2">
        {label} 2025–26
      </p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[24px] font-800 text-primary font-tabular">{payload[0].value}</span>
        <span className="text-[12px] text-muted-foreground">hrs</span>
      </div>
    </div>
  );
}

export default function MonthlyHoursChart() {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[15px] font-700 text-foreground">Monthly Hours</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">Oct 2025 – Mar 2026</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-600">
            6-month total
          </p>
          <p className="text-[20px] font-800 text-foreground font-tabular">124.5 hrs</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={monthlyData}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          barSize={32}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: 'hsl(25, 10%, 48%)', fontFamily: 'DM Sans' }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(25, 10%, 48%)', fontFamily: 'DM Sans' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number | string) => `${v}h`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(30, 12%, 94%)', radius: 6 }} />
          <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
            {monthlyData.map((entry) => (
              <Cell
                key={entry.month}
                fill={entry.month === CURRENT_MONTH ? 'hsl(24, 83%, 52%)' : 'hsl(24, 83%, 80%)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-primary" />
          <span className="text-[11px] text-muted-foreground">Current month</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(24, 83%, 80%)' }} />
          <span className="text-[11px] text-muted-foreground">Past months</span>
        </div>
      </div>
    </div>
  );
}
