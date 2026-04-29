export class QuickBooksClient {
  private accessToken: string;
  private realmId: string;
  private baseUrl: string;

  constructor(accessToken: string, realmId?: string) {
    this.accessToken = accessToken;
    this.realmId = realmId || process.env.QB_REALM_ID || '';
    this.baseUrl = process.env.QB_SANDBOX_BASE_URL || 'https://sandbox-quickbooks.api.intuit.com';
  }

  private async query(entity: string, queryString?: string) {
    const sql = queryString || `select * from ${entity}`;
    const url = `${this.baseUrl}/v3/company/${this.realmId}/query?query=${encodeURIComponent(sql)}&minorversion=75`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/text',
      },
    });

    if (!response.ok) {
      throw new Error(`QB API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getInvoices() {
    const data = await this.query('Invoice');
    return data.QueryResponse?.Invoice || [];
  }

  async getCustomers() {
    const data = await this.query('Customer');
    return data.QueryResponse?.Customer || [];
  }

  async getPayments() {
    const data = await this.query('Payment');
    return data.QueryResponse?.Payment || [];
  }

  async getOverdueInvoices() {
    const today = new Date().toISOString().split('T')[0];
    const data = await this.query(
      'Invoice',
      `select * from Invoice where DueDate < '${today}' and Balance > '0'`
    );
    return data.QueryResponse?.Invoice || [];
  }

  async getARAgingSummary() {
    const url = `${this.baseUrl}/v3/company/${this.realmId}/reports/AgedReceivables?minorversion=75`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
      },
    });
    return response.json();
  }
}