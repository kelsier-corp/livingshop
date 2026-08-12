export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  deliveryAddress: string | null;
  mobilePhone: string | null;
  phone: string | null;
  email: string | null;
  createdAt: Date;
}

export interface CustomerInput {
  firstName: string;
  lastName: string;
  deliveryAddress?: string | null;
  mobilePhone?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface CustomerListQuery {
  page: number;
  pageSize: number;
  search?: string;
}
