"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import {
  ScrollText,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  User,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AuditLogRow = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  targetName?: string | null;
  targetMember?: {
    id: string;
    name: string;
    studentId: string;
    department: string;
  } | null;
  targetContext?: string | null;
  metadata: string | null;
  createdAt: string;
  actor: {
    name: string;
    department: string;
    role: string;
    profilePhotoUrl: string | null;
  } | null;
};

type AuditLogResponse = {
  rows: AuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
  actions: string[];
};

export function AuditLogTab() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [searchActor, setSearchActor] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Construct query string
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (actionFilter) params.set("action", actionFilter);
  if (debouncedSearch) params.set("q", debouncedSearch);
  if (fromDate) params.set("from", fromDate);
  if (toDate) params.set("to", toDate);

  const { data, error, isLoading, isValidating, mutate } = useSWR<AuditLogResponse>(
    `/api/admin/audit-logs?${params.toString()}`
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchActor);
    setPage(1);
  };

  const handleResetFilters = () => {
    setActionFilter("");
    setSearchActor("");
    setDebouncedSearch("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / (data.pageSize || 30))) : 1;

  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("APPROV")) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
    if (act.includes("REJECT") || act.includes("DELETE") || act.includes("REVOKE") || act.includes("DEACTIVATE")) {
      return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800";
    }
    if (act.includes("CREATE") || act.includes("SCAN") || act.includes("CHECKIN")) {
      return "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300 dark:border-sky-800";
    }
    if (act.includes("SYNC") || act.includes("TEMP_ROLE")) {
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800";
    }
    return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700";
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-700 dark:bg-navy-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-electric-600 dark:text-electric-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">System Audit Logs</h2>
              {data && (
                <Badge tone="gray" className="text-xs font-medium">
                  {data.total} recorded
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Immutable trail of privileged administrative actions and critical events.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => mutate()}
              disabled={isValidating}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isValidating && "animate-spin")} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search Actor */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search actor name..."
              value={searchActor}
              onChange={(e) => setSearchActor(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-electric-500 focus:outline-none focus:ring-1 focus:ring-electric-500 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-100"
            />
          </form>

          {/* Action Filter */}
          <div className="relative">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:border-electric-500 focus:outline-none focus:ring-1 focus:ring-electric-500 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-200"
            >
              <option value="">All Actions</option>
              {data?.actions?.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-xl border border-slate-300 bg-white px-2.5 text-xs text-slate-800 focus:border-electric-500 focus:outline-none focus:ring-1 focus:ring-electric-500 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-200"
              title="From Date"
            />
          </div>

          {/* Date To & Reset */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-xl border border-slate-300 bg-white px-2.5 text-xs text-slate-800 focus:border-electric-500 focus:outline-none focus:ring-1 focus:ring-electric-500 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-200"
              title="To Date"
            />
            {(actionFilter || debouncedSearch || fromDate || toDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-2.5 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-navy-700 dark:bg-navy-800">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw className="h-7 w-7 animate-spin text-electric-500" />
            <p className="mt-3 text-sm">Loading audit events...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-rose-500">
            <ShieldAlert className="h-8 w-8 mb-2" />
            <p className="text-sm font-medium">Failed to load audit records</p>
            <p className="text-xs text-slate-400">{error.message}</p>
          </div>
        ) : !data?.rows || data.rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <ScrollText className="h-10 w-10 stroke-1 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">No audit logs found</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-slate-500 dark:border-navy-700 dark:bg-navy-900/50 dark:text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Metadata</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-700">
                {data.rows.map((row) => {
                  const isExpanded = expandedId === row.id;
                  let parsedMeta: any = null;
                  if (row.metadata) {
                    try {
                      parsedMeta = JSON.parse(row.metadata);
                    } catch {
                      parsedMeta = row.metadata;
                    }
                  }

                  return (
                    <tr
                      key={row.id}
                      className="group transition-colors hover:bg-slate-50/60 dark:hover:bg-navy-700/40"
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        {format(new Date(row.createdAt), "MMM d, yyyy HH:mm:ss")}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide",
                            getActionBadgeColor(row.action)
                          )}
                        >
                          {row.action}
                        </span>
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {row.actor ? (
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                              {row.actor.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {row.actor.department} • {row.actor.role}
                            </div>
                          </div>
                        ) : (
                          <span className="italic text-slate-400">System / Unknown</span>
                        )}
                      </td>

                      {/* Target */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {row.targetMember ? (
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-electric-600 dark:text-electric-400" />
                              <span>{row.targetMember.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {row.targetMember.studentId && <span className="font-mono">{row.targetMember.studentId} • </span>}
                              <span className="capitalize">{row.targetType.replace(/_/g, " ")}</span>
                              {row.targetContext && <span className="text-slate-500 dark:text-slate-400 font-medium"> ({row.targetContext})</span>}
                            </div>
                          </div>
                        ) : row.targetName ? (
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {row.targetName}
                            </div>
                            <div className="text-[10px] text-slate-400 capitalize">
                              {row.targetType.replace(/_/g, " ")}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-slate-800 dark:text-slate-200 font-medium capitalize">
                              {row.targetType.replace(/_/g, " ")}
                            </div>
                            {row.targetId && (
                              <div className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]" title={row.targetId}>
                                {row.targetId}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Metadata Preview */}
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-300 text-[11px]">
                        {(() => {
                          if (!row.metadata) return <span className="text-slate-300 dark:text-slate-600">—</span>;
                          if (typeof parsedMeta === "object" && parsedMeta !== null) {
                            const parts: string[] = [];
                            if (parsedMeta.durationMinutes != null) {
                              const hrs = Math.floor(parsedMeta.durationMinutes / 60);
                              const mins = parsedMeta.durationMinutes % 60;
                              parts.push(`Duration: ${hrs > 0 ? `${hrs}h ` : ""}${mins}m`);
                            }
                            if (parsedMeta.reason) parts.push(`Reason: "${parsedMeta.reason}"`);
                            if (parsedMeta.system) parts.push("System timeout (2h)");
                            if (parsedMeta.oldRole || parsedMeta.newRole) parts.push(`Role: ${parsedMeta.oldRole || ""} → ${parsedMeta.newRole || ""}`);
                            if (parts.length > 0) return parts.join(" • ");

                            const keys = Object.keys(parsedMeta);
                            if (keys.length === 1 && (keys[0] === "memberId" || keys[0] === "targetMemberId")) {
                              return <span className="text-slate-400 italic">Target: {row.targetMember?.name || row.targetName || parsedMeta[keys[0]]}</span>;
                            }
                            return <span className="font-mono">{JSON.stringify(parsedMeta)}</span>;
                          }
                          return String(parsedMeta);
                        })()}
                      </td>

                      {/* Expand / Details */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {row.metadata && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            onClick={() => setExpandedId(isExpanded ? null : row.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Expanded metadata drawer if any */}
        {expandedId && (
          <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-navy-700 dark:bg-navy-900/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Log Details & Metadata ({expandedId})
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                onClick={() => setExpandedId(null)}
              >
                Close
              </Button>
            </div>
            <pre className="max-h-60 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-200 font-mono">
              {(() => {
                const row = data?.rows.find((r) => r.id === expandedId);
                if (!row) return "Not found";
                try {
                  return JSON.stringify(
                    {
                      id: row.id,
                      action: row.action,
                      actor: row.actor,
                      targetType: row.targetType,
                      targetId: row.targetId,
                      createdAt: row.createdAt,
                      metadata: row.metadata ? JSON.parse(row.metadata) : null,
                    },
                    null,
                    2
                  );
                } catch {
                  return row.metadata || "No metadata";
                }
              })()}
            </pre>
          </div>
        )}

        {/* Pagination Footer */}
        {data && data.total > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-navy-700 dark:bg-navy-900/30">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing page <strong className="text-slate-700 dark:text-slate-200">{page}</strong> of{" "}
              <strong className="text-slate-700 dark:text-slate-200">{totalPages}</strong> ({data.total} total)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
