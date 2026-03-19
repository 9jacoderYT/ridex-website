"use server";

import { deleteSession } from "../utils/session";
import { redirect } from "next/navigation";

export async function logoutAdmin() {
  try {
    await deleteSession();
    redirect("/loginadminusers");
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      error: "Failed to logout",
    };
  }
}
