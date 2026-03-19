// Path: lib/server-actions/company/logout.js

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutCompany() {
  const cookieStore = await cookies();
  cookieStore.delete("company_session");
  redirect("/company/login");
}
