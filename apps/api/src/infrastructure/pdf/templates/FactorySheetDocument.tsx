import React from "react";
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { Customer } from "@domain/entities/Customer";
import { Order } from "@domain/entities/Order";
import { baseStyles, colors, formatDate, formatDateTime } from "../theme";

interface PdfImage {
  data: Buffer;
  format: "png" | "jpg";
}

interface Props {
  order: Order;
  customer: Customer;
  sketches: Record<string, PdfImage>;
  referencePhotos: Record<string, PdfImage[]>;
}

export function FactorySheetDocument({ order, customer, sketches, referencePhotos }: Props) {
  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <View style={baseStyles.headerRow}>
          <View>
            <Text style={baseStyles.brand}>Orden N.º {order.number}</Text>
            <Text style={baseStyles.brandSubtitle}>Ficha técnica de fábrica</Text>
          </View>
          <View>
            <Text style={baseStyles.docTitle}>
              {customer.firstName} {customer.lastName}
            </Text>
            <Text style={baseStyles.emphasisMeta}>
              Fecha de impresión: {formatDateTime(order.printedAt)}
            </Text>
          </View>
        </View>

        {/* Some products (services, delivery/installation, ...) have nothing for the factory to
            build — ProductType.includeInFactorySheet lets them be excluded from this document
            entirely while still appearing normally on the order sheet and in sales. */}
        {order.items.filter((item) => item.productTypeIncludeInFactorySheet).length === 0 ? (
          <Text style={baseStyles.value}>Esta orden no tiene productos para fábrica.</Text>
        ) : null}

        {order.items
          .filter((item) => item.productTypeIncludeInFactorySheet)
          .map((item, index) => {
            const sketch = sketches[item.productTypeId];
            const photos = referencePhotos[item.id] ?? [];

            return (
              <View key={item.id} style={{ marginBottom: 16 }} wrap={false}>
                <View
                  style={[
                    baseStyles.row,
                    { justifyContent: "space-between", alignItems: "flex-end" },
                  ]}
                >
                  <Text style={[baseStyles.sectionTitle, { marginTop: index === 0 ? 0 : 14 }]}>
                    {index + 1}. {item.productTypeName} — Cant. {item.quantity}
                  </Text>
                  <Text style={baseStyles.emphasisMeta}>
                    Fecha de entrega: {formatDate(item.deliveryDate)}
                  </Text>
                </View>
                <View>
                  {Object.entries(item.attributes).map(([key, value]) => (
                    <View key={key} style={[baseStyles.row, { marginBottom: 2 }]}>
                      <Text style={[baseStyles.label, { width: 160 }]}>{key}</Text>
                      <Text style={baseStyles.value}>{String(value)}</Text>
                    </View>
                  ))}
                  {item.factoryNotes ? (
                    <View style={{ marginTop: 6 }}>
                      <Text style={[baseStyles.label, { marginBottom: 2 }]}>Comentarios</Text>
                      <Text style={baseStyles.value}>{item.factoryNotes}</Text>
                    </View>
                  ) : null}
                </View>
                {sketch ? (
                  <View style={{ marginTop: 8 }}>
                    <Text style={[baseStyles.label, { marginBottom: 4 }]}>Croquis</Text>
                    <View
                      style={{
                        width: "100%",
                        maxHeight: 260,
                        alignItems: "center",
                        borderWidth: 0.5,
                        borderColor: colors.border,
                        padding: 4,
                      }}
                    >
                      <Image
                        src={sketch}
                        style={{ maxWidth: "100%", maxHeight: 252, objectFit: "contain" }}
                      />
                    </View>
                  </View>
                ) : null}
                {photos.length > 0 && (
                  <View style={{ marginTop: 6 }}>
                    <Text style={[baseStyles.label, { marginBottom: 4 }]}>Fotos de referencia</Text>
                    <View style={[baseStyles.row, { gap: 6, flexWrap: "wrap" }]}>
                      {photos.map((photo, photoIndex) => (
                        <View
                          key={photoIndex}
                          style={{
                            width: 90,
                            borderWidth: 0.5,
                            borderColor: colors.border,
                            padding: 3,
                          }}
                        >
                          <Image src={photo} style={{ width: "100%" }} />
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })}

        <Text style={baseStyles.footer}>
          Livingshop — Ficha técnica — impresa el {formatDateTime(order.printedAt)}
        </Text>
      </Page>
    </Document>
  );
}
