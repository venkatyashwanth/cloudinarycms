import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const protectedRoutes = ["/admindashboard"];
const publicRoutes = ["/login"];

export default async function middleware(req) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);

  const cookie = req.cookies.get("session")?.value;
  const session = await decrypt(cookie);

  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isPublicRoute && session?.userId) {
    return NextResponse.redirect(new URL("/admindashboard", req.nextUrl));
  }

  return NextResponse.next();
}
