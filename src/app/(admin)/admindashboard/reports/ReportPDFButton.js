// Path: app/(admin)/admindashboard/reports/ReportPDFButton.js
// This file is ONLY imported via dynamic() with ssr:false — never server-rendered.
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const S = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, padding: 36, color: "#111" },
  header: { marginBottom: 20 },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#2563eb" },
  subtitle: { fontSize: 10, color: "#6b7280", marginTop: 3 },
  period: {
    fontSize: 9,
    color: "#374151",
    marginTop: 2,
    fontFamily: "Helvetica-Oblique",
  },
  divider: { borderBottom: "1pt solid #e5e7eb", marginVertical: 10 },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1f2937",
    marginBottom: 6,
  },
  grid2: { flexDirection: "row", gap: 8 },
  grid4: { flexDirection: "row", gap: 6 },
  card: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    padding: 8,
    border: "1pt solid #e5e7eb",
  },
  cardLabel: { fontSize: 8, color: "#6b7280", marginBottom: 3 },
  cardValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  cardValueGreen: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#059669",
  },
  cardValueBlue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
  },
  table: { border: "1pt solid #e5e7eb", borderRadius: 4, overflow: "hidden" },
  tableHead: { flexDirection: "row", backgroundColor: "#f3f4f6", padding: "5 8" },
  tableRow: {
    flexDirection: "row",
    padding: "4 8",
    borderTop: "1pt solid #f3f4f6",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: "4 8",
    borderTop: "1pt solid #f3f4f6",
    backgroundColor: "#f9fafb",
  },
  th: { fontFamily: "Helvetica-Bold", color: "#6b7280", fontSize: 8 },
  td: { color: "#374151", fontSize: 9 },
  tdGreen: { color: "#059669", fontSize: 9, fontFamily: "Helvetica-Bold" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: "#9ca3af" },
});

