"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR, { useSWRConfig } from "swr";
import { Bell, Check, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";

type NotificationRow = {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  metadata?: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const { mutate: globalMutate } = useSWRConfig();

  const { data, mutate } = useSWR<{ notifications: NotificationRow[]; unread: number }>(
    "/api/notifications",
    { refreshInterval: 15000 }, // polling fallback; SSE revalidates sooner
  );
  const unread = data?.unread ?? 0;

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" });
    void mutate();
  }

  async function approveSignout(requestId: string) {
    setApprovingId(requestId);
    try {
      const res = await fetch(`/api/approvals/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "approve" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.error === "This request has already been reviewed") {
          toast("info", "This sign-out has already been reviewed.");
          setApprovedIds((prev) => new Set(prev).add(requestId));
        } else {
          throw new Error(body.error ?? "Failed to approve");
        }
      } else {
        toast("success", "Sign-out approved ✅");
        setApprovedIds((prev) => new Set(prev).add(requestId));
      }
      void mutate();
      void globalMutate((key) => typeof key === "string" && (key.startsWith("/api/approvals") || key.startsWith("/api/dashboard")));
    } catch (err: any) {
      toast("error", err.message || "Failed to approve sign-out");
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unread > 0) void markAllRead();
        }}
        className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-800"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 z-50 mt-2 max-h-[28rem] w-84 sm:w-96 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-navy-700 dark:bg-navy-900"
            role="menu"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-navy-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Notifications
              </span>
              <Link
                href="/dashboard/approvals"
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-electric-600 hover:underline dark:text-electric-400"
              >
                Approvals Board →
              </Link>
            </div>

            {!data?.notifications.length ? (
              <p className="px-3 py-8 text-center text-sm text-slate-500">No notifications yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-navy-800/60">
                {data.notifications.map((n) => {
                  let requestId: string | null = null;
                  if (n.metadata && (n.type === "SIGNOUT_REQUEST" || n.type === "SIGNOUT_ESCALATED")) {
                    try {
                      const meta = typeof n.metadata === "string" ? JSON.parse(n.metadata) : n.metadata;
                      requestId = meta?.signoutRequestId || null;
                    } catch {
                      // ignore parse error
                    }
                  }

                  const isApproved = requestId ? approvedIds.has(requestId) : false;

                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "rounded-xl px-3 py-2.5 text-sm transition-colors",
                        !n.isRead ? "bg-electric-500/5 font-medium" : "hover:bg-slate-50 dark:hover:bg-navy-800/40",
                      )}
                    >
                      <p className="text-slate-800 dark:text-slate-100 text-xs sm:text-sm leading-snug">{n.message}</p>
                      
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </span>

                        {requestId && (
                          <div className="flex items-center gap-2">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <Check className="h-3 w-3" /> Approved
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void approveSignout(requestId!);
                                }}
                                disabled={approvingId === requestId}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                              >
                                {approvingId === requestId ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                                Approve
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
