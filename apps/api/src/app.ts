import cors from "cors";
import express, { Express } from "express";
import "@presentation/http/types";
import { AttributeCatalogService } from "@application/attribute-catalogs/AttributeCatalogService";
import { ProductCategoryService } from "@application/catalog/ProductCategoryService";
import { ProductTypeService } from "@application/catalog/ProductTypeService";
import { CustomerService } from "@application/customers/CustomerService";
import { OrderService } from "@application/orders/OrderService";
import { PaymentMethodService } from "@application/payment-methods/PaymentMethodService";
import { PdfService } from "@application/pdf/PdfService";
import { ProductionService } from "@application/production/ProductionService";
import { SalesExportService } from "@application/sales/SalesExportService";
import { SalesService } from "@application/sales/SalesService";
import { UserService } from "@application/users/UserService";
import { env } from "@config/env";
import { prisma } from "@infrastructure/database/prisma";
import { ReactPdfRenderer } from "@infrastructure/pdf/ReactPdfRenderer";
import {
  PrismaAttributeCatalogRepository,
  PrismaProductCategoryRepository,
  PrismaProductTypeRepository,
} from "@infrastructure/repositories/PrismaCatalogRepository";
import { PrismaCustomerRepository } from "@infrastructure/repositories/PrismaCustomerRepository";
import { PrismaOrderRepository } from "@infrastructure/repositories/PrismaOrderRepository";
import { PrismaPaymentMethodRepository } from "@infrastructure/repositories/PrismaPaymentMethodRepository";
import { PrismaUserRepository } from "@infrastructure/repositories/PrismaUserRepository";
import { LocalFileStorage } from "@infrastructure/storage/LocalFileStorage";
import { ExcelJsSalesExportRenderer } from "@infrastructure/xlsx/ExcelJsSalesExportRenderer";
import { AttributeCatalogsController } from "@presentation/http/controllers/attribute-catalogs.controller";
import { CustomersController } from "@presentation/http/controllers/customers.controller";
import { OrdersController } from "@presentation/http/controllers/orders.controller";
import { PaymentMethodsController } from "@presentation/http/controllers/payment-methods.controller";
import { PdfController } from "@presentation/http/controllers/pdf.controller";
import { ProductCategoriesController } from "@presentation/http/controllers/product-categories.controller";
import { ProductionController } from "@presentation/http/controllers/production.controller";
import { ProductTypesController } from "@presentation/http/controllers/product-types.controller";
import { SalesController } from "@presentation/http/controllers/sales.controller";
import { UsersController } from "@presentation/http/controllers/users.controller";
import { createCurrentUserMiddleware } from "@presentation/http/middlewares/currentUser";
import { errorHandler } from "@presentation/http/middlewares/errorHandler";
import { createAttributeCatalogsRouter } from "@presentation/http/routes/attribute-catalogs.routes";
import { createCustomersRouter } from "@presentation/http/routes/customers.routes";
import { createOrdersRouter } from "@presentation/http/routes/orders.routes";
import { createPaymentMethodsRouter } from "@presentation/http/routes/payment-methods.routes";
import { createPdfRouter } from "@presentation/http/routes/pdf.routes";
import { createProductCategoriesRouter } from "@presentation/http/routes/product-categories.routes";
import { createProductionRouter } from "@presentation/http/routes/production.routes";
import { createProductTypesRouter } from "@presentation/http/routes/product-types.routes";
import { createSalesRouter } from "@presentation/http/routes/sales.routes";
import { createAdminUsersRouter, createUsersRouter } from "@presentation/http/routes/users.routes";

export function createApp(): Express {
  const userRepository = new PrismaUserRepository(prisma);
  const customerRepository = new PrismaCustomerRepository(prisma);
  const productTypeRepository = new PrismaProductTypeRepository(prisma);
  const productCategoryRepository = new PrismaProductCategoryRepository(prisma);
  const attributeCatalogRepository = new PrismaAttributeCatalogRepository(prisma);
  const orderRepository = new PrismaOrderRepository(prisma);
  const paymentMethodRepository = new PrismaPaymentMethodRepository(prisma);
  const fileStorage = new LocalFileStorage(env.uploadsDir);
  const pdfRenderer = new ReactPdfRenderer(env.uploadsDir);
  const salesExportRenderer = new ExcelJsSalesExportRenderer();

  const userService = new UserService(userRepository);
  const customerService = new CustomerService(customerRepository);
  const productTypeService = new ProductTypeService(productTypeRepository, fileStorage);
  const productCategoryService = new ProductCategoryService(productCategoryRepository);
  const attributeCatalogService = new AttributeCatalogService(attributeCatalogRepository);
  const orderService = new OrderService(
    orderRepository,
    customerRepository,
    productTypeRepository,
    userRepository,
    fileStorage
  );
  const productionService = new ProductionService(orderRepository);
  const salesService = new SalesService(orderRepository);
  const salesExportService = new SalesExportService(orderRepository, salesExportRenderer);
  const paymentMethodService = new PaymentMethodService(paymentMethodRepository);
  const pdfService = new PdfService(orderRepository, customerRepository, pdfRenderer);

  const usersController = new UsersController(userService);
  const customersController = new CustomersController(customerService);
  const productTypesController = new ProductTypesController(productTypeService);
  const productCategoriesController = new ProductCategoriesController(productCategoryService);
  const attributeCatalogsController = new AttributeCatalogsController(attributeCatalogService);
  const ordersController = new OrdersController(orderService);
  const productionController = new ProductionController(productionService);
  const salesController = new SalesController(salesService, salesExportService);
  const pdfController = new PdfController(pdfService);
  const paymentMethodsController = new PaymentMethodsController(paymentMethodService);

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/uploads", express.static(env.uploadsDir));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth/users", createUsersRouter(usersController));

  const currentUserMiddleware = createCurrentUserMiddleware(userRepository);

  app.use("/api/customers", currentUserMiddleware, createCustomersRouter(customersController));
  app.use(
    "/api/product-types",
    currentUserMiddleware,
    createProductTypesRouter(productTypesController)
  );
  app.use(
    "/api/product-categories",
    currentUserMiddleware,
    createProductCategoriesRouter(productCategoriesController)
  );
  app.use(
    "/api/attribute-catalogs",
    currentUserMiddleware,
    createAttributeCatalogsRouter(attributeCatalogsController)
  );
  app.use("/api/orders", currentUserMiddleware, createOrdersRouter(ordersController));
  app.use(
    "/api/payment-methods",
    currentUserMiddleware,
    createPaymentMethodsRouter(paymentMethodsController)
  );
  app.use("/api/production", currentUserMiddleware, createProductionRouter(productionController));
  app.use("/api/sales", currentUserMiddleware, createSalesRouter(salesController));
  app.use("/api/pdf", currentUserMiddleware, createPdfRouter(pdfController));
  app.use("/api/users", currentUserMiddleware, createAdminUsersRouter(usersController));

  app.use(errorHandler);

  return app;
}
