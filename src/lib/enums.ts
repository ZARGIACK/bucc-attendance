export const Role = {
  MEMBER: "MEMBER",
  EB: "EB",
  SE: "SE",
  HR_EB: "HR_EB",
  HR_SE: "HR_SE",
  GB: "GB",
} as const;
export type Role = typeof Role[keyof typeof Role];

export const AttendanceStatus = {
  PRESENT: "PRESENT",
  PENDING_SIGNOUT: "PENDING_SIGNOUT",
  LEFT: "LEFT",
  /**
   * Signed out by HR because the member left without signing out.
   * `durationMinutes` is deliberately left null so the time is NOT credited
   * to the leaderboard — see force-signout/route.ts.
   */
  LEFT_FORCED: "LEFT_FORCED",
} as const;
export type AttendanceStatus = typeof AttendanceStatus[keyof typeof AttendanceStatus];

/** Statuses that mean the member is no longer in the session. */
export const TERMINAL_ATTENDANCE_STATUSES: AttendanceStatus[] = [
  AttendanceStatus.LEFT,
  AttendanceStatus.LEFT_FORCED,
];

export const CheckMethod = {
  QR: "QR",
  MANUAL: "MANUAL",
} as const;
export type CheckMethod = typeof CheckMethod[keyof typeof CheckMethod];

export const SignoutAction = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  AUTO_APPROVED: "AUTO_APPROVED",
} as const;
export type SignoutAction = typeof SignoutAction[keyof typeof SignoutAction];

export const NotificationType = {
  SIGNOUT_REQUEST: "SIGNOUT_REQUEST",
  SIGNOUT_APPROVED: "SIGNOUT_APPROVED",
  SIGNOUT_REJECTED: "SIGNOUT_REJECTED",
  SIGNOUT_ESCALATED: "SIGNOUT_ESCALATED",
  CHECK_IN: "CHECK_IN",
  ANNOUNCEMENT: "ANNOUNCEMENT",
  SYSTEM: "SYSTEM",
} as const;
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];
