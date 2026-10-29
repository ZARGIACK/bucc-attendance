"use client";

import { useState } from "react";
import Image from "next/image";
import useSWR from "swr";
import { format, formatDistanceToNow } from "date-fns";
import {
  User,
  Clock,
  Trophy,
  CalendarDays,
  Shield,
  Building2,
  Briefcase,
  IdCard,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  MapPin,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDuration, cn } from "@/lib/utils";

type ProfileData = {
  member: {
    id: string;
    name: string;
    studentId: string;
    email: string;
    department: string;
    designation: string;
    role: string;
    profilePhotoUrl: string | null;
    joinDate: string;
    isActive: boolean;
    tempRole: string | null;
    tempRoleExpiresAt: string | null;
  };
  stats: {
    totalMinutes: number;
    completedSessions: number;
    totalCheckIns: number;
    departmentRank: {
      rank: number;
      totalInDepartment: number;
    };
    signoutStats: {
      approved: number;
      rejected: number;
      total: number;
    };
  };
  recentSessions: Array<{
    id: string;
    sessionId: string;
    sessionName: string;
    venue: string | null;
    checkInAt: string;
    checkOutRequestedAt: string | null;
    checkOutApprovedAt: string | null;
    status: string;
    method: string;
    durationMinutes: number | null;
  }>;
  activity: Array<{
    date: string;
    durationMinutes: number;
  }>;
};

