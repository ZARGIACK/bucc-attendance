import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { lookupCentralMember, deriveRole, isRoleLocked } from "@/lib/central-db";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  // Send sign-in failures to our own landing page as `/?error=AccessDenied`
  // instead of NextAuth's unbranded /api/auth/error. Without this, a member
  // who is not in the central DB (or is deactivated, or used a personal
  // Gmail) saw a bare "Access Denied" with no explanation and no way back —
  // the ERROR_MESSAGES map on the landing page was unreachable.
  pages: {
    signIn: "/",
    error: "/",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const domain = process.env.ALLOWED_EMAIL_DOMAIN;
      if (domain && !user.email.endsWith(`@${domain}`)) {
        return false;
      }
      
      const centralMember = await lookupCentralMember(user.email);
      if (!centralMember || !centralMember.isActive) {
        return false; // Only active central members can log in
      }

      // Upsert local member profile
      await prisma.member.upsert({
        where: { email: centralMember.email },
        update: {
          name: centralMember.name,
          studentId: centralMember.studentId,
          department: centralMember.department,
          designation: centralMember.designation,
          // Role-locked accounts keep the role they were granted by hand.
          // (On `create` there is no prior grant to preserve, so we derive.)
          ...(isRoleLocked(centralMember.email)
            ? {}
            : { role: deriveRole(centralMember.department, centralMember.designation) }),
          isActive: centralMember.isActive,
          profilePhotoUrl: user.image || null,
        },
        create: {
          email: centralMember.email,
          name: centralMember.name,
          studentId: centralMember.studentId,
          department: centralMember.department,
          designation: centralMember.designation,
          role: deriveRole(centralMember.department, centralMember.designation),
          isActive: centralMember.isActive,
          profilePhotoUrl: user.image || null,
        },
      });

      return true;
    },
    async jwt({ token, user }) {
      const email = user?.email || (token.email as string | undefined);
      const memberId = token.memberId as string | undefined;
      if (email || memberId) {
        const member = await prisma.member.findFirst({
          where: memberId ? { id: memberId } : { email: email! },
        });
        if (member) {
          token.memberId = member.id;
          let role = member.role;
          if (member.tempRole && member.tempRoleExpiresAt && member.tempRoleExpiresAt > new Date()) {
            role = member.tempRole;
          }
          token.role = role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.memberId) {
        session.user.memberId = token.memberId as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
