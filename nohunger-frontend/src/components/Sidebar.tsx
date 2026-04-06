'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  Bell,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Heart,
  X,
  ClipboardList,
  Users,
  Megaphone,
  CheckSquare,
  Activity,
  ShieldCheck,
  Award,
  UserCog,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  activePath?: string;
}

const volunteerNavGroups = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/volunteer-dashboard', badge: null },
      { label: 'Hours Tracking', icon: Clock, href: '/hours-tracking', badge: null },
    ],
  },
  {
    label: 'Activities',
    items: [
      { label: 'Browse Activities', icon: Activity, href: '/activities', badge: null },
      {
        label: 'My Invitations',
        icon: Bell,
        href: '/invitations',
        badge: null,
        badgeVariant: 'warning' as const,
      },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'My Profile', icon: UserCircle, href: '/profile', badge: null },
      { label: 'Notifications', icon: Bell, href: '/notifications', badge: null },
      { label: 'Achievements', icon: Award, href: '/profile?tab=achievements', badge: null },
    ],
  },
];

const adminNavGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Admin Dashboard', icon: LayoutDashboard, href: '/admin/dashboard', badge: null },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Activities & Events', icon: CalendarDays, href: '/admin/activities', badge: null },
      { label: 'Champions', icon: Users, href: '/admin/volunteers', badge: null },
      {
        label: 'Check-in Requests',
        icon: CheckSquare,
        href: '/admin/checkins',
        badge: null,
        badgeVariant: 'warning' as const,
      },
      { label: 'Tasks', icon: ClipboardList, href: '/admin/tasks', badge: null },
    ],
  },
  {
    label: 'Communication',
    items: [{ label: 'Broadcasts', icon: Megaphone, href: '/admin/broadcasts', badge: null }],
  },
];

const superAdminExtraGroup = {
  label: 'System',
  items: [{ label: 'Manage Admins', icon: UserCog, href: '/admin/manage-admins', badge: null }],
};

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
  activePath,
}: SidebarProps) {
  const pathname = usePathname();
  const currentPath = activePath || pathname;
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const isSuperAdmin = profile?.role === 'super_admin';
  const navGroups = isAdmin
    ? isSuperAdmin
      ? [...adminNavGroups, superAdminExtraGroup]
      : adminNavGroups
    : volunteerNavGroups;

  const isActive = (href: string) => currentPath === href || currentPath.startsWith(href + '/');

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-up-login-screen');
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div
        className={`flex items-center gap-2.5 px-4 py-5 border-b border-border ${collapsed ? 'justify-center px-0' : ''}`}
      >
        <AppLogo size={32} />
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-display font-700 text-[15px] text-foreground leading-tight">
              NoHunger
            </span>
            <span className="text-[10px] text-muted-foreground font-500 tracking-wide uppercase">
              {isAdmin ? 'Initiative Admin' : 'Champion Hub'}
            </span>
          </div>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && isAdmin && (
        <div className="mx-3 mt-3 px-3 py-1.5 bg-primary/10 rounded-lg flex items-center gap-2">
          <ShieldCheck size={13} className="text-primary" />
          <span className="text-[11px] font-700 text-primary uppercase tracking-wide">
            {isSuperAdmin ? 'Super Admin' : 'Admin Access'}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6">
            {!collapsed && (
              <p className="px-4 mb-1.5 text-[10px] font-600 uppercase tracking-widest text-muted-foreground">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-150 group relative
                    ${active ? 'bg-[hsl(142,72%,92%)] text-[hsl(142,72%,20%)] font-600 border border-[hsl(142,72%,72%)]' : 'text-muted-foreground hover:bg-[hsl(142,72%,96%)] hover:text-[hsl(142,72%,22%)] font-500'}
                    ${collapsed ? 'justify-center px-0 mx-2' : ''}`}
                >
                  <Icon
                    size={18}
                    className={`flex-shrink-0 ${active ? 'text-[hsl(142,72%,22%)]' : 'group-hover:text-[hsl(142,72%,29%)]'}`}
                  />
                  {!collapsed && (
                    <>
                      <span className="text-[13.5px] flex-1 min-w-0 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-700 px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                          ${item.badgeVariant === 'warning' ? 'bg-warning/15 text-warning' : 'bg-primary/15 text-primary'}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-150">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Impact teaser (volunteer only) */}
      {!collapsed && !isAdmin && (
        <div className="mx-3 mb-4 p-3 rounded-xl bg-[hsl(142,72%,94%)] border border-[hsl(142,72%,78%)]">
          <div className="flex items-center gap-2 mb-1">
            <Heart size={13} className="text-[hsl(142,72%,22%)]" />
            <span className="text-[11px] font-600 text-[hsl(142,72%,22%)]">Your Impact</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Nice work, Champion. You&apos;ve logged{' '}
            <span className="font-700 text-foreground">{profile?.total_hours || 0} hrs</span> of
            service.
          </p>
          <p className="text-[10px] text-[hsl(142,72%,35%)] mt-1 font-500">
            Nohunger Initiative · Nigeria
          </p>
        </div>
      )}

      {/* User + logout */}
      <div
        className={`border-t border-border p-3 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}
      >
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <span className="text-[12px] font-700 text-primary">{initials}</span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-600 text-foreground truncate">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-[11px] text-muted-foreground truncate capitalize">
              {profile?.role === 'volunteer'
                ? 'Nohunger Champion'
                : profile?.role === 'super_admin'
                ? 'Super Administrator'
                : profile?.role === 'admin'
                ? 'Administrator'
                : profile?.role || 'Member'}
            </p>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="flex items-center justify-center py-2.5 border-t border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight size={15} />
        ) : (
          <div className="flex items-center gap-1.5 text-[12px] font-500">
            <ChevronLeft size={14} />
            <span>Collapse</span>
          </div>
        )}
      </button>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <AppLogo size={30} />
            <div>
              <span className="font-display font-700 text-[15px] text-foreground">NoHunger</span>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {isAdmin ? 'Initiative Admin' : 'Champion Hub'}
              </p>
            </div>
          </div>
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}
