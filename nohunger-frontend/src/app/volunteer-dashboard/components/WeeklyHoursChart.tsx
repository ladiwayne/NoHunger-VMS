'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { formatHoursHHMM } from '@/lib/formatHours';
import { getMyCheckins } from '@/lib/api/checkins';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface WeeklyPoint {
  week: string;
  hours: number;
  events: number;
}

interface TooltipPayload {
  value: number;
  name: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-dropdown p-3 min-w-[140px]">
      <p className="text-[11px] font-600 uppercase tracking-wide text-muted-foreground mb-2">
        Week of {label}
      </p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[22px] font-800 text-primary font-tabular">{formatHoursHHMM(payload[0].value)}</span>
        <span className="text-[12px] text-muted-foreground font-500">HH:MM</span>
      </div>
      {payload[1] && (
        <p className="text-[12px] text-muted-foreground mt-1">
          {payload[1].value} event{payload[1].value !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

export default function WeeklyHoursChart() {
  const [weeklyData, setWeeklyData] = useState<WeeklyPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const checkins = await getMyCheckins();
        const completed = (checkins || []).filter((item) => item.status === 'checked_out' || item.status === 'approved');
        const points = Array.from({ length: 8 }, (_, index) => {
          const now = new Date();
          const start = new Date(now);
          start.setDate(now.getDate() - (7 - index) * 7);
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          const bucket = completed.filter((item) => {
            const createdAt = item.checkin_time ? new Date(item.checkin_time) : null;
            return createdAt && createdAt >= start && createdAt <= end;
          });
          return {
            week: start.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            hours: Number(bucket.reduce((sum, item) => sum + (item.hours_spent || 0), 0).toFixed(1)),
            events: bucket.length,
          };
        });
        setWeeklyData(points);
      } catch (error) {
        console.error('Failed to load weekly hours chart', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const avgHours = useMemo(() => {
    if (!weeklyData.length) return 0;
    return weeklyData.reduce((sum, point) => sum + point.hours, 0) / weeklyData.length;
  }, [weeklyData]);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl shadow-card p-5">
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl shadow-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[16px] font-700 text-foreground">Weekly Volunteer Hours</h3>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">Last 8 weeks · based on your logged sessions</p>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-success font-600 bg-success/8 px-2.5 py-1.5 rounded-lg">
          <TrendingUp size={13} />
          {avgHours > 0 ? '+recent activity' : 'No data yet'}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-primary/70" />
          <span className="text-[11.5px] text-muted-foreground font-500">Hours logged</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-0.5 border-t-2 border-dashed border-muted-foreground/40" />
          <span className="text-[11.5px] text-muted-foreground font-500">
            8-week avg ({avgHours.toFixed(1)} hrs)
          </span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(24, 83%, 52%)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="hsl(24, 83%, 52%)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: 'hsl(25, 10%, 48%)', fontFamily: 'DM Sans' }}
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
          <ReferenceLine
            y={avgHours}
            stroke="hsl(25, 10%, 48%)"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
            strokeWidth={1.5}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'hsl(24, 83%, 52%)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="hours"
            stroke="hsl(24, 83%, 52%)"
            strokeWidth={2.5}
            fill="url(#hoursGradient)"
            dot={{ fill: 'hsl(24, 83%, 52%)', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, fill: 'hsl(24, 83%, 52%)', strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
