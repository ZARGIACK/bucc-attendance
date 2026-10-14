"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Download,
  Share2,
  ExternalLink,
  PlaneTakeoff,
  PlaneLanding,
  Ticket,
  ChevronDown,
  Building,
  Check,
  Calendar,
  MapPin,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

type RsvpItem = {
  id: string;
  name: string;
  dept: string;
  studentId: string;
  designation: string;
  status: "Confirmed" | "Cancelled";
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  session?: {
    id: string;
    name: string;
    venue: string | null;
    startsAt: string;
    endsAt: string;
  };
};

type SessionItem = {
  id: string;
  name: string;
  venue: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

type PreEventApiResponse = {
  sessions: SessionItem[];
  activeSession: SessionItem | null;
  rsvps: RsvpItem[];
  stats: {
    total: number;
    confirmed: number;
    cancelled: number;
    deptStats: Record<string, { confirmed: number; cancelled: number }>;
  };
};

export function UpcomingSessionTracker({ defaultSessionId }: { defaultSessionId?: string }) {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(defaultSessionId || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Confirmed" | "Cancelled">("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [copiedLink, setCopiedLink] = useState(false);

  // Poll every 3s for snappy real-time live updates
  const { data, error, isLoading, mutate } = useSWR<PreEventApiResponse>(
    `/api/pre-event?sessionId=${selectedSessionId || ""}`,
    { refreshInterval: 3000 }
  );

  const sessions = data?.sessions ?? [];
  const currentSession =
    sessions.find((s) => s.id === selectedSessionId) ?? data?.activeSession ?? sessions[0] ?? null;

  // Derive unique departments for filter dropdown
  const departments = Array.from(
    new Set((data?.rsvps ?? []).map((r) => r.dept).filter(Boolean))
  ).sort();

  // Filtered rows
  const filteredRsvps = (data?.rsvps ?? []).filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (deptFilter !== "ALL" && r.dept !== deptFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchId = r.studentId.includes(q);
      const matchDept = r.dept.toLowerCase().includes(q);
      const matchDesg = r.designation.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchDept && !matchDesg) return false;
    }
    return true;
  });

  const total = data?.stats.total ?? 0;
  const confirmed = data?.stats.confirmed ?? 0;
  const cancelled = data?.stats.cancelled ?? 0;
  const confirmedRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;

  function copyPublicLink() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const sessionParam = currentSession ? `?session=${currentSession.id}` : "";
    const url = `${origin}/pre-event${sessionParam}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast("success", "Pre-Event Boarding Pass link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  }

  async function handleDeleteRsvp(id: string, name: string) {
    if (!confirm(`Remove RSVP for ${name}?`)) return;
    try {
      const res = await fetch(`/api/pre-event?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast("success", `RSVP for ${name} removed`);
      void mutate();
    } catch (err: any) {
      toast("error", err.message || "Failed to remove RSVP");
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Top Bar: Session Selector, Live Status & Quick Actions ── */}
      <div className="card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-electric-500/10 text-electric-600 dark:text-electric-400 flex items-center justify-center shrink-0">
            <Ticket className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Upcoming Session Tracker
              </h2>
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync (3s)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time monitoring of member RSVPs & digital boarding pass confirmations.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Session Switcher Dropdown */}
          {sessions.length > 0 && (
            <div className="relative">
              <select
                aria-label="Filter by scheduled session"
                value={selectedSessionId || currentSession?.id || ""}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="h-9 appearance-none rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 pl-3 pr-8 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-electric-500"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({format(new Date(s.startsAt), "d MMM")})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          )}

          <Button variant="secondary" size="sm" onClick={() => mutate()} className="gap-1.5">
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          {currentSession && (
            <>
              <Button variant="secondary" size="sm" onClick={copyPublicLink} className="gap-1.5">
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
                {copiedLink ? "Link Copied" : "Copy Pass Link"}
              </Button>

              <a
                href={`/api/export?type=pre-event&sessionId=${currentSession.id}`}
                download
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-200 dark:hover:bg-navy-800 transition-colors shadow-sm"
              >
                <Download className="h-3.5 w-3.5 text-electric-500" />
                Export CSV
              </a>
            </>
          )}
        </div>
      </div>

      {/* Empty State Banner if no upcoming pre-events */}
      {sessions.length === 0 && (
        <div className="card p-8 text-center space-y-3 border-dashed border-2 border-slate-200 dark:border-navy-700">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-navy-800 text-slate-400 flex items-center justify-center mx-auto">
            <Ticket className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Upcoming Pre-Event Sessions Active
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Only upcoming sessions can be configured as pre-events. To open Pre-Event RSVPs,
              switch to the <strong>Sessions & QR</strong> tab and click <strong>+ Add Pre-Event</strong> on any upcoming meeting.
            </p>
          </div>
        </div>
      )}

      {/* ── Active Session Context Banner ── */}
      {currentSession && (
        <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-indigo-950 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-navy-700/60">
          <div>
            <div className="flex items-center gap-2">
              <Badge tone="blue">{currentSession.isActive ? "Active Meeting" : "Scheduled"}</Badge>
              <span className="text-xs font-mono text-slate-300">
                BUCC-{currentSession.id.slice(-4).toUpperCase()}
              </span>
            </div>
            <h3 className="text-lg font-bold mt-1 text-white">{currentSession.name}</h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-electric-400" />
                {format(new Date(currentSession.startsAt), "EEE, d MMMM yyyy")}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                {format(new Date(currentSession.startsAt), "hh:mm a")} –{" "}
                {format(new Date(currentSession.endsAt), "hh:mm a")}
              </span>
              {currentSession.venue && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-rose-400" />
                    {currentSession.venue}
                  </span>
                </>
              )}
            </div>
          </div>

          <a
            href={`/pre-event?session=${currentSession.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-xl bg-electric-600 hover:bg-electric-500 px-4 py-2 text-xs font-bold text-white transition-colors shadow-md"
          >
            Open Boarding Pass View
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* ── Summary Metrics KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Responses */}
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total RSVPs</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{total}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Recorded responses in Neon DB</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Confirmed Boarding */}
        <div className="card p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Boarding Confirmed (Coming)
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {confirmed}
              </span>
              <span className="text-xs font-bold text-emerald-600/80 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                {confirmedRate}% turn-out
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Confirmed attendees</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <PlaneTakeoff className="h-6 w-6" />
          </div>
        </div>

        {/* Cancelled Boarding */}
        <div className="card p-4 flex items-center justify-between border-l-4 border-l-rose-500">
          <div>
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
              Boarding Cancelled (Not Coming)
            </p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{cancelled}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Declined RSVPs</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <PlaneLanding className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* ── Department Breakdown Pills ── */}
      {data?.stats.deptStats && Object.keys(data.stats.deptStats).length > 0 && (
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
            Department Confirmations
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.stats.deptStats).map(([dept, count]) => (
              <div
                key={dept}
                className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-navy-800/80 px-3 py-1.5 text-xs"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200">{dept}:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {count.confirmed} Coming
                </span>
                {count.cancelled > 0 && (
                  <span className="text-rose-500 font-medium">({count.cancelled} Declined)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by member name, student ID, department, or designation…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 placeholder:text-slate-400"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-navy-800 p-1">
          {(["ALL", "Confirmed", "Cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold transition-all",
                statusFilter === s
                  ? "bg-white text-slate-900 shadow-sm dark:bg-navy-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              {s === "ALL" ? "All" : s === "Confirmed" ? `Coming (${confirmed})` : `Declined (${cancelled})`}
            </button>
          ))}
        </div>

        {/* Department Filter */}
        {departments.length > 0 && (
          <div className="relative">
            <select
              aria-label="Filter by department"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-10 appearance-none rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 pl-3 pr-8 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-electric-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        )}
      </div>

      {/* ── Data Table / List View ── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-900/40 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Boarding Status</th>
                <th className="px-4 py-3">RSVP Time</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800/60">
              {filteredRsvps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Ticket className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        No RSVP records found
                      </p>
                      <p className="text-xs text-slate-400">
                        {searchQuery
                          ? "Try clearing your search query or filters."
                          : "Share the Boarding Pass link with members to collect confirmations."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRsvps.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-navy-800/40 transition-colors"
                  >
                    {/* Member Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-navy-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                          {row.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                            {row.name}
                          </p>
                          <p className="text-[11px] text-slate-400">{row.designation}</p>
                        </div>
                      </div>
                    </td>

                    {/* Student ID */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-electric-600 dark:text-electric-400 bg-electric-500/10 px-2 py-0.5 rounded-md">
                        {row.studentId}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <Building className="h-3 w-3 text-slate-400" />
                        {row.dept}
                      </span>
                    </td>

                    {/* Designation */}
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                      {row.designation}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      {row.status === "Confirmed" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <PlaneTakeoff className="h-3.5 w-3.5" />
                          Boarding Confirmed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                          <PlaneLanding className="h-3.5 w-3.5" />
                          Boarding Cancelled
                        </span>
                      )}
                    </td>

                    {/* RSVP Time */}
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {format(new Date(row.updatedAt), "d MMM, hh:mm a")}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/pre-event?session=${row.sessionId}&studentId=${row.studentId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View Boarding Pass"
                          className="p-1.5 text-slate-500 hover:text-electric-600 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteRsvp(row.id, row.name)}
                          title="Delete RSVP"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 dark:bg-navy-900/40 px-4 py-2.5 border-t border-slate-100 dark:border-navy-800 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Showing {filteredRsvps.length} of {total} response{total === 1 ? "" : "s"}
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Neon DB table: pre_event_rsvps
          </span>
        </div>
      </div>
    </div>
  );
}
