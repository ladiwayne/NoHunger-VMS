'use client';

import React from 'react';
import { Clock, CalendarCheck, TrendingUp, Award } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';



const summaryCards = [
  {
    label: 'Total Hours Logged',
    value: '184.5',
    unit: 'hrs',
    sub: 'Since joining · Mar 2024',
    icon: Clock,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    highlight: true,
  },
  {
    label: 'This Month',
    value: '12.5',
    unit: 'hrs',
    sub: 'March 2026 · 3 events',
    icon: TrendingUp,
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    highlight: false,
  },
  {
    label: 'Events Completed',
    value: '31',
    unit: 'events',
    sub: '2 in progress',
    icon: CalendarCheck,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    highlight: false,
  },
  {
    label: 'Recognition Level',
    value: 'Gold',
    unit: '',
    sub: '16 hrs to Platinum',
    icon: Award,
    iconBg: 'bg-yellow-50',
    iconColor: 'text-yellow-500',
    highlight: false,
  },
];

export default function HoursSummaryCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {summaryCards?.map((card) => {
        const Icon = card?.icon;
        return (
          <div
            key={card?.label}
            className={`
              bg-card border rounded-2xl p-5 shadow-card
              ${card?.highlight ? 'border-primary/20 bg-primary/3' : 'border-border'}
            `}
          >
            <div className={`w-9 h-9 rounded-xl ${card?.iconBg} flex items-center justify-center mb-4`}>
              <Icon size={18} className={card?.iconColor} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-800 text-foreground font-tabular">{card?.value}</span>
              {card?.unit && <span className="text-[13px] font-500 text-muted-foreground">{card?.unit}</span>}
            </div>
            <p className="text-[12px] font-600 uppercase tracking-wide text-muted-foreground mt-0.5">{card?.label}</p>
            <p className="text-[11.5px] text-muted-foreground mt-1.5">{card?.sub}</p>
          </div>
        );
      })}
    </div>
  );
}