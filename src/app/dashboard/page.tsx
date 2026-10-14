import Link from "next/link";
import { PlaneTakeoff } from "lucide-react";
import { requirePageMember } from "@/lib/page-guards";
import { PersonalView } from "@/components/personal-view";
import { DashboardLiveMeeting } from "@/components/dashboard-live-meeting";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [member, activePreEvent] = await Promise.all([
    requirePageMember(),
    prisma.session.findFirst({
      where: {
        isPreEvent: true,
        startsAt: { gt: new Date() }, // Turns off right when meeting starts
      },
      select: { id: true },
    }),
  ]);

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">My Attendance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {member.name} · {member.studentId} · {member.department} · {member.designation}
          </p>
        </div>
        {/* Pre-event button only turns on before meeting starts */}
        {activePreEvent && (
          <Link
            href="/pre-event"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-electric-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-electric-500 hover:to-indigo-500 transition-all self-start sm:self-auto"
          >
            <PlaneTakeoff className="h-4 w-4" />
            Pre-Event Boarding Pass
          </Link>
        )}
      </div>

      {/* Automatically turns on when actual meeting is live for QR Scan */}
      <DashboardLiveMeeting member={member} />

      <PersonalView />
    </>
  );
}