export function MemberProfile({ memberId }: { memberId: string }) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<ProfileData>(
    `/api/members/${memberId}/profile`
  );

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center dark:border-rose-900/60 dark:bg-rose-950/20">
        <XCircle className="mx-auto h-10 w-10 text-rose-500" />
        <h3 className="mt-3 text-base font-semibold text-rose-900 dark:text-rose-200">
          Failed to load profile
        </h3>
        <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">
          {error?.message || "Member profile could not be retrieved."}
        </p>
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={() => mutate()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  const { member, stats, recentSessions, activity } = data;

  const approvalRate =
    stats.signoutStats.total > 0
      ? Math.round(
          (stats.signoutStats.approved / stats.signoutStats.total) * 100
        )
      : 100;

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-end">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => mutate()}
          disabled={isValidating}
          className="h-8 gap-1.5 text-xs"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isValidating && "animate-spin")} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Member Header Profile Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/50 to-electric-500/5 p-6 shadow-sm dark:border-navy-700 dark:from-navy-900 dark:via-navy-900/90 dark:to-electric-950/30">
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Avatar / Photo with Glowing Border */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-electric-500/30 shadow-md shadow-electric-500/10">
              {member.profilePhotoUrl ? (
                <Image
                  src={member.profilePhotoUrl}
                  alt={member.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-electric-600 to-navy-800 text-2xl font-bold text-white">
                  {member.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Identity & Badges */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {member.name}
                </h1>
                <Badge
                  tone={member.isActive ? "green" : "red"}
                  className="text-[11px]"
                >
                  {member.isActive ? "Active Member" : "Deactivated"}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-mono font-medium text-slate-700 dark:text-slate-200">
                  <IdCard className="h-3.5 w-3.5 text-electric-500" />
                  {member.studentId}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  {member.department}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  {member.designation}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="inline-flex items-center gap-1 rounded-md bg-electric-500/10 px-2 py-0.5 font-semibold text-electric-600 dark:text-electric-400">
                  <Shield className="h-3 w-3" />
                  Role: {member.role}
                </span>

                {member.tempRole && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-600 dark:text-amber-400">
                    <Sparkles className="h-3 w-3" />
                    Temp Role: {member.tempRole}
                  </span>
                )}

                <span className="text-[11px] text-slate-400">
                  Joined {format(new Date(member.joinDate), "MMMM yyyy")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {/* Total Hours */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-navy-700 dark:bg-navy-800">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <div className="rounded-xl bg-electric-50 p-2 text-electric-600 dark:bg-electric-950/60 dark:text-electric-400">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium uppercase tracking-wider">Volunteered</span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {formatDuration(stats.totalMinutes)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">Total verified hours</p>
        </div>

        {/* Completed Sessions */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-navy-700 dark:bg-navy-800">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Trophy className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium uppercase tracking-wider">Sessions</span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {stats.completedSessions}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">Completed volunteering</p>
        </div>

        {/* Department Leaderboard Rank */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-navy-700 dark:bg-navy-800">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Flame className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium uppercase tracking-wider">Dept Rank</span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            #{stats.departmentRank.rank}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            of {stats.departmentRank.totalInDepartment} in {member.department}
          </p>
        </div>

        {/* Reliability / Check-ins */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-navy-700 dark:bg-navy-800">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium uppercase tracking-wider">Approval Rate</span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {approvalRate}%
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {stats.signoutStats.approved}/{stats.signoutStats.total} signouts approved
          </p>
        </div>
      </div>

      {/* 20-Week Activity Heatmap */}
      <ProfileActivityHeatmap activity={activity} />

      {/* Recent Sessions Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-navy-700 dark:bg-navy-800">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-navy-700">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Volunteering History
            </h2>
            <p className="text-xs text-slate-400">
              Showing recent sessions and check-in verifications
            </p>
          </div>
          <Badge tone="gray" className="text-xs">
            {recentSessions.length} sessions
          </Badge>
        </div>

        {recentSessions.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Calendar}
              title="No sessions attended yet"
              hint="Check in to upcoming club meetings and volunteering sessions to build your attendance record."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-slate-500 dark:border-navy-700 dark:bg-navy-900/50 dark:text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4">Venue</th>
                  <th className="py-3 px-4">Check-in</th>
                  <th className="py-3 px-4">Sign-out</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-700">
                {recentSessions.map((session) => (
                  <tr
                    key={session.id}
                    className="transition-colors hover:bg-slate-50/60 dark:hover:bg-navy-700/40"
                  >
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {session.sessionName}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {session.venue ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {session.venue}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {format(new Date(session.checkInAt), "MMM d, h:mm a")}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {session.checkOutApprovedAt || session.checkOutRequestedAt
                        ? format(
                            new Date(session.checkOutApprovedAt || session.checkOutRequestedAt!),
                            "MMM d, h:mm a"
                          )
                        : "—"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">
                      {session.durationMinutes != null
                        ? formatDuration(session.durationMinutes)
                        : "—"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-[10px] uppercase text-slate-500 dark:text-slate-400">
                        {session.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={session.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/** 20-week calendar heatmap */
function ProfileActivityHeatmap({
  activity,
}: {
  activity: Array<{ date: string; durationMinutes: number }>;
}) {
  const WEEKS = 20;
  const days = WEEKS * 7;
  const counts = new Map<string, { count: number; minutes: number }>();

  for (const act of activity) {
    const key = new Date(act.date).toDateString();
    const curr = counts.get(key) || { count: 0, minutes: 0 };
    counts.set(key, {
      count: curr.count + 1,
      minutes: curr.minutes + (act.durationMinutes || 0),
    });
  }

  const today = new Date();
  const cells = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    const entry = counts.get(d.toDateString()) || { count: 0, minutes: 0 };
    return {
      date: d,
      count: entry.count,
      minutes: entry.minutes,
    };
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-700 dark:bg-navy-800">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Activity Frequency
          </h2>
          <p className="text-xs text-slate-400">
            Attendance presence across the last {WEEKS} weeks
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span>Less</span>
          <div className="h-2.5 w-2.5 rounded-sm bg-slate-100 dark:bg-navy-900" />
          <div className="h-2.5 w-2.5 rounded-sm bg-electric-300 dark:bg-electric-800" />
          <div className="h-2.5 w-2.5 rounded-sm bg-electric-500" />
          <div className="h-2.5 w-2.5 rounded-sm bg-electric-700" />
          <span>More</span>
        </div>
      </div>

      <div
        className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1"
        role="img"
        aria-label="Attendance calendar heatmap"
      >
        {cells.map(({ date, count, minutes }, i) => (
          <div
            key={i}
            title={`${format(date, "MMM d, yyyy")}: ${count} session${
              count === 1 ? "" : "s"
            }${minutes > 0 ? ` (${formatDuration(minutes)})` : ""}`}
            className={cn(
              "h-3 w-3 rounded-sm transition-transform hover:scale-125",
              count === 0 && "bg-slate-100 dark:bg-navy-900",
              count === 1 && "bg-electric-400/80 dark:bg-electric-600/70",
              count >= 2 && "bg-electric-600 dark:bg-electric-400"
            )}
          />
        ))}
      </div>
    </div>
  );
}
