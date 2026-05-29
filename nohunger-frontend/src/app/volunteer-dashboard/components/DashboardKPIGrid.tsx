'use client';

import React from 'react';
import { formatHoursHHMM } from '@/lib/formatHours';
import { Clock, CalendarCheck, TrendingUp, Bell, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

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
    colSpan: 'col-span-1',
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
    href: '/invitations',
  },
];

function formatKpiValue(card: typeof kpiCards[number]) {
  if (card.id.includes('hours')) {
    const hours = Number(card.value);
    return Number.isFinite(hours) ? formatHoursHHMM(hours) : card.value;
  }
  return card.value;
}

export default function DashboardKPIGrid() {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {kpiCards.map((card) => {
        const IconComponent = card.icon;

        return (
          <Link
            key={card.id}
            href={card.href}
            className={`rounded-3xl border border-border/50 bg-card p-5 transition hover:border-primary/70 ${card.colSpan}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg}`}>
                    <IconComponent className={`${card.iconColor}`} size={22} />
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">{card.label}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between gap-2">
              <div>
                <p className="text-3xl font-semibold text-foreground">{formatKpiValue(card)}</p>
                <span className="text-sm text-muted-foreground">{card.unit}</span>
              </div>
              <div className="text-right text-xs uppercase tracking-[0.18em] text-muted-foreground">{card.hero ? 'Overview' : 'Snapshot'}</div>
            </div>

            <div
              className={`mt-4 flex items-center gap-2 text-xs font-medium ${
                card.trendWarning ? 'text-warning' : card.trendUp ? 'text-success' : 'text-muted-foreground'
              }`}
            >
              {card.trendWarning ? <AlertTriangle size={14} /> : card.trendUp ? <TrendingUp size={14} /> : null}
              <span>{card.trend}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
