import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { QuickBooksClient } from "@/lib/quickbooks";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Fetch all transactions for this user
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("amount, type, currency, description, date")
      .eq("user_id", userId);

    if (txError) {
      console.error("[kpis] transactions query error:", txError);
      return NextResponse.json(
        { error: "Failed to fetch transactions", detail: txError.message },
        { status: 500 }
      );
    }

    // Fetch invoices (for Total Recovered only)
    const { data: invoices, error: invError } = await supabase
      .from("invoices")
      .select("amount, paid_amount, status")
      .eq("user_id", userId);

    if (invError) {
      console.error("[kpis] invoices query error:", invError);
    }

    const txList = transactions ?? [];
    const invList = invoices ?? [];

    // ── Cash Position: total credits minus total debits ──────────────
    const totalCredits = txList
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalDebits = txList
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    let cashPosition = totalCredits - totalDebits;

    // ── Total Leakage: detected from transactions ────────────────────
    const debitTx = txList.filter((t) => t.type === "debit");
    const descGroups: Record<string, number[]> = {};
    for (const t of debitTx) {
      const key = (t.description ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .slice(0, 40)
        .trim();
      if (!key) continue;
      if (!descGroups[key]) descGroups[key] = [];
      descGroups[key].push(Number(t.amount));
    }

    let totalLeakage = 0;
    for (const [, amounts] of Object.entries(descGroups)) {
      if (amounts.length >= 2) {
        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        if (avg <= 50000) {
          totalLeakage += amounts.reduce((a, b) => a + b, 0);
        }
      }
    }

    // ── Total Recovered: from invoices paid ─────────────────────────
    let totalRecovered = invList.reduce(
      (sum, inv) => sum + Number(inv.paid_amount ?? 0),
      0
    );

    // ── Tax Reserve: 25% of net income ──────────────────────────────
    const netIncome = totalCredits - totalDebits;
    let taxReserve = netIncome > 0 ? netIncome * 0.25 : 0;

    // ── Primary currency from transactions ──────────────────────────
    const currency = txList[0]?.currency ?? "INR";

    // ── Merge QuickBooks data if connected ───────────────────────────
    const qbToken = request.cookies.get("qb_access_token")?.value;
    let qbConnected = false;

    if (qbToken) {
      try {
        const qb = new QuickBooksClient(qbToken);
        const [qbInvoices, qbPayments] = await Promise.all([
          qb.getInvoices(),
          qb.getPayments(),
        ]);

        qbConnected = true;

        // Add QB invoice balances to cash position (money owed to you)
        const qbTotalAR = qbInvoices.reduce(
          (sum: number, inv: any) => sum + (inv.Balance || 0),
          0
        );
        cashPosition += qbTotalAR;

        // Add QB payments to recovered
        const qbTotalPaid = qbPayments.reduce(
          (sum: number, p: any) => sum + (p.TotalAmt || 0),
          0
        );
        totalRecovered += qbTotalPaid;

        // Recalculate tax reserve with QB data included
        const qbRevenue = qbInvoices.reduce(
          (sum: number, inv: any) => sum + (inv.TotalAmt || 0),
          0
        );
        taxReserve = (netIncome + qbRevenue) > 0
          ? (netIncome + qbRevenue) * 0.25
          : taxReserve;

        // Add overdue QB invoices to leakage
        const today = new Date().toISOString().split("T")[0];
        const qbOverdue = qbInvoices.filter(
          (inv: any) => inv.DueDate < today && inv.Balance > 0
        );
        const qbOverdueAmount = qbOverdue.reduce(
          (sum: number, inv: any) => sum + (inv.Balance || 0),
          0
        );
        totalLeakage += qbOverdueAmount;

      } catch (qbError) {
        console.error("[kpis] QB data fetch failed:", qbError);
        // Continue with Supabase data only
      }
    }

    return NextResponse.json({
      cashPosition,
      totalLeakage,
      totalRecovered,
      taxReserve,
      currency,
      transactionCount: txList.length,
      qbConnected,
    });
  } catch (err) {
    console.error("[kpis] Unhandled error:", err);
    return NextResponse.json(
      {
        error: "Failed to compute KPIs",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}