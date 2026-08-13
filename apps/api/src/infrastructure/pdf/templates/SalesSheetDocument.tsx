import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { ORDER_STATUS_LABEL } from "@domain/entities/enums";
import { SalesRow } from "@domain/entities/Sales";
import { baseStyles, formatCurrency, formatDate } from "../theme";

interface Props {
  rows: SalesRow[];
  periodLabel: string;
}

export function SalesSheetDocument({ rows, periodLabel }: Props) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={baseStyles.page}>
        <View style={baseStyles.headerRow}>
          <Text style={baseStyles.brand}>Livingshop</Text>
          <View>
            <Text style={baseStyles.docTitle}>Planilla de ventas</Text>
            <Text style={baseStyles.docMeta}>{periodLabel}</Text>
          </View>
        </View>

        <View style={baseStyles.tableHeaderRow}>
          <Text style={[baseStyles.tableHeaderCell, { flex: 0.7 }]}>Orden</Text>
          <Text style={[baseStyles.tableHeaderCell, { flex: 1.2 }]}>Fecha</Text>
          <Text style={[baseStyles.tableHeaderCell, { flex: 2 }]}>Cliente</Text>
          <Text style={[baseStyles.tableHeaderCell, { flex: 3.2 }]}>Productos</Text>
          <Text style={[baseStyles.tableHeaderCell, { flex: 1.2, textAlign: "right" }]}>Total</Text>
          <Text style={[baseStyles.tableHeaderCell, { flex: 1.2, textAlign: "right" }]}>
            Pagado
          </Text>
          <Text style={[baseStyles.tableHeaderCell, { flex: 1.2, textAlign: "right" }]}>Saldo</Text>
          <Text style={[baseStyles.tableHeaderCell, { flex: 1.2 }]}>Estado</Text>
        </View>

        {rows.map((row) => (
          <View key={row.orderId} style={baseStyles.tableRow}>
            <Text style={[baseStyles.tableCell, { flex: 0.7 }]}>{row.orderNumber}</Text>
            <Text style={[baseStyles.tableCell, { flex: 1.2 }]}>{formatDate(row.orderDate)}</Text>
            <Text style={[baseStyles.tableCell, { flex: 2 }]}>{row.customerFullName}</Text>
            <View style={{ flex: 3.2 }}>
              {row.items.map((item, index) => (
                <Text key={index} style={baseStyles.tableCell}>
                  {item.quantity}x {item.productTypeName} — entrega {formatDate(item.deliveryDate)}
                </Text>
              ))}
            </View>
            <Text style={[baseStyles.tableCell, { flex: 1.2, textAlign: "right" }]}>
              {formatCurrency(row.totalAmount)}
            </Text>
            <Text style={[baseStyles.tableCell, { flex: 1.2, textAlign: "right" }]}>
              {formatCurrency(row.amountPaid)}
            </Text>
            <Text style={[baseStyles.tableCell, { flex: 1.2, textAlign: "right" }]}>
              {formatCurrency(row.balance)}
            </Text>
            <Text style={[baseStyles.tableCell, { flex: 1.2 }]}>
              {ORDER_STATUS_LABEL[row.status]}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
