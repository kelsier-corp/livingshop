import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { RequireRole } from "@/components/RequireRole";
import { homeRouteForRole } from "@/auth/homeRoute";
import { ROUTE_ROLES } from "@/auth/routeRoles";
import { useCurrentUser } from "@/auth/CurrentUserContext";
import { AttributeCatalogsPage } from "@/pages/AttributeCatalogsPage";
import { CustomersPage } from "@/pages/CustomersPage";
import { OrderDetailPage } from "@/pages/OrderDetailPage";
import { OrderFormPage } from "@/pages/OrderFormPage";
import { OrdersListPage } from "@/pages/OrdersListPage";
import { ProductionPage } from "@/pages/ProductionPage";
import { PricesPage } from "@/pages/PricesPage";
import { ProductTypesPage } from "@/pages/ProductTypesPage";
import { SalesPage } from "@/pages/SalesPage";
import { UsersPage } from "@/pages/UsersPage";

function HomeRedirect() {
  const { currentUser, isLoading } = useCurrentUser();
  if (isLoading || !currentUser) return null;
  return <Navigate to={homeRouteForRole(currentUser.role)} replace />;
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomeRedirect />} />
        <Route
          path="/customers"
          element={
            <RequireRole roles={ROUTE_ROLES.customers}>
              <CustomersPage />
            </RequireRole>
          }
        />
        <Route
          path="/product-types"
          element={
            <RequireRole roles={ROUTE_ROLES.productTypes}>
              <ProductTypesPage />
            </RequireRole>
          }
        />
        <Route
          path="/prices"
          element={
            <RequireRole roles={ROUTE_ROLES.prices}>
              <PricesPage />
            </RequireRole>
          }
        />
        <Route
          path="/attribute-catalogs"
          element={
            <RequireRole roles={ROUTE_ROLES.attributeCatalogs}>
              <AttributeCatalogsPage />
            </RequireRole>
          }
        />
        <Route
          path="/orders"
          element={
            <RequireRole roles={ROUTE_ROLES.orders}>
              <OrdersListPage />
            </RequireRole>
          }
        />
        <Route
          path="/orders/new"
          element={
            <RequireRole roles={ROUTE_ROLES.createOrder}>
              <OrderFormPage />
            </RequireRole>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <RequireRole roles={ROUTE_ROLES.orders}>
              <OrderDetailPage />
            </RequireRole>
          }
        />
        <Route
          path="/production"
          element={
            <RequireRole roles={ROUTE_ROLES.production}>
              <ProductionPage />
            </RequireRole>
          }
        />
        <Route
          path="/sales"
          element={
            <RequireRole roles={ROUTE_ROLES.sales}>
              <SalesPage />
            </RequireRole>
          }
        />
        <Route
          path="/users"
          element={
            <RequireRole roles={ROUTE_ROLES.users}>
              <UsersPage />
            </RequireRole>
          }
        />
      </Route>
    </Routes>
  );
}
