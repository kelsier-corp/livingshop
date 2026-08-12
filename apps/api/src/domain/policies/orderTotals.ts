import { Order } from "../entities/Order";

export interface OrderTotals {
  totalAmount: number;
  amountPaid: number;
  balance: number;
}

export function computeOrderTotals(order: Order): OrderTotals {
  const totalAmount = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const amountPaid = order.payments.reduce((sum, payment) => sum + payment.amount, 0);
  return { totalAmount, amountPaid, balance: totalAmount - amountPaid };
}
