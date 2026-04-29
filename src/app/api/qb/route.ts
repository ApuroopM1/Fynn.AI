import { NextRequest, NextResponse } from 'next/server';
import { QuickBooksClient } from '@/lib/quickbooks';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'invoices';
  const accessToken = request.headers.get('x-qb-token');

  if (!accessToken) {
    return NextResponse.json(
      { error: 'No access token provided. Connect QuickBooks first.' },
      { status: 401 }
    );
  }

  const qb = new QuickBooksClient(accessToken);

  try {
    let data;

    switch (type) {
      case 'invoices':
        data = await qb.getInvoices();
        break;
      case 'customers':
        data = await qb.getCustomers();
        break;
      case 'payments':
        data = await qb.getPayments();
        break;
      case 'overdue':
        data = await qb.getOverdueInvoices();
        break;
      case 'aging':
        data = await qb.getARAgingSummary();
        break;
      case 'all':
        const [invoices, customers, payments, overdue] = await Promise.all([
          qb.getInvoices(),
          qb.getCustomers(),
          qb.getPayments(),
          qb.getOverdueInvoices(),
        ]);
        data = { invoices, customers, payments, overdue };
        break;
      default:
        data = await qb.getInvoices();
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch QB data' },
      { status: 500 }
    );
  }
}