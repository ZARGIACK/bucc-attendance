"use client";

import { useState, useEffect, useRef } from "react";
import { mutate } from "swr";
import confetti from "canvas-confetti";
import { format } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  PlaneTakeoff,
  PlaneLanding,
  Calendar,
  MapPin,
  Clock,
  User,
  Building,
  Award,
  Sparkles,
  Share2,
  Printer,
  ChevronDown,
  RefreshCw,
  Search,
  Check,
  AlertCircle,
  QrCode as QrIcon,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

export type SessionInfo = {
  id: string;
  name: string;
  venue: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

export type MemberInfo = {
  id?: string;
  name: string;
  studentId: string;
  dept: string;
  designation: string;
  role?: string;
};

export type RsvpStatus = "Confirmed" | "Cancelled" | null;

interface BoardingPassProps {
  initialSession?: SessionInfo | null;
  availableSessions?: SessionInfo[];
  currentMember?: MemberInfo | null;
  initialStatus?: RsvpStatus;
  onStatusChange?: (status: "Confirmed" | "Cancelled", member: MemberInfo) => void;
}

export function BoardingPass({
  initialSession,
  availableSessions = [],
  currentMember,
  initialStatus = null,
  onStatusChange,
}: BoardingPassProps) {
  const [selectedSession, setSelectedSession] = useState<SessionInfo | null>(
    initialSession || availableSessions[0] || null
  );
  const [member, setMember] = useState<MemberInfo | null>(currentMember || null);
  const [status, setStatus] = useState<RsvpStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [studentIdInput, setStudentIdInput] = useState("");
  const [searchingMember, setSearchingMember] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Sync session if initial changes
  useEffect(() => {
    if (initialSession) setSelectedSession(initialSession);
  }, [initialSession]);

  // Sync member if currentMember changes
  useEffect(() => {
    if (currentMember) {
      setMember(currentMember);
      setStudentIdInput(currentMember.studentId);
    }
  }, [currentMember]);

  // Fetch member's status whenever session or member changes
  useEffect(() => {
    if (!selectedSession || !member?.studentId) return;

    let cancelled = false;
    async function checkStatus() {
      try {
        const res = await fetch(
          `/api/pre-event?sessionId=${selectedSession?.id}&studentId=${member?.studentId}`
        );
        if (res.ok && !cancelled) {
          const data = await res.json();
          if (data.userRsvp) {
            setStatus(data.userRsvp.status);
            setLastUpdated(new Date(data.userRsvp.updatedAt));
          } else {
            setStatus(null);
          }
        }
      } catch (err) {
        // silent fallback
      }
    }
    checkStatus();
    return () => {
      cancelled = true;
    };
  }, [selectedSession?.id, member?.studentId]);

  // Member lookup by Student ID (for users who opened link without signing in)
  async function handleLookupMember(e: React.FormEvent) {
    e.preventDefault();
    const sid = studentIdInput.trim();
    if (!sid) return;

    setSearchingMember(true);
    try {
      const res = await fetch(`/api/pre-event/member?studentId=${encodeURIComponent(sid)}`);
      const data = await res.json();
      if (!res.ok) {
        toast("error", data.error || "Student ID not found in club database");
        return;
      }
      setMember(data.member);
      toast("success", `Welcome aboard, ${data.member.name.split(" ")[0]}!`);
    } catch (err) {
      toast("error", "Failed to search member");
    } finally {
      setSearchingMember(false);
    }
  }

  // Handle RSVP submission
  async function handleRsvp(newStatus: "Confirmed" | "Cancelled") {
    if (!member) {
      toast("error", "Please provide your Student ID or log in to RSVP");
      return;
    }
    if (!selectedSession) {
      toast("error", "No scheduled meeting selected");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/pre-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: member.name,
          dept: member.dept,
          studentId: member.studentId,
          designation: member.designation,
          status: newStatus,
          sessionId: selectedSession.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update RSVP");

      setStatus(newStatus);
      setLastUpdated(new Date());

      // Trigger immediate real-time synchronization across all tabs and components
      void mutate((key) => typeof key === "string" && key.startsWith("/api/pre-event"));

      if (newStatus === "Confirmed") {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#10b981", "#3b82f6", "#f59e0b", "#6366f1"],
        });
        toast("success", "Boarding Confirmed! See you at the session.");
      } else {
        toast("info", "Boarding Cancelled. Your RSVP has been updated.");
      }

      onStatusChange?.(newStatus, member);
    } catch (err: any) {
      toast("error", err.message || "Something went wrong saving to Neon database");
    } finally {
      setLoading(false);
    }
  }

  function handleShare() {
    const url = new URL(window.location.href);
    if (selectedSession) url.searchParams.set("session", selectedSession.id);
    if (member?.studentId) url.searchParams.set("studentId", member.studentId);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    toast("success", "Boarding Pass link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  }

  function handlePrint() {
    window.print();
  }

  const meetingDate = selectedSession?.startsAt
    ? format(new Date(selectedSession.startsAt), "EEE, d MMMM yyyy")
    : "TBD Date";
  const meetingTime = selectedSession?.startsAt
    ? `${format(new Date(selectedSession.startsAt), "hh:mm a")} – ${selectedSession.endsAt ? format(new Date(selectedSession.endsAt), "hh:mm a") : "End"
    }`
    : "TBD Time";
  const venue = selectedSession?.venue || "Club Room 3";
  const flightCode = selectedSession
    ? `BUCC-${selectedSession.id.slice(-4).toUpperCase()}`
    : "BUCC-2026";

  const qrPayload = typeof window !== "undefined"
    ? `${window.location.origin}/pre-event?session=${selectedSession?.id || ""}&sid=${member?.studentId || ""}`
    : `BUCC-PASS-${member?.studentId || "GUEST"}`;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Session Selector & Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/70 dark:bg-navy-900/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-navy-800 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <PlaneTakeoff className="h-5 w-5 text-electric-600 dark:text-electric-400" />
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            Scheduled Meeting:
          </span>
          {availableSessions.length > 1 ? (
            <div className="relative">
              <select
                aria-label="Select meeting session"
                value={selectedSession?.id || ""}
                onChange={(e) => {
                  const s = availableSessions.find((x) => x.id === e.target.value);
                  if (s) setSelectedSession(s);
                }}
                className="appearance-none rounded-xl bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 px-3 py-1.5 pr-8 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500"
              >
                {availableSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({format(new Date(s.startsAt), "d MMM")})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          ) : (
            <span className="text-sm font-bold text-electric-600 dark:text-electric-400">
              {selectedSession?.name || "Upcoming Session"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleShare} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Share Pass"}
          </Button>
          <Button variant="secondary" size="sm" onClick={handlePrint} className="gap-1.5 hidden sm:flex">
            <Printer className="h-3.5 w-3.5" />
            Print Pass
          </Button>
        </div>
      </div>

      {/* Member Lookup if not identified yet */}
      {!member && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-slate-800 dark:text-slate-200 print:hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" /> Guest Mode: Enter Student ID
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Enter your 8-digit BRACU Student ID to load your personalized Boarding Pass.
              </p>
            </div>
            <form onSubmit={handleLookupMember} className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="e.g. 24301000"
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 w-36 sm:w-44"
              />
              <Button type="submit" size="sm" loading={searchingMember} className="gap-1.5">
                <Search className="h-3.5 w-3.5" /> Lookup
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ── THE BOARDING PASS TICKET ───────────────────────────────────── */}
      <div className="relative group transition-all duration-300">
        {/* Glow halo in background */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 blur-xl opacity-75 group-hover:opacity-100 transition duration-500 pointer-events-none" />

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-navy-950 via-slate-900 to-navy-900 border border-slate-700/60 shadow-2xl text-white">
          {/* Top Aerospace Ribbon */}
          <div className="bg-gradient-to-r from-electric-700 via-indigo-600 to-navy-800 px-6 py-3.5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <img src="/bucc-logo.png" alt="BUCC" className="h-6 w-auto object-contain" />
              </div>
              <div>
                <p className="text-xs font-black tracking-widest text-white uppercase">
                  BUCC AIRWAYS · PRE-EVENT PASS
                </p>
                <p className="text-[10px] tracking-wider text-white/80 font-mono">
                  BRAC UNIVERSITY COMPUTER CLUB
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] uppercase font-mono tracking-wider text-slate-300">
                  FLIGHT NO.
                </p>
                <p className="text-xs font-black tracking-widest text-amber-400 font-mono">
                  {flightCode}
                </p>
              </div>
              <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold tracking-wider uppercase backdrop-blur-md border border-white/20 text-white shadow-sm">
                PRIORITY BOARDING
              </span>
            </div>
          </div>

          {/* Ticket Body Layout: Left Main Section + Perforation + Right Stub */}
          <div className="flex flex-col lg:flex-row relative">
            {/* ── MAIN BOARDING SECTION (LEFT) ── */}
            <div className="flex-1 p-6 sm:p-8 space-y-6">
              {/* Route & Session Name */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-electric-400 uppercase font-semibold">
                    DESTINATION MEETING
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                    {selectedSession?.name || "Scheduled BUCC Meeting"}
                  </h2>
                </div>

                {/* Simulated Airport Route: BRACU ✈ CLUB */}
                <div className="flex items-center gap-3 self-start sm:self-center bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
                  <div className="text-center">
                    <p className="text-xs font-mono font-bold tracking-wider text-slate-400">DEP</p>
                    <p className="text-sm font-black text-white">BRACU</p>
                  </div>
                  <div className="flex flex-col items-center px-1">
                    <PlaneTakeoff className="h-4 w-4 text-electric-400 animate-pulse" />
                    <div className="w-12 border-t border-dashed border-white/30 my-1" />
                    <span className="text-[9px] font-mono text-slate-400">NON-STOP</span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-mono font-bold tracking-wider text-slate-400">ARR</p>
                    <p className="text-sm font-black text-amber-400">SESSION</p>
                  </div>
                </div>
              </div>

              {/* Passenger Credentials Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                <div className="col-span-2">
                  <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                    PASSENGER NAME
                  </p>
                  <p className="text-base sm:text-lg font-black tracking-wide text-white uppercase truncate">
                    {member ? member.name : "GUEST VOLUNTEER"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                    STUDENT ID
                  </p>
                  <p className="text-sm sm:text-base font-bold font-mono tracking-wider text-electric-300">
                    {member ? member.studentId : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                    CABIN / DEPT
                  </p>
                  <p className="text-sm sm:text-base font-bold text-white truncate">
                    {member ? member.dept : "BUCC Club"}
                  </p>
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                    DESIGNATION
                  </p>
                  <p className="text-sm font-semibold text-slate-300 truncate">
                    {member ? member.designation : "Member"}
                  </p>
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                    GATE / VENUE
                  </p>
                  <p className="text-sm font-bold text-white flex items-center gap-1 truncate">
                    <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                    {venue}
                  </p>
                </div>

                {/* Expanded full span (4 cols) so Date & Time fit on one line without breaking */}
                <div className="col-span-2 sm:col-span-4 pt-1">
                  <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                    BOARDING DATE & TIME
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-200 mt-0.5">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-white font-bold">
                      <Calendar className="h-3.5 w-3.5 text-electric-400 shrink-0" />
                      <span>{meetingDate}</span>
                    </span>
                    <span className="text-slate-500 font-bold">·</span>
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-amber-300 font-medium">
                      <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>{meetingTime}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Stamp & Interaction Row */}
              <div className="pt-4 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Live Boarding Status Badge */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                    STATUS:
                  </span>
                  {status === "Confirmed" ? (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-1.5 text-emerald-400 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-500/10 animate-in fade-in zoom-in-95 duration-200">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      BOARDING CONFIRMED
                    </div>
                  ) : status === "Cancelled" ? (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-rose-500/20 border border-rose-500/40 px-3.5 py-1.5 text-rose-400 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-rose-500/10 animate-in fade-in zoom-in-95 duration-200">
                      <XCircle className="h-4 w-4 text-rose-400" />
                      BOARDING CANCELLED
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3.5 py-1.5 text-amber-300 font-semibold text-xs sm:text-sm tracking-wide animate-pulse">
                      <Clock className="h-4 w-4 text-amber-400" />
                      RSVP PENDING
                    </div>
                  )}
                  {lastUpdated && (
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      (Saved {format(lastUpdated, "hh:mm a")})
                    </span>
                  )}
                </div>

                {/* RSVP Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleRsvp("Confirmed")}
                    disabled={loading || !member}
                    className={cn(
                      "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 shadow-md",
                      status === "Confirmed"
                        ? "bg-emerald-500 text-white ring-2 ring-emerald-400 ring-offset-2 ring-offset-navy-950 shadow-emerald-500/30"
                        : "bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98]",
                      (loading || !member) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <PlaneTakeoff className="h-4 w-4" />
                    <span>Coming</span>
                  </button>

                  <button
                    onClick={() => handleRsvp("Cancelled")}
                    disabled={loading || !member}
                    className={cn(
                      "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                      status === "Cancelled"
                        ? "bg-rose-500/25 text-rose-300 border border-rose-500/60 ring-2 ring-rose-500/30"
                        : "bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/40",
                      (loading || !member) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <PlaneLanding className="h-4 w-4" />
                    <span>Not Coming</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── PERFORATION DIVIDER & NOTCHES ── */}
            <div className="relative flex lg:flex-col items-center justify-between">
              {/* Top notch cutout */}
              <div className="hidden lg:block absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-950 border border-slate-700/60 shadow-inner z-10" />
              {/* Bottom notch cutout */}
              <div className="hidden lg:block absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-950 border border-slate-700/60 shadow-inner z-10" />

              {/* Dashed Perforated Line */}
              <div className="w-full lg:w-0 lg:h-full border-t lg:border-t-0 lg:border-l-2 border-dashed border-white/20 my-2 lg:my-0 lg:mx-0" />
            </div>

            {/* ── TEAR-OFF BOARDING STUB (RIGHT) ── */}
            <div className="w-full lg:w-72 bg-white/[0.03] p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                    BOARDING STUB
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {flightCode}
                  </span>
                </div>

                {/* Passenger Stub info */}
                <div>
                  <p className="text-[9px] font-mono text-slate-400 uppercase">PASSENGER</p>
                  <p className="text-sm font-bold text-white uppercase truncate">
                    {member ? member.name : "GUEST"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[9px] font-mono text-slate-400 uppercase">STUDENT ID</p>
                    <p className="font-mono font-bold text-slate-200">{member ? member.studentId : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-slate-400 uppercase">ZONE</p>
                    <p className="font-bold text-white">PRIORITY A</p>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="p-3 bg-white rounded-2xl flex flex-col items-center justify-center shadow-md">
                  <QRCodeSVG
                    value={qrPayload}
                    size={110}
                    level="M"
                    fgColor="#0a0f1d"
                    bgColor="#ffffff"
                  />
                  <p className="text-[9px] font-mono font-bold text-slate-600 mt-1.5 tracking-wider uppercase">
                    SCAN TO VERIFY PASS
                  </p>
                </div>
              </div>

              {/* Barcode line aesthetic */}
              <div className="space-y-1">
                <div className="h-7 w-full flex items-center justify-between gap-0.5 overflow-hidden opacity-75">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-full bg-white",
                        i % 7 === 0 ? "w-1.5" : i % 3 === 0 ? "w-1" : "w-0.5"
                      )}
                    />
                  ))}
                </div>
                <p className="text-[8px] font-mono tracking-widest text-center text-slate-400">
                  *{member?.studentId || "00000000"}*BUCC*2026*
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
