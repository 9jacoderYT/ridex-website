// lib/utils/sendNotificationEmail.js
// Fire-and-forget wrapper around the send-notification-email Edge Function.
// Never throws — email failure must never break the primary action.

import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * @param {"wallet_refund"|"admin_wallet_credit"|"rider_status_change"|"company_approved"|"company_deactivated"|"withdrawal_rejected"} type
 * @param {string} to  - recipient email address
 * @param {object} data - event-specific payload (see edge function for shape)
 */
export async function sendNotificationEmail(type, to, data) {
  if (!to) return;
  try {
    const { error } = await supabaseAdmin.functions.invoke("send-notification-email", {
      body: { type, to, data },
    });
    if (error) {
      console.error(`sendNotificationEmail [${type}] error:`, error.message);
    }
  } catch (err) {
    console.error(`sendNotificationEmail [${type}] exception:`, err);
  }
}
