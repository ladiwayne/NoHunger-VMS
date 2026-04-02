'use client';

import React from 'react';
import { Clock, CalendarCheck, TrendingUp, Bell, Flame, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

const kpiCards = [
  {
    id: 'total-hours',
    label: 'Total Hours Logged',
    value: '184.5',
    unit: 'hrs',
    trend: '+12.5 this month',
    trendUp: true,
    icon: Clock,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    colSpan: 'col-span-1 md:col-span-2 xl:col-span-2',
    hero: true,
    href: '/hours-tracking',
  },
  {
    id: 'events-attended',
    label: 'Events Attended',
    value: '31',
    unit: 'events',
    trend: '+3 this month',
    trendUp: true,
    icon: CalendarCheck,
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    colSpan: 'col-span-1',
    hero: false,
    href: '/hours-tracking',
  },
  {
    id: 'hours-this-month',
    label: 'Hours This Month',
    value: '12.5',
    unit: 'hrs',
    trend: 'Mar 2026',
    trendUp: true,
    icon: TrendingUp,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    colSpan: 'col-span-1',
    hero: false,
    href: '/hours-tracking',
  },
  {
    id: 'pending-invitations',
    label: 'Pending Invitations',
    value: '3',
    unit: 'invites',
    trend: '1 expires in 2 days',
    trendUp: false,
    trendWarning: true,
    icon: Bell,
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
    colSpan: 'col-span-1',
    hero: false,
    alert: true,
    href: '/volunteer-dashboard',
  },
  {
    id: 'streak',
    label: 'Active Streak',
    value: '6',
    unit: 'weeks',
    trend: 'Personal best!',
    trendUp: true,
    icon: Flame,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    colSpan: 'col-span-1',
    hero: false,
    href: '/volunteer-dashboard',
  },
];

export default function DashboardKPIGrid() {
  return (
    // 4-column grid: hero spans 2 cols, 3 regular cards fill remaining 2 cols per row
    // Row 1: [hero 2-col] [events] [hours-month]
    // Row 2: [pending-invitations] [streak] + 2 empty = need to span
    // Adjusted: 4-col grid, hero=2col, 4 singles. Row1: hero+events+month = 4col ✓, Row2: invites+streak+2col-spacer — make invites+streak span 2 each
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {kpiCards?.map((card) => {
        const Icon = card?.icon;
        return (
          <Link
            key={card?.id}
            href={card?.href}
            className={`
              group relative bg-card border rounded-2xl p-5 shadow-card
              hover:shadow-card-hover transition-all duration-200
              ${card?.colSpan}
              ${card?.alert ? 'border-warning/30 bg-warning/4' : 'border-border'}
            `}
          >
            {card?.alert && (
              <div className="absolute top-3 right-3">
                <AlertTriangle size={14} className="text-warning" />
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <div
                className={`w-9 h-9 rounded-xl ${card?.iconBg} flex items-center justify-center flex-shrink-0`}
              >
                <Icon size={18} className={card?.iconColor} />
              </div>
            </div>
            <div className="mt-4">
              <div className={`flex items-baseline gap-1.5 ${card?.hero ? 'mt-1' : ''}`}>
                <span
                  className={`
                  font-700 font-tabular text-foreground
                  ${card?.hero ? 'text-4xl' : 'text-3xl'}
                `}
                >
                  {card?.value}
                </span>
                <span className="text-[13px] font-500 text-muted-foreground">{card?.unit}</span>
              </div>
              <p className="text-[12.5px] font-600 text-muted-foreground mt-0.5 uppercase tracking-wide">
                {card?.label}
              </p>
            </div>
            <div
              className={`
              mt-3 flex items-center gap-1.5 text-[12px] font-500
              ${card?.trendWarning ? 'text-warning' : card?.trendUp ? 'text-success' : 'text-muted-foreground'}
            `}
            >
              {card?.trendWarning ? (
                <AlertTriangle size={11} />
              ) : card?.trendUp ? (
                <TrendingUp size={11} />
              ) : null}
              <span>{card?.trend}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
