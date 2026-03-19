// Path: app/api/webhooks/flutterwave/route.js
// Handles Flutterwave webhooks for both payment and transfer events

import { supabaseAdmin } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Verify webhook signature
    const verifyHash = request.headers.get("verif-hash");
    if (!verifyHash || verifyHash !== process.env.FLUTTERWAVE_WEBHOOK_HASH) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { event, data } = body;

    // ── Transfer events (withdrawal payouts) ────────────────────────────────
    if (event === "transfer.completed" || event === "transfer.failed") {
      const reference = data?.reference ?? "";

      // Our references are formatted as RIDEX-WD-<uuid>
      if (!reference.startsWith("RIDEX-WD-")) {
        return NextResponse.json({ received: true });
      }

      const withdrawalId = reference.replace("RIDEX-WD-", "");

      const { data: wr } = await supabaseAdmin
        .from("withdrawal_requests")
        .select("id, status, rider_id, company_id, amount, requester_type")
        .eq("id", withdrawalId)
        .single();

      if (!wr || wr.status === "completed" || wr.status === "failed") {
        return NextResponse.json({ received: true }); // idempotent
      }

      if (event === "transfer.completed") {
        await supabaseAdmin
          .from("withdrawal_requests")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", withdrawalId);
      }

      if (event === "transfer.failed") {
        // Restore balance
        if (wr.requester_type === "rider" && wr.rider_id) {
          await supabaseAdmin.rpc("restore_rider_wallet", {
            p_rider_id: wr.rider_id,
            p_amount: wr.amount,
          });
        } else if (wr.requester_type === "company" && wr.company_id) {
          await supabaseAdmin.rpc("restore_company_wallet", {
            p_company_id: wr.company_id,
            p_amount: wr.amount,
          });
        }

        await supabaseAdmin
          .from("withdrawal_requests")
          .update({
            status: "failed",
            failure_reason: data?.complete_message || "Transfer failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", withdrawalId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Flutterwave webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
