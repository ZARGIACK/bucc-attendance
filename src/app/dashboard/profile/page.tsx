import { Metadata } from "next";
import { requirePageMember } from "@/lib/page-guards";
import { MemberProfile } from "@/components/member-profile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Member Profile | BUCC Attendance",
  description: "View volunteering hours, attendance history, and department ranking.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const currentMember = await requirePageMember();
  const sp = await searchParams;
  const targetMemberId = sp?.id || currentMember.id;
  const isViewingOther = Boolean(sp?.id && sp.id !== currentMember.id);

  return (
    <div className="py-2">
      <MemberProfile memberId={targetMemberId} />
    </div>
  );
}
