import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { AttributeValues } from "@domain/entities/Order";
import { PRODUCTION_STAGE_LABEL, ProductionStage } from "@domain/entities/enums";
import { OrderItemWithContext } from "@domain/entities/Production";
import { baseStyles, colors, formatDate } from "../theme";

interface Props {
  rows: OrderItemWithContext[];
}

// Fixed subset of ProductionStage for this printed sheet only — "foam" stays a real stage
// everywhere else (the enum, the DB, historical data), it's just not a column here. Deliberately
// not derived from PRODUCTION_STAGES so a future stage addition doesn't silently show up here.
const SHEET_STAGES: ProductionStage[] = [
  "fabric",
  "frame",
  "base_cutting",
  "cushions_cutting",
  "base_upholstery",
  "cushions_upholstery",
  "ready",
];

function groupByDeliveryDate(rows: OrderItemWithContext[]) {
  const groups = new Map<string, OrderItemWithContext[]>();
  for (const row of rows) {
    const key = formatDate(row.deliveryDate);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  return Array.from(groups.entries());
}

function serializeAttributes(attributes: AttributeValues): string {
  return Object.entries(attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

export function ProductionSheetDocument({ rows }: Props) {
  const groups = groupByDeliveryDate(rows);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={baseStyles.page}>
        <View style={baseStyles.headerRow}>
          <Text style={baseStyles.brand}>Livingshop</Text>
          <Text style={baseStyles.docTitle}>Planilla de producción</Text>
        </View>

        {groups.map(([deliveryDate, groupRows]) => (
          <View key={deliveryDate} wrap={false} style={{ marginBottom: 14 }}>
            <Text style={baseStyles.sectionTitle}>Entrega {deliveryDate}</Text>
            <View style={baseStyles.tableHeaderRow}>
              <Text style={[baseStyles.tableHeaderCell, { flex: 0.6 }]}>Orden</Text>
              <Text style={[baseStyles.tableHeaderCell, { flex: 2 }]}>Producto</Text>
              <Text style={[baseStyles.tableHeaderCell, { flex: 2.5 }]}>Detalle</Text>
              <Text style={[baseStyles.tableHeaderCell, { flex: 0.5, textAlign: "center" }]}>
                Cant.
              </Text>
              {SHEET_STAGES.map((stage) => (
                <Text
                  key={stage}
                  style={[baseStyles.tableHeaderCell, { flex: 0.9, textAlign: "center" }]}
                >
                  {PRODUCTION_STAGE_LABEL[stage]}
                </Text>
              ))}
            </View>
            {groupRows.map((row) => {
              const stageByName = new Map(
                row.productionStages.map((stage) => [stage.stage, stage])
              );
              return (
                <View key={row.id} style={baseStyles.tableRow}>
                  <Text style={[baseStyles.tableCell, { flex: 0.6 }]}>{row.orderNumber}</Text>
                  <Text style={[baseStyles.tableCell, { flex: 2 }]}>{row.productTypeName}</Text>
                  <Text style={[baseStyles.tableCell, { flex: 2.5 }]}>
                    {serializeAttributes(row.attributes)}
                  </Text>
                  <Text style={[baseStyles.tableCell, { flex: 0.5, textAlign: "center" }]}>
                    {row.quantity}
                  </Text>
                  {SHEET_STAGES.map((stage) => {
                    const completed = stageByName.get(stage)?.completed ?? false;
                    return (
                      <View key={stage} style={{ flex: 0.9, alignItems: "center" }}>
                        <View
                          style={{
                            width: 9,
                            height: 9,
                            borderWidth: 0.8,
                            borderColor: colors.accent,
                            backgroundColor: completed ? colors.accent : "transparent",
                          }}
                        />
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        ))}
      </Page>
    </Document>
  );
}
