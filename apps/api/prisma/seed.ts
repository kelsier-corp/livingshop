import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function daysFromNow(days: number): Date {
  return daysAgo(-days);
}

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@livingshop.test" },
    update: {},
    create: { name: "Marta Fernandez", email: "admin@livingshop.test", role: "admin" },
  });

  const salesperson = await prisma.user.upsert({
    where: { email: "sales@livingshop.test" },
    update: {},
    create: { name: "Paula Osorio", email: "sales@livingshop.test", role: "sales" },
  });

  const factoryUser = await prisma.user.upsert({
    where: { email: "factory@livingshop.test" },
    update: {},
    create: { name: "David Gomez", email: "factory@livingshop.test", role: "factory" },
  });

  for (const name of ["Efectivo", "Débito", "Crédito", "Transferencia"]) {
    await prisma.paymentMethod.upsert({ where: { name }, update: {}, create: { name } });
  }

  const fabricCatalog = await prisma.attributeCatalog.upsert({
    where: { name: "Tela" },
    update: {},
    create: {
      name: "Tela",
      values: {
        create: [
          { value: "Liso Molinari 04 Camel" },
          { value: "Liso Molinari 01 Natural" },
          { value: "Thor 4 Gamuza" },
          { value: "Neo 03 Sand" },
        ],
      },
    },
  });

  const legsColorCatalog = await prisma.attributeCatalog.upsert({
    where: { name: "Color de pata" },
    update: {},
    create: {
      name: "Color de pata",
      values: { create: [{ value: "Marrón medio" }, { value: "Marrón oscuro" }, { value: "Natural" }] },
    },
  });

  const armTypeCatalog = await prisma.attributeCatalog.upsert({
    where: { name: "Tipo de brazo" },
    update: {},
    create: {
      name: "Tipo de brazo",
      values: { create: [{ value: "Recto" }, { value: "Chester" }, { value: "Redondo" }] },
    },
  });

  const sofasCategory = await prisma.productCategory.upsert({
    where: { name: "Sofás" },
    update: {},
    create: { name: "Sofás" },
  });
  const sillonesCategory = await prisma.productCategory.upsert({
    where: { name: "Sillones" },
    update: {},
    create: { name: "Sillones" },
  });
  const serviciosCategory = await prisma.productCategory.upsert({
    where: { name: "Servicios" },
    update: {},
    create: { name: "Servicios" },
  });
  const decoCategory = await prisma.productCategory.upsert({
    where: { name: "Decoración" },
    update: {},
    create: { name: "Decoración" },
  });

  const sofaType = await prisma.productType.upsert({
    where: { name: "Sofá / Rinconero" },
    update: {},
    create: {
      name: "Sofá / Rinconero",
      description: "Sofás, rinconeros y chaise longue a medida",
      basePrice: 2884200,
      categories: { connect: [{ id: sofasCategory.id }] },
      attributeDefinitions: {
        create: [
          { name: "Medida", dataType: "text", sortOrder: 0, required: true },
          { name: "Tipo de brazo", dataType: "catalog", attributeCatalogId: armTypeCatalog.id, sortOrder: 1 },
          { name: "Patas", dataType: "catalog", attributeCatalogId: legsColorCatalog.id, sortOrder: 2 },
          { name: "Tela", dataType: "catalog", attributeCatalogId: fabricCatalog.id, sortOrder: 3, required: true },
          { name: "Densidad almohadón asiento", dataType: "text", sortOrder: 4 },
          { name: "Orientación", dataType: "text", sortOrder: 5 },
        ],
      },
    },
  });

  const chesterType = await prisma.productType.upsert({
    where: { name: "Chester Industrial" },
    update: {},
    create: {
      name: "Chester Industrial",
      description: "Sillón/sofá estilo chester industrial",
      basePrice: 2700000,
      categories: { connect: [{ id: sillonesCategory.id }, { id: sofasCategory.id }] },
      attributeDefinitions: {
        create: [
          { name: "Medida", dataType: "text", sortOrder: 0, required: true },
          { name: "Patas", dataType: "catalog", attributeCatalogId: legsColorCatalog.id, sortOrder: 1 },
          { name: "Tela", dataType: "catalog", attributeCatalogId: fabricCatalog.id, sortOrder: 2, required: true },
          { name: "Color de tachas", dataType: "color", sortOrder: 3 },
        ],
      },
    },
  });

  const berlinType = await prisma.productType.upsert({
    where: { name: "Sillón Berlín" },
    update: {},
    create: {
      name: "Sillón Berlín",
      description: "Sillón de un cuerpo, línea clásica",
      basePrice: 980000,
      categories: { connect: [{ id: sillonesCategory.id }] },
      attributeDefinitions: {
        create: [
          { name: "Patas", dataType: "catalog", attributeCatalogId: legsColorCatalog.id, sortOrder: 0 },
          { name: "Tela", dataType: "catalog", attributeCatalogId: fabricCatalog.id, sortOrder: 1, required: true },
        ],
      },
    },
  });

  const retapizadoType = await prisma.productType.upsert({
    where: { name: "Retapizado" },
    update: {},
    create: {
      name: "Retapizado",
      description: "Retapizado de un mueble existente del cliente",
      basePrice: 1200000,
      categories: { connect: [{ id: serviciosCategory.id }] },
      attributeDefinitions: {
        create: [
          { name: "Tela", dataType: "catalog", attributeCatalogId: fabricCatalog.id, sortOrder: 0, required: true },
          { name: "Patas", dataType: "catalog", attributeCatalogId: legsColorCatalog.id, sortOrder: 1 },
        ],
      },
    },
  });

  const almohadonType = await prisma.productType.upsert({
    where: { name: "Almohadón decorativo" },
    update: {},
    create: {
      name: "Almohadón decorativo",
      description: "Almohadones decorativos vendidos junto a una orden",
      basePrice: 45000,
      categories: { connect: [{ id: decoCategory.id }] },
      attributeDefinitions: {
        create: [
          { name: "Medida", dataType: "text", sortOrder: 0, required: true },
          { name: "Tela", dataType: "catalog", attributeCatalogId: fabricCatalog.id, sortOrder: 1, required: true },
        ],
      },
    },
  });

  const puffType = await prisma.productType.upsert({
    where: { name: "Puff redondo" },
    update: {},
    create: {
      name: "Puff redondo",
      description: "Puff redondo tapizado",
      basePrice: 320000,
      categories: { connect: [{ id: decoCategory.id }] },
      attributeDefinitions: {
        create: [{ name: "Tela", dataType: "catalog", attributeCatalogId: fabricCatalog.id, sortOrder: 0, required: true }],
      },
    },
  });

  const customerSeeds = [
    {
      firstName: "Paula",
      lastName: "Osorio",
      deliveryAddress: "Viogner 411, Carrodilla, Lujan",
      mobilePhone: "2612507774",
      phone: "2616412576",
      email: "pau.osorio25@hotmail.com",
    },
    {
      firstName: "Lucía",
      lastName: "Fernández",
      deliveryAddress: "San Martín 1450, Godoy Cruz",
      mobilePhone: "2615551234",
      phone: null,
      email: "lucia.fernandez@gmail.com",
    },
    {
      firstName: "Martín",
      lastName: "Gómez",
      deliveryAddress: "Belgrano 220, Guaymallén",
      mobilePhone: "2615559876",
      phone: null,
      email: "martin.gomez@gmail.com",
    },
    {
      firstName: "Sofía",
      lastName: "Ramírez",
      deliveryAddress: "Las Heras 890, Ciudad",
      mobilePhone: "2615552468",
      phone: null,
      email: "sofia.ramirez@hotmail.com",
    },
    {
      firstName: "Nicolás",
      lastName: "Torres",
      deliveryAddress: "Alem 55, Maipú",
      mobilePhone: "2615553579",
      phone: null,
      email: "nicolas.torres@gmail.com",
    },
    {
      firstName: "Valentina",
      lastName: "Suárez",
      deliveryAddress: "Boulogne Sur Mer 340, Ciudad",
      mobilePhone: "2615554680",
      phone: null,
      email: "valentina.suarez@gmail.com",
    },
  ];

  const customers: Record<string, { id: string }> = {};
  for (const seed of customerSeeds) {
    const existing = await prisma.customer.findFirst({
      where: { firstName: seed.firstName, lastName: seed.lastName },
    });
    customers[seed.firstName] = existing ?? (await prisma.customer.create({ data: seed }));
  }

  const existingOrder = await prisma.order.findFirst({ where: { customerId: customers.Paula.id } });

  if (!existingOrder) {
    const order = await prisma.order.create({
      data: {
        customerId: customers.Paula.id,
        salespersonId: salesperson.id,
        status: "confirmed",
        notes: "Precio de contado // Promo BBVA 3 y 6 cuotas (avisar las 6) // Flete no incluido",
        items: {
          create: [
            {
              productTypeId: sofaType.id,
              quantity: 1,
              unitPrice: sofaType.basePrice,
              totalPrice: sofaType.basePrice,
              deliveryDate: daysFromNow(15),
              attributes: {
                Medida: "2.40 x 2.00 x 1.10 m (chaise)",
                "Tipo de brazo": "Recto",
                Patas: "Marrón medio",
                Tela: "Liso Molinari 04 Camel",
                "Densidad almohadón asiento": "Media",
                Orientación: "Derecha",
              },
              factoryNotes: "3 almohadones deco 50x50 en Camel, 2 en Natural, 1 deco 60x40 en Natural",
            },
          ],
        },
        payments: {
          create: [{ amount: sofaType.basePrice.toNumber(), method: "efectivo", note: "Pagado en su totalidad" }],
        },
      },
    });
    console.log(`Seeded demo order #${order.number}`);
  }

  const moreOrders = [
    {
      customer: customers.Lucía,
      orderDate: daysAgo(60),
      deliveryDate: daysAgo(40),
      status: "delivered" as const,
      productType: chesterType,
      quantity: 1,
      paid: true,
    },
    {
      customer: customers.Martín,
      orderDate: daysAgo(55),
      deliveryDate: daysAgo(35),
      status: "delivered" as const,
      productType: sofaType,
      quantity: 1,
      paid: true,
    },
    {
      customer: customers.Sofía,
      orderDate: daysAgo(48),
      deliveryDate: daysAgo(28),
      status: "delivered" as const,
      productType: retapizadoType,
      quantity: 1,
      paid: true,
    },
    {
      customer: customers.Nicolás,
      orderDate: daysAgo(30),
      deliveryDate: daysAgo(5),
      status: "delivered" as const,
      productType: berlinType,
      quantity: 2,
      paid: true,
    },
    {
      customer: customers.Valentina,
      orderDate: daysAgo(21),
      deliveryDate: daysFromNow(5),
      status: "in_production" as const,
      productType: chesterType,
      quantity: 1,
      paid: true,
    },
    {
      customer: customers.Paula,
      orderDate: daysAgo(18),
      deliveryDate: daysFromNow(10),
      status: "in_production" as const,
      productType: puffType,
      quantity: 3,
      paid: false,
    },
    {
      customer: customers.Lucía,
      orderDate: daysAgo(10),
      deliveryDate: daysFromNow(20),
      status: "confirmed" as const,
      productType: sofaType,
      quantity: 1,
      paid: false,
    },
    {
      customer: customers.Martín,
      orderDate: daysAgo(6),
      deliveryDate: daysFromNow(25),
      status: "confirmed" as const,
      productType: almohadonType,
      quantity: 4,
      paid: true,
    },
    {
      customer: customers.Sofía,
      orderDate: daysAgo(4),
      deliveryDate: daysFromNow(3),
      status: "cancelled" as const,
      productType: berlinType,
      quantity: 1,
      paid: false,
    },
    {
      customer: customers.Nicolás,
      orderDate: daysAgo(1),
      deliveryDate: daysFromNow(30),
      status: "draft" as const,
      productType: retapizadoType,
      quantity: 1,
      paid: false,
    },
  ];

  for (const spec of moreOrders) {
    const existing = await prisma.order.findFirst({
      where: { customerId: spec.customer.id, status: spec.status, notes: `seed:${spec.productType.name}` },
    });
    if (existing) continue;

    const totalPrice = spec.productType.basePrice.toNumber() * spec.quantity;
    await prisma.order.create({
      data: {
        customerId: spec.customer.id,
        salespersonId: salesperson.id,
        status: spec.status,
        date: spec.orderDate,
        notes: `seed:${spec.productType.name}`,
        items: {
          create: [
            {
              productTypeId: spec.productType.id,
              quantity: spec.quantity,
              unitPrice: spec.productType.basePrice,
              totalPrice,
              deliveryDate: spec.deliveryDate,
              attributes: {},
            },
          ],
        },
        payments: spec.paid
          ? { create: [{ amount: totalPrice, method: "efectivo", date: spec.orderDate }] }
          : undefined,
      },
    });
  }

  console.log("Seed completed:", {
    admin: admin.email,
    salesperson: salesperson.email,
    factory: factoryUser.email,
    productTypes: [sofaType.name, chesterType.name],
    totalOrders: await prisma.order.count(),
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
