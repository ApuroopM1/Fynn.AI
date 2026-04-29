"use client";

import { useState, useEffect } from "react";
import { Link2, AlertTriangle, Users, FileText } from "lucide-react";

const USD_TO_INR = 83.5;

function toInr(usd: number) {
  return Math.round(usd * USD_TO_INR * 100) / 100;
}

function fmtInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

interface QBData {
  invoices: any[];
  customers: any[];
  overdue: any[];
}

export function QBSummary() {
  const [data, setData] = useState<QBData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetch("/api/qb?type=all")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data);
          setConnected(true);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!connected || !data) return null;

  const totalAR = data.invoices.reduce(
    (sum: number, inv: any) => sum + (inv.Balance || 0),
    0
  );
  const overdueCount = data.overdue.length;
  const overdueAmount = data.overdue.reduce(
    (sum: number, inv: any) => sum + (inv.Balance || 0),
    0
  );
  const customerCount = data.customers.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link2 className="h-5 w-5 text-emerald-600" />
        <h2 className="text-lg font-semibold text-zinc-900">
          QuickBooks Live Data
        </h2>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
          Connected
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-zinc-500" />
            <p className="text-xs text-zinc-500">Open Invoices</p>
          </div>
          <p className="text-xl font-semibold text-zinc-900">
            {data.invoices.length}
          </p>
          <p className="text-sm text-zinc-500">
            {fmtInr(toInr(totalAR))} total AR
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <p className="text-xs text-zinc-500">Overdue</p>
          </div>
          <p className="text-xl font-semibold text-red-600">
            {overdueCount}
          </p>
          <p className="text-sm text-zinc-500">
            {fmtInr(toInr(overdueAmount))} at risk
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-zinc-500" />
            <p className="text-xs text-zinc-500">Customers</p>
          </div>
          <p className="text-xl font-semibold text-zinc-900">
            {customerCount}
          </p>
          <p className="text-sm text-zinc-500">Active in QuickBooks</p>
        </div>
      </div>

      {overdueCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">
            Overdue Invoices
          </h3>
          <div className="space-y-2">
            {data.overdue.slice(0, 5).map((inv: any, i: number) => (
              <div
                key={i}
                className="flex justify-between text-sm"
              >
                <span className="text-zinc-700">
                  {inv.CustomerRef?.name || "Unknown"} — #{inv.DocNumber}
                </span>
                <span className="font-medium text-red-600">
                  {fmtInr(toInr(inv.Balance || 0))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}