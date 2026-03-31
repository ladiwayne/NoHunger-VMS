'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';

type SortDir = 'asc' | 'desc' | null;
type SortKey = 'eventName' | 'date' | 'checkIn' | 'checkOut' | 'duration' | 'eventType' | 'location' | 'status';

interface HoursEntry {
  id: string;
  eventName: string;
  date: string;
  dateSort: string;
  location: string;
  checkIn: string;
  checkOut: string;
  duration: number;
  durationDisplay: string;
  eventType: 'Food Packing' | 'Distribution' | 'Cooking' | 'Logistics' | 'Community Outreach';
  status: 'logged' | 'in-progress' | 'checked-out';
  region: string;
}

// TODO: Backend — GET /api/volunteers/:id/hours?page=1&limit=10&month=...&sort=...
const ALL_HOURS: HoursEntry[] = [
  { id: 'h-001', eventName: 'Mushin Community Food Drive', date: 'Mar 17, 2026', dateSort: '2026-03-17', location: 'Mushin Community Centre', checkIn: '08:04 AM', checkOut: '—', duration: 0, durationDisplay: 'In progress', eventType: 'Food Packing', status: 'in-progress', region: 'Lagos State' },
  { id: 'h-002', eventName: 'Oshodi Saturday Pack', date: 'Mar 8, 2026', dateSort: '2026-03-08', location: 'Oshodi Market', checkIn: '08:12 AM', checkOut: '01:05 PM', duration: 4.88, durationDisplay: '4h 53m', eventType: 'Food Packing', status: 'logged', region: 'Lagos State' },
  { id: 'h-003', eventName: 'LUTH Soup Kitchen', date: 'Mar 1, 2026', dateSort: '2026-03-01', location: 'Lagos University Teaching Hospital', checkIn: '10:00 AM', checkOut: '02:30 PM', duration: 4.5, durationDisplay: '4h 30m', eventType: 'Cooking', status: 'logged', region: 'Lagos State' },
  { id: 'h-004', eventName: 'Apapa Port Logistics Day', date: 'Feb 22, 2026', dateSort: '2026-02-22', location: 'Apapa Community Hall', checkIn: '06:45 AM', checkOut: '01:15 PM', duration: 6.5, durationDisplay: '6h 30m', eventType: 'Logistics', status: 'logged', region: 'Lagos State' },
  { id: 'h-005', eventName: 'Lagos Island Distribution', date: 'Feb 15, 2026', dateSort: '2026-02-15', location: 'Lagos Island Market', checkIn: '09:00 AM', checkOut: '03:30 PM', duration: 6.5, durationDisplay: '6h 30m', eventType: 'Distribution', status: 'logged', region: 'Lagos State' },
  { id: 'h-006', eventName: 'Makoko Fishing Community Outreach', date: 'Feb 8, 2026', dateSort: '2026-02-08', location: 'Makoko Waterfront', checkIn: '07:30 AM', checkOut: '11:00 AM', duration: 3.5, durationDisplay: '3h 30m', eventType: 'Community Outreach', status: 'logged', region: 'Lagos State' },
  { id: 'h-007', eventName: 'Lekki Phase 1 Pack Day', date: 'Feb 1, 2026', dateSort: '2026-02-01', location: 'Lekki Community Hall', checkIn: '08:00 AM', checkOut: '02:00 PM', duration: 6.0, durationDisplay: '6h 00m', eventType: 'Food Packing', status: 'logged', region: 'Lagos State' },
  { id: 'h-008', eventName: 'Surulere Municipal Kitchen', date: 'Jan 25, 2026', dateSort: '2026-01-25', location: 'Surulere Municipal Hall', checkIn: '09:30 AM', checkOut: '01:30 PM', duration: 4.0, durationDisplay: '4h 00m', eventType: 'Cooking', status: 'logged', region: 'Lagos State' },
  { id: 'h-009', eventName: 'Victoria Island Outreach', date: 'Jan 18, 2026', dateSort: '2026-01-18', location: 'Victoria Island, Lagos', checkIn: '08:45 AM', checkOut: '12:45 PM', duration: 4.0, durationDisplay: '4h 00m', eventType: 'Community Outreach', status: 'logged', region: 'Lagos State' },
  { id: 'h-010', eventName: 'Agege Food Bank Saturday', date: 'Jan 11, 2026', dateSort: '2026-01-11', location: 'Agege Stadium Road', checkIn: '07:00 AM', checkOut: '01:30 PM', duration: 6.5, durationDisplay: '6h 30m', eventType: 'Food Packing', status: 'logged', region: 'Lagos State' },
  { id: 'h-011', eventName: 'Ikorodu Distribution Drive', date: 'Jan 4, 2026', dateSort: '2026-01-04', location: 'Ikorodu Community Centre', checkIn: '09:00 AM', checkOut: '02:00 PM', duration: 5.0, durationDisplay: '5h 00m', eventType: 'Distribution', status: 'logged', region: 'Lagos State' },
  { id: 'h-012', eventName: 'Alaba Market Logistics', date: 'Dec 28, 2025', dateSort: '2025-12-28', location: 'Alaba International Market', checkIn: '06:30 AM', checkOut: '12:00 PM', duration: 5.5, durationDisplay: '5h 30m', eventType: 'Logistics', status: 'logged', region: 'Lagos State' },
];

const EVENT_TYPES = ['All Types', 'Food Packing', 'Distribution', 'Cooking', 'Logistics', 'Community Outreach'];
const MONTHS = ['All Months', 'Mar 2026', 'Feb 2026', 'Jan 2026', 'Dec 2025', 'Nov 2025', 'Oct 2025'];
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20];

const eventTypeColors: Record<string, string> = {
  'Food Packing': 'bg-primary/10 text-primary border-primary/20',
  'Distribution': 'bg-green-100 text-green-700 border-green-200',
  'Cooking': 'bg-success/10 text-success border-success/20',
  'Logistics': 'bg-blue-100 text-blue-600 border-blue-200',
  'Community Outreach': 'bg-purple-100 text-purple-600 border-purple-200',
};

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey | null; sortDir: SortDir }) {
  if (sortKey !== column) return <ChevronsUpDown size={13} className="text-muted-foreground/50" />;
  if (sortDir === 'asc') return <ChevronUp size={13} className="text-primary" />;
  return <ChevronDown size={13} className="text-primary" />;
}

export default function HoursLogTable() {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedMonth, setSelectedMonth] = useState('All Months');
  const [sortKey, setSortKey] = useState<SortKey | null>('dateSort' as SortKey);
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
      if (sortDir === null) setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    let data = [...ALL_HOURS];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.eventName.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.eventType.toLowerCase().includes(q)
      );
    }

    if (selectedType !== 'All Types') {
      data = data.filter((r) => r.eventType === selectedType);
    }

    if (selectedMonth !== 'All Months') {
      const [mon, yr] = selectedMonth.split(' ');
      data = data.filter((r) => r.date.startsWith(mon) && r.date.includes(yr));
    }

    if (sortKey && sortDir) {
      data.sort((a, b) => {
        let av: string | number = a[sortKey as keyof HoursEntry] as string | number;
        let bv: string | number = b[sortKey as keyof HoursEntry] as string | number;
        if (sortKey === 'duration') {
          av = a.duration;
          bv = b.duration;
        }
        if (sortKey === 'date') {
          av = a.dateSort;
          bv = b.dateSort;
        }
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [search, selectedType, selectedMonth, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalFilteredHours = filtered.reduce((s, r) => s + r.duration, 0);

  const columns: { key: SortKey; label: string; sortable: boolean }[] = [
    { key: 'eventName', label: 'Event', sortable: true },
    { key: 'date', label: 'Date', sortable: true },
    { key: 'location', label: 'Location', sortable: false },
    { key: 'checkIn', label: 'Check-In', sortable: false },
    { key: 'checkOut', label: 'Check-Out', sortable: false },
    { key: 'duration', label: 'Duration', sortable: true },
    { key: 'eventType', label: 'Role Type', sortable: true },
    { key: 'status', label: 'Status', sortable: false },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
      {/* Table toolbar */}
      <div className="px-5 py-4 border-b border-border flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events, locations…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border text-[13px]
              bg-background text-foreground placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
              transition-all duration-150"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-muted-foreground" />
            <select
              value={selectedMonth}
              onChange={(e) => { setSelectedMonth(e.target.value); setPage(1); }}
              className="text-[12.5px] font-500 border border-border rounded-xl px-3 py-2
                bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25
                cursor-pointer transition-all duration-150"
            >
              {MONTHS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>

          <select
            value={selectedType}
            onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
            className="text-[12.5px] font-500 border border-border rounded-xl px-3 py-2
              bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25
              cursor-pointer transition-all duration-150"
          >
            {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Filtered total */}
        <div className="ml-auto flex items-center gap-2 text-[12px] text-muted-foreground font-500 bg-muted px-3 py-2 rounded-xl flex-shrink-0">
          <span className="font-700 text-foreground font-tabular">{totalFilteredHours.toFixed(1)} hrs</span>
          across {filtered.length} sessions
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    px-4 py-3 text-left text-[11px] font-700 uppercase tracking-wider text-muted-foreground
                    ${col.sortable ? 'cursor-pointer hover:text-foreground select-none' : ''}
                    ${col.key === 'eventName' ? 'min-w-[200px]' : ''}
                    ${col.key === 'location' ? 'min-w-[160px]' : ''}
                  `}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      <SortIcon column={col.key} sortKey={sortKey} sortDir={sortDir} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <Search size={28} className="text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-[14px] font-600 text-muted-foreground">No hours sessions found</p>
                  <p className="text-[12.5px] text-muted-foreground/70 mt-1">
                    Try adjusting your search or filter criteria
                  </p>
                </td>
              </tr>
            ) : (
              paginated.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-muted/40 transition-colors group"
                >
                  {/* Event name */}
                  <td className="px-4 py-3.5">
                    <p className="text-[13.5px] font-600 text-foreground group-hover:text-primary transition-colors truncate max-w-[220px]">
                      {row.eventName}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{row.region}</p>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3.5">
                    <p className="text-[13px] font-500 text-foreground whitespace-nowrap">{row.date}</p>
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3.5">
                    <p className="text-[12.5px] text-muted-foreground truncate max-w-[160px]">{row.location}</p>
                  </td>

                  {/* Check-in */}
                  <td className="px-4 py-3.5">
                    <p className="text-[13px] font-500 text-foreground font-tabular whitespace-nowrap">{row.checkIn}</p>
                  </td>

                  {/* Check-out */}
                  <td className="px-4 py-3.5">
                    <p className={`text-[13px] font-500 font-tabular whitespace-nowrap ${row.checkOut === '—' ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {row.checkOut}
                    </p>
                  </td>

                  {/* Duration */}
                  <td className="px-4 py-3.5">
                    <p className={`text-[13px] font-700 font-tabular whitespace-nowrap
                      ${row.status === 'in-progress' ? 'text-primary' : 'text-foreground'}`}>
                      {row.durationDisplay}
                    </p>
                  </td>

                  {/* Event type */}
                  <td className="px-4 py-3.5">
                    <span className={`
                      inline-flex items-center text-[11px] font-600 px-2 py-1 rounded-full border whitespace-nowrap
                      ${eventTypeColors[row.eventType]}
                    `}>
                      {row.eventType}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <StatusBadge variant={row.status} size="sm" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="px-5 py-3.5 border-t border-border flex items-center justify-between gap-4 flex-wrap bg-muted/20">
        <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
          <span>Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }}
            className="border border-border rounded-lg px-2 py-1 text-[12.5px] font-600
              bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
          >
            {ITEMS_PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>per page · <span className="font-600 text-foreground">{filtered.length}</span> total sessions</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft size={14} className="text-muted-foreground" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`
                w-8 h-8 rounded-lg text-[12.5px] font-600 transition-all duration-150
                ${page === p
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }
              `}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}