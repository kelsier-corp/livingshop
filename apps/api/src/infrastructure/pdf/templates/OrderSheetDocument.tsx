import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { Customer } from "@domain/entities/Customer";
import { Order } from "@domain/entities/Order";
import { computeOrderTotals } from "@domain/policies/orderTotals";
import { baseStyles, colors, formatCurrency, formatDate } from "../theme";

interface Props {
  order: Order;
  customer: Customer;
}

export function OrderSheetDocument({ order, customer }: Props) {
  const totals = computeOrderTotals(order);

  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <View style={baseStyles.headerRow}>
          <View>
            <Text style={baseStyles.brand}>Livingshop</Text>
            <Text style={baseStyles.brandSubtitle}>Fábrica de muebles a medida</Text>
          </View>
          <View>
            <Text style={baseStyles.docTitle}>Orden N.º {order.number}</Text>
            <Text style={baseStyles.docMeta}>Fecha: {formatDate(order.date)}</Text>
          </View>
        </View>

        <Text style={baseStyles.sectionTitle}>Cliente</Text>
        <View style={baseStyles.panel}>
          <Text style={baseStyles.value}>
            {customer.firstName} {customer.lastName}
          </Text>
          {customer.deliveryAddress ? (
            <Text style={[baseStyles.label, { marginTop: 3 }]}>{customer.deliveryAddress}</Text>
          ) : null}
          <View style={[baseStyles.row, { marginTop: 3, gap: 12 }]}>
            {customer.mobilePhone ? (
              <Text style={baseStyles.label}>Celular: {customer.mobilePhone}</Text>
            ) : null}
            {customer.phone ? (
              <Text style={baseStyles.label}>Teléfono: {customer.phone}</Text>
            ) : null}
            {customer.email ? <Text style={baseStyles.label}>{customer.email}</Text> : null}
          </View>
        </View>

        <Text style={baseStyles.sectionTitle}>Productos</Text>
        <View style={baseStyles.tableHeaderRow}>
          <Text style={[baseStyles.tableHeaderCell, { flex: 3 }]}>Producto</Text>
          <Text style={[baseStyles.tableHeaderCell, { flex: 3.5 }]}>Especificaciones</Text>
          <Text style={[baseStyles.tableHeaderCell, { flex: 1.3 }]}>Entrega</Text>
          <Text style={[baseStyles.tableHeaderCell, { flex: 0.8, textAlign: "center" }]}>
            Cant.
          </Text>
          <Text style={[baseStyles.tableHeaderCell, { flex: 1.4, textAlign: "right" }]}>
            Precio
          </Text>
          <Text style={[baseStyles.tableHeaderCell, { flex: 1.4, textAlign: "right" }]}>Total</Text>
        </View>
        {order.items.map((item) => (
          <View key={item.id} style={baseStyles.tableRow}>
            <Text style={[baseStyles.tableCell, { flex: 3 }]}>{item.productTypeName}</Text>
            <View style={{ flex: 3.5 }}>
              {Object.entries(item.attributes).map(([key, value]) => (
                <Text
                  key={key}
                  style={[baseStyles.tableCell, { fontSize: 7.5, color: colors.muted }]}
                >
                  {key}: {String(value)}
                </Text>
              ))}
            </View>
            <Text style={[baseStyles.tableCell, { flex: 1.3 }]}>
              {formatDate(item.deliveryDate)}
            </Text>
            <Text style={[baseStyles.tableCell, { flex: 0.8, textAlign: "center" }]}>
              {item.quantity}
            </Text>
            <Text style={[baseStyles.tableCell, { flex: 1.4, textAlign: "right" }]}>
              {formatCurrency(item.unitPrice)}
            </Text>
            <Text style={[baseStyles.tableCell, { flex: 1.4, textAlign: "right" }]}>
              {formatCurrency(item.totalPrice)}
            </Text>
          </View>
        ))}

        <View style={{ marginTop: 14, alignItems: "flex-end" }}>
          <View style={{ width: 220 }}>
            <View style={[baseStyles.row, { justifyContent: "space-between", marginBottom: 3 }]}>
              <Text style={baseStyles.label}>Total</Text>
              <Text style={baseStyles.value}>{formatCurrency(totals.totalAmount)}</Text>
            </View>
            <View style={[baseStyles.row, { justifyContent: "space-between", marginBottom: 3 }]}>
              <Text style={baseStyles.label}>Pagado</Text>
              <Text style={baseStyles.value}>{formatCurrency(totals.amountPaid)}</Text>
            </View>
            <View style={[baseStyles.row, { justifyContent: "space-between" }]}>
              <Text style={[baseStyles.label, { fontFamily: "Helvetica-Bold" }]}>Saldo</Text>
              <Text style={[baseStyles.value, { fontFamily: "Helvetica-Bold" }]}>
                {formatCurrency(totals.balance)}
              </Text>
            </View>
          </View>
        </View>

        {order.notes ? (
          <>
            <Text style={baseStyles.sectionTitle}>Observaciones</Text>
            <Text style={baseStyles.tableCell}>{order.notes}</Text>
          </>
        ) : null}

        <Text style={baseStyles.footer}>
          Livingshop — San Martín 1690, Godoy Cruz, Mendoza — livingshop1@gmail.com
        </Text>
      </Page>
    </Document>
  );
}
