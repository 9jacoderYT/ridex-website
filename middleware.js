// Path: middleware.js (root of your project)

import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production",
);

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // ============================================
  // ADMIN ROUTES PROTECTION
  // ============================================
  if (pathname.startsWith("/admindashboard")) {
    try {
      const token = request.cookies.get("admin-session")?.value;

      if (!token) {
        // No admin session, redirect to admin login
        return NextResponse.redirect(new URL("/loginadminusers", request.url));
      }

      // Verify admin token
      await jwtVerify(token, secret);

      // Token is valid, continue
      return NextResponse.next();
    } catch (error) {
      // Invalid token, redirect to admin login
      return NextResponse.redirect(new URL("/loginadminusers", request.url));
    }
  }

  // If admin already logged in and trying to access admin login page, redirect to dashboard
  if (pathname === "/loginadminusers") {
    try {
      const token = request.cookies.get("admin-session")?.value;

      if (token) {
        await jwtVerify(token, secret);
        return NextResponse.redirect(new URL("/admindashboard", request.url));
      }
    } catch (error) {
      // Invalid token, continue to login page
    }
  }

  // ============================================
  // COMPANY ROUTES PROTECTION
  // ============================================
  if (pathname.startsWith("/company") && pathname !== "/company/login") {
    try {
      const companySession = request.cookies.get("company_session")?.value;

      if (!companySession) {
        // No company session, redirect to company login
        return NextResponse.redirect(new URL("/company/login", request.url));
      }

      // Company session exists (simple UUID check - we don't use JWT for companies)
      // The session is validated server-side in the CompanyContext
      return NextResponse.next();
    } catch (error) {
      // Invalid session, redirect to company login
      return NextResponse.redirect(new URL("/company/login", request.url));
    }
  }

  // If company already logged in and trying to access company login page, redirect to dashboard
  if (pathname === "/company/login") {
    try {
      const companySession = request.cookies.get("company_session")?.value;

      if (companySession) {
        // Has session, redirect to company dashboard
        return NextResponse.redirect(
          new URL("/company/dashboard", request.url),
        );
      }
    } catch (error) {
      // Invalid session, continue to login page
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admindashboard/:path*", "/loginadminusers", "/company/:path*"],
};
