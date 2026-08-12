import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { PRODUCTION_STAGES, PRODUCTION_STAGE_LABEL } from "@domain/entities/enums";
import { OrderItemWithContext } from "@domain/entities/Production";
import { baseStyles, colors, formatDate } from "../theme";

interface Props {
  rows: OrderItemWithContext[];
}

function groupByDeliveryDate(rows: OrderItemWithContext[]) {
  const groups = new Map<string, OrderItemWithContext[]>();
  for (const row of rows) {
    const key = formatDate(row.deliveryDate);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  return Array.from(groups.entries());
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
              <Text style={[baseStyles.tableHeaderCell, { flex: 0.8 }]}>Orden</Text>
              <Text style={[baseStyles.tableHeaderCell, { flex: 3 }]}>Producto</Text>
              <Text style={[baseStyles.tableHeaderCell, { flex: 0.6, textAlign: "center" }]}>Cant.</Text>
              {PRODUCTION_STAGES.map((stage) => (
                <Text
                  key={stage}
                  style={[baseStyles.tableHeaderCell, { flex: 1, textAlign: "center" }]}
                >
                  {PRODUCTION_STAGE_LABEL[stage]}
                </Text>
              ))}
            </View>
            {groupRows.map((row) => {
              const stageByName = new Map(row.productionStages.map((stage) => [stage.stage, stage]));
              return (
                <View key={row.id} style={baseStyles.tableRow}>
                  <Text style={[baseStyles.tableCell, { flex: 0.8 }]}>{row.orderNumber}</Text>
                  <Text style={[baseStyles.tableCell, { flex: 3 }]}>{row.productTypeName}</Text>
                  <Text style={[baseStyles.tableCell, { flex: 0.6, textAlign: "center" }]}>
                    {row.quantity}
                  </Text>
                  {PRODUCTION_STAGES.map((stage) => {
                    const completed = stageByName.get(stage)?.completed ?? false;
                    return (
                      <View key={stage} style={{ flex: 1, alignItems: "center" }}>
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
