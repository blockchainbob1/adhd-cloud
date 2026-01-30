import type { NextAuthConfig } from "next-auth";
import { UserRole } from "@prisma/client";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Public routes
      const publicRoutes = ["/", "/login", "/register"];
      if (publicRoutes.includes(pathname)) {
        return true;
      }

      // Protected dashboard routes
      const isDashboardRoute =
        pathname.startsWith("/patient") ||
        pathname.startsWith("/doctor") ||
        pathname.startsWith("/reception") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/consultation");

      if (isDashboardRoute) {
        if (!isLoggedIn) return false;

        // Role-based access control
        const role = auth?.user?.role as UserRole;

        if (pathname.startsWith("/patient") && role !== "PATIENT") {
          return Response.redirect(new URL(`/${role.toLowerCase()}`, nextUrl));
        }
        if (pathname.startsWith("/doctor") && role !== "DOCTOR") {
          return Response.redirect(new URL(`/${role.toLowerCase()}`, nextUrl));
        }
        if (pathname.startsWith("/reception") && role !== "RECEPTION") {
          return Response.redirect(new URL(`/${role.toLowerCase()}`, nextUrl));
        }
        if (pathname.startsWith("/admin") && role !== "CLINIC_MANAGER") {
          return Response.redirect(new URL(`/${role.toLowerCase()}`, nextUrl));
        }

        return true;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
      }
      return session;
    },
  },
  providers: [],
};
