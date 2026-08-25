/**
 * POST /api/attendance/scan  { token, sessionId }
 *
 * An HR SE / EB / HR EB / GB scans a member's rotating QR to mark them
 * present. The scanner is also checked in to the same session as a
 * side-effect, since they are by definition at the venue.
 *
 * There is no location check on either party. The QR itself is the proof of
 * presence: it rotates every 60s and is signed server-side, so it has to be
 * read off the member's live screen. The IP + device audit trail covers the
 * rest.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireMember, handleApiError, assertSameOrigin, ApiError } from "@/lib/api-guards";
import { verifyQrToken } from "@/lib/qr";
import { checkIn } from "@/lib/attendance-service";
import { can } from "@/lib/rbac";
import { getClientIp, getDeviceType } from "@/lib/utils";

const bodySchema = z.object({
  token: z.string().min(10).max(500),
  sessionId: z.string().cuid(),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const scanner = await requireMember();

    // Single source of truth for who may scan — see rbac.ts. Previously an
    // inline role array here, which drifted from the permission matrix.
    if (!can(scanner.role, "attendance:scan")) {
      throw new ApiError(403, "You do not have permission to scan member QRs.");
    }

    // Scanning is unmetered on purpose: an HR SE clearing a queue of members
    // must never be throttled mid-event.
    const { token, sessionId } = bodySchema.parse(await req.json());

    // Verify the member's QR token
    const targetMemberId = verifyQrToken(token);
    if (!targetMemberId) throw new ApiError(400, "Invalid or expired QR code.");

    const targetMember = await prisma.member.findUnique({ where: { id: targetMemberId } });
    if (!targetMember) throw new ApiError(404, "Member not found.");
    if (!targetMember.isActive) throw new ApiError(403, `${targetMember.name}'s account is deactivated.`);

    // Check the scanner in too. This is a convenience side-effect, so the
    // benign conflicts ("already here", "still in another session") must not
    // abort the scan — but a genuine failure (DB down, session closed) must,
    // rather than being swallowed and reported as a success.
    let scannerNotice: string | undefined;
    try {
      await checkIn(scanner, sessionId, "MANUAL", {
        ip: getClientIp(req),
        deviceType: getDeviceType(req),
      });
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 409) throw err;
      // Already checked in here is the normal case and needs no notice.
      // Being checked in elsewhere silently left the scanner's own
      // attendance unmarked, which they had no way of knowing.
      if (err.message !== "ALREADY_CHECKED_IN") scannerNotice = err.message;
    }

    try {
      // Check the target member into the session
      const { session } = await checkIn(targetMember, sessionId, "QR", {
        ip: getClientIp(req),
        deviceType: getDeviceType(req),
      });
      return NextResponse.json({
        action: "checked_in",
        sessionName: session.name,
        message: `${targetMember.name} marked present! ✅`,
        scannerNotice,
      });
    } catch (err) {
      // Second scan of the same member. Report it and change nothing: no
      // sign-out flow, no record touched. An HR SE clearing a queue will
      // re-scan people by accident and that must never move anyone's state.
      if (err instanceof ApiError && err.message === "ALREADY_CHECKED_IN") {
        return NextResponse.json({
          action: "already_checked_in",
          message: `${targetMember.name} is already present.`,
          scannerNotice,
        });
      }
      throw err;
    }
  } catch (err) {
    return handleApiError(err);
  }
}