function fmt(n) {
  return `\u20A6${Number(n ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ReportDocument({ data, periodLabel }) {
  const o = data.orders;
  const r = data.revenue;
  const w = data.withdrawals;
  const top = data.riders.top_performers || [];
  const generatedAt = new Date().toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Document title={`RideX Report — ${periodLabel}`}>
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.header}>
          <Text style={S.brand}>RideX</Text>
          <Text style={S.subtitle}>Operations Report</Text>
          <Text style={S.period}>Period: {periodLabel}</Text>
        </View>
        <View style={S.divider} />

        {/* Top-level KPIs */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Summary</Text>
          <View style={S.grid4}>
            <View style={S.card}>
              <Text style={S.cardLabel}>Total Orders</Text>
              <Text style={S.cardValue}>{o.total}</Text>
            </View>
            <View style={S.card}>
              <Text style={S.cardLabel}>Delivered</Text>
              <Text style={S.cardValueGreen}>{o.delivered}</Text>
            </View>
            <View style={S.card}>
              <Text style={S.cardLabel}>Gross Revenue</Text>
              <Text style={S.cardValueGreen}>{fmt(r.gross)}</Text>
            </View>
            <View style={S.card}>
              <Text style={S.cardLabel}>Platform Revenue</Text>
              <Text style={S.cardValueBlue}>{fmt(r.platform)}</Text>
            </View>
          </View>
        </View>

        {/* Orders Breakdown */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Orders Breakdown</Text>
          <View style={S.grid2}>
            {/* Status */}
            <View style={[S.table, { flex: 1 }]}>
              <View style={S.tableHead}>
                <Text style={[S.th, { flex: 1 }]}>Status</Text>
                <Text style={[S.th, { width: 40, textAlign: "right" }]}>Count</Text>
              </View>
              {[
                ["Delivered", o.delivered],
                ["In Transit", o.in_transit],
                ["Picked Up", o.picked_up],
                ["Accepted", o.accepted],
                ["Pending", o.pending],
                ["Cancelled", o.cancelled],
              ].map(([label, count], i) => (
                <View key={label} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                  <Text style={[S.td, { flex: 1 }]}>{label}</Text>
                  <Text style={[S.td, { width: 40, textAlign: "right" }]}>{count}</Text>
                </View>
              ))}
            </View>
            {/* Payment type */}
            <View style={[S.table, { flex: 1 }]}>
              <View style={S.tableHead}>
                <Text style={[S.th, { flex: 1 }]}>Payment Type</Text>
                <Text style={[S.th, { width: 40, textAlign: "right" }]}>Count</Text>
              </View>
              {[
                ["Prepaid (Wallet/Card)", o.prepaid_count],
                ["Pay on Delivery (COD)", o.cod_count],
              ].map(([label, count], i) => (
                <View key={label} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                  <Text style={[S.td, { flex: 1 }]}>{label}</Text>
                  <Text style={[S.td, { width: 40, textAlign: "right" }]}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Revenue */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Revenue Breakdown</Text>
          <View style={S.grid4}>
            <View style={S.card}>
              <Text style={S.cardLabel}>Gross (Delivery Fees)</Text>
              <Text style={S.cardValueGreen}>{fmt(r.gross)}</Text>
            </View>
            <View style={S.card}>
              <Text style={S.cardLabel}>Platform ({r.platform_fee_pct}%)</Text>
              <Text style={S.cardValueBlue}>{fmt(r.platform)}</Text>
            </View>
            <View style={S.card}>
              <Text style={S.cardLabel}>Rider Share</Text>
              <Text style={S.cardValue}>{fmt(r.rider_share)}</Text>
            </View>
            <View style={S.card}>
              <Text style={S.cardLabel}>COD Value Processed</Text>
              <Text style={S.cardValue}>{fmt(r.cod_value)}</Text>
            </View>
          </View>
        </View>

        {/* Growth & Withdrawals */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Growth & Withdrawals</Text>
          <View style={S.grid4}>
            <View style={S.card}>
              <Text style={S.cardLabel}>New Users</Text>
              <Text style={S.cardValue}>{data.users.new_count}</Text>
            </View>
            <View style={S.card}>
              <Text style={S.cardLabel}>New Riders</Text>
              <Text style={S.cardValue}>{data.riders.new_count}</Text>
            </View>
            <View style={S.card}>
              <Text style={S.cardLabel}>Withdrawals Completed</Text>
              <Text style={S.cardValue}>{fmt(w.total_completed)}</Text>
            </View>
            <View style={S.card}>
              <Text style={S.cardLabel}>Withdrawals Pending</Text>
              <Text style={S.cardValue}>{fmt(w.pending_amount)}</Text>
            </View>
          </View>
        </View>

        {/* Top Riders */}
        {top.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Top Riders by Deliveries</Text>
            <View style={S.table}>
              <View style={S.tableHead}>
                <Text style={[S.th, { width: 20 }]}>#</Text>
                <Text style={[S.th, { flex: 1 }]}>Name</Text>
                <Text style={[S.th, { width: 80 }]}>Phone</Text>
                <Text style={[S.th, { width: 50, textAlign: "right" }]}>Deliveries</Text>
                <Text style={[S.th, { width: 80, textAlign: "right" }]}>Total Earned</Text>
              </View>
              {top.map((rider, i) => (
                <View key={rider.id} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                  <Text style={[S.td, { width: 20, color: "#9ca3af" }]}>{i + 1}</Text>
                  <Text style={[S.td, { flex: 1 }]}>{rider.name || "—"}</Text>
                  <Text style={[S.td, { width: 80 }]}>{rider.phone || "—"}</Text>
                  <Text style={[S.tdGreen, { width: 50, textAlign: "right" }]}>{rider.deliveries}</Text>
                  <Text style={[S.td, { width: 80, textAlign: "right" }]}>{fmt(rider.total_earned)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>Generated: {generatedAt}</Text>
          <Text style={S.footerText}>RideX Admin — Confidential</Text>
        </View>
      </Page>
    </Document>
  );
}

export default function ReportPDFButton({ data, periodLabel }) {
  if (!data) return null;

  const fileName = `ridex-report-${periodLabel.toLowerCase().replace(/\s+/g, "-")}.pdf`;

  return (
    <PDFDownloadLink
      document={<ReportDocument data={data} periodLabel={periodLabel} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <button
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {loading ? "Building PDF…" : "Export PDF"}
        </button>
      )}
    </PDFDownloadLink>
  );
}
