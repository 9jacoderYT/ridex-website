// Path: src/components/company/CompanyReportPDF.js
// NOTE: This file must NEVER be imported statically in any Next.js server component or
// any file with "use server". Always import dynamically inside a browser event handler.

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function formatPeriodLabel({ startMonth, startYear, endMonth, endYear }) {
  if (startMonth === endMonth && startYear === endYear) {
    return `${MONTHS[startMonth - 1]} ${startYear}`;
  }
  return `${MONTHS[startMonth - 1]} ${startYear} - ${MONTHS[endMonth - 1]} ${endYear}`;
}

// Use "N" instead of "NGN" symbol - Helvetica embedded font may not render the Naira glyph
function fmtPdf(n) {
  return `NGN ${Number(n ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#111827",
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
  },
  // Header
  header: {
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: "#D1FAE5",
    borderBottomStyle: "solid",
  },
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brandName: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#059669" },
  brandTag: { fontSize: 8, color: "#6B7280", marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  periodLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111827" },
  generatedLabel: { fontSize: 7.5, color: "#9CA3AF", marginTop: 3 },
  // Section titles
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#059669",
    marginTop: 18,
    marginBottom: 8,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#A7F3D0",
    borderBottomStyle: "solid",
  },
  // KPI grid
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  kpiCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "solid",
    borderRadius: 5,
    padding: 9,
    width: "31%",
    backgroundColor: "#F9FAFB",
  },
  kpiLabel: { fontSize: 7, color: "#6B7280", textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.3 },
  kpiValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#111827" },
  kpiSub: { fontSize: 7, color: "#6B7280", marginTop: 2 },
  // Tables
  table: { marginTop: 4 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#ECFDF5",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
  tableHeaderText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#065F46" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F3F4F6",
    borderBottomStyle: "solid",
  },
  tableRowAlt: { backgroundColor: "#F9FAFB" },
  tableCell: { fontSize: 8, color: "#374151" },
  // Withdrawal card
  withdrawCard: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  withdrawItem: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "solid",
    borderRadius: 5,
    padding: 8,
    backgroundColor: "#F9FAFB",
  },
  withdrawLabel: { fontSize: 7, color: "#6B7280", textTransform: "uppercase", marginBottom: 3 },
  withdrawValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#111827" },
  // Empty
  emptyNote: { fontSize: 8, color: "#9CA3AF", fontFamily: "Helvetica-Oblique", marginTop: 4, marginLeft: 2 },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
    borderTopStyle: "solid",
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: "#9CA3AF" },
  // Full report table columns
  colTrack: { width: "18%" },
  colStatus: { width: "14%" },
  colPayment: { width: "12%" },
  colRider: { width: "20%" },
  colPickup: { width: "24%" },
  colDate: { width: "12%" },
});

function KPICard({ label, value, sub }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{String(value)}</Text>
      {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </View>
  );
}

function PageFooter({ companyName }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        {companyName} • RideX Delivery Report • Confidential
      </Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

function statusLabel(status) {
  const map = {
    delivered: "Delivered",
    cancelled: "Cancelled",
    accepted: "Accepted",
    picked_up: "Picked Up",
    in_transit: "In Transit",
    failed: "Failed",
    pending: "Pending",
  };
  return map[status] ?? status ?? "-";
}

function paymentLabel(type) {
  if (type === "pay_on_delivery" || type === "cod") return "COD";
  return "Prepaid";
}

export function CompanyReportDocument({ report, companyName, mode }) {
  const periodLabel = formatPeriodLabel(report.period);
  const generatedOn = new Date().toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document
      title={`${companyName} - Delivery Report - ${periodLabel}`}
      author="RideX Platform"
      subject="Delivery Report"
    >
      {/* ── Page 1: Summary ───────────────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View>
              <Text style={styles.brandName}>RideX</Text>
              <Text style={styles.brandTag}>Delivery Management Platform</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.periodLabel}>{periodLabel}</Text>
              <Text style={styles.generatedLabel}>Generated {generatedOn}</Text>
              <Text style={[styles.generatedLabel, { marginTop: 2 }]}>
                {companyName} • {mode === "full" ? "Full Report" : "Summary Report"}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.kpiGrid}>
          <KPICard label="Total Orders" value={report.orders.total} />
          <KPICard label="Completed" value={report.orders.completed} sub="delivered" />
          <KPICard label="Cancelled" value={report.orders.cancelled} />
          <KPICard
            label="Completion Rate"
            value={`${report.orders.completionRate}%`}
            sub={report.orders.total === 0 ? "no orders" : undefined}
          />
          <KPICard
            label="Avg Customer Rating"
            value={report.ratings.average ?? "N/A"}
            sub={report.ratings.total > 0 ? `from ${report.ratings.total} ratings` : "no ratings yet"}
          />
          <KPICard label="Ratings Received" value={report.ratings.total} />
        </View>

        {/* Payment Breakdown */}
        <Text style={styles.sectionTitle}>Payment Breakdown</Text>
        <View style={styles.kpiGrid}>
          <KPICard
            label="COD Orders"
            value={report.payments.codCount}
            sub="pay on delivery"
          />
          <KPICard
            label="COD Amount Collected"
            value={fmtPdf(report.payments.codCollected)}
          />
          <KPICard
            label="COD Company Share"
            value={fmtPdf(report.payments.codCompanyShare)}
            sub="company earnings"
          />
          <KPICard
            label="Prepaid Orders"
            value={report.payments.prepaidCount}
          />
          <KPICard
            label="Prepaid Completed"
            value={report.payments.prepaidDelivered}
            sub="delivered orders"
          />
        </View>

        {/* Top Riders */}
        <Text style={styles.sectionTitle}>Top 5 Riders by Deliveries</Text>
        {report.topRiders.length === 0 ? (
          <Text style={styles.emptyNote}>No completed deliveries in this period.</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: "8%" }]}>#</Text>
              <Text style={[styles.tableHeaderText, { width: "72%" }]}>Rider Name</Text>
              <Text style={[styles.tableHeaderText, { width: "20%" }]}>Deliveries</Text>
            </View>
            {report.topRiders.map((r, i) => (
              <View
                key={i}
                style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <Text style={[styles.tableCell, { width: "8%" }]}>{i + 1}</Text>
                <Text style={[styles.tableCell, { width: "72%" }]}>{r.name}</Text>
                <Text style={[styles.tableCell, { width: "20%", fontFamily: "Helvetica-Bold" }]}>
                  {r.count}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Withdrawal Summary */}
        <Text style={styles.sectionTitle}>Withdrawal Summary</Text>
        <View style={styles.withdrawCard}>
          <View style={styles.withdrawItem}>
            <Text style={styles.withdrawLabel}>Total Requested</Text>
            <Text style={styles.withdrawValue}>{fmtPdf(report.withdrawals.requested)}</Text>
          </View>
          <View style={styles.withdrawItem}>
            <Text style={styles.withdrawLabel}>Completed Payouts</Text>
            <Text style={styles.withdrawValue}>{fmtPdf(report.withdrawals.completed)}</Text>
          </View>
          <View style={styles.withdrawItem}>
            <Text style={styles.withdrawLabel}>No. of Requests</Text>
            <Text style={styles.withdrawValue}>{report.withdrawals.count}</Text>
          </View>
        </View>

        <PageFooter companyName={companyName} />
      </Page>

      {/* ── Page 2+: Full Delivery Table (full mode only) ─────────────────── */}
      {mode === "full" && report.allOrders.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={[styles.sectionTitle, { marginTop: 0 }]}>
            All Deliveries ({report.allOrders.length} orders)
          </Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colTrack]}>Tracking #</Text>
              <Text style={[styles.tableHeaderText, styles.colStatus]}>Status</Text>
              <Text style={[styles.tableHeaderText, styles.colPayment]}>Payment</Text>
              <Text style={[styles.tableHeaderText, styles.colRider]}>Rider</Text>
              <Text style={[styles.tableHeaderText, styles.colPickup]}>Pickup Address</Text>
              <Text style={[styles.tableHeaderText, styles.colDate]}>Date</Text>
            </View>
            {report.allOrders.map((o, i) => (
              <View
                key={i}
                style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
                wrap={false}
              >
                <Text style={[styles.tableCell, styles.colTrack]}>
                  {o.tracking_number ?? "-"}
                </Text>
                <Text style={[styles.tableCell, styles.colStatus]}>
                  {statusLabel(o.status)}
                </Text>
                <Text style={[styles.tableCell, styles.colPayment]}>
                  {paymentLabel(o.payment_type)}
                </Text>
                <Text style={[styles.tableCell, styles.colRider]}>
                  {(o.rider_name ?? "-").slice(0, 22)}
                </Text>
                <Text style={[styles.tableCell, styles.colPickup]}>
                  {(o.pickup_address ?? "-").slice(0, 35)}
                </Text>
                <Text style={[styles.tableCell, styles.colDate]}>
                  {fmtDate(o.created_at)}
                </Text>
              </View>
            ))}
          </View>
          <PageFooter companyName={companyName} />
        </Page>
      )}

      {/* Empty full mode */}
      {mode === "full" && report.allOrders.length === 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={[styles.sectionTitle, { marginTop: 0 }]}>All Deliveries</Text>
          <Text style={styles.emptyNote}>No orders found for this period.</Text>
          <PageFooter companyName={companyName} />
        </Page>
      )}
    </Document>
  );
}
