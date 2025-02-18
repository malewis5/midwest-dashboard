export interface Customer {
  customer_id: string;
  customer_name: string;
  account_number: string;
  territory: string;
  account_classification: string | null;
  introduced_myself: boolean;
  introduced_myself_at: string | null;
  introduced_myself_by: string | null;
  visited_account: boolean;
  visited_account_at: string | null;
  visited_account_by: string | null;
  addresses: Array<{
    address_id: string;
    street: string;
    city: string;
    state: string;
    zip_code: string;
    geocoded_locations: Array<{
      latitude: number;
      longitude: number;
    }> | null;
  }>;
  sales: Array<{
    sales_amount: number;
    category: string;
    sale_date: string;
    year?: number;
    comparison_type?: string;
    period?: number;
  }>;
  contacts: Array<{
    contact_id: string;
    contact_name: string;
    role: string;
    phone_number: string;
    email: string;
  }>;
}