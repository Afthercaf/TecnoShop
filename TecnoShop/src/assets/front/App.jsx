// src/App.jsx

import { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import RegistroClientes from "./registrologinclient/RegistroClientes";
import LoginUsuarios from "./registrologinclient/LoginUsuarios";
import LoginMicro from "./PaginaMicro/LoginMicro";
import RegistroMicro from "./PaginaMicro/RegistroMicro";
import AdminDashboard from "./PaginaMicroAdmin/AdminDashboard";
import ProductsTable from "./PaginaMicroAdmin/components/ProductsTable";
import OrdersTable from "./PaginaMicroAdmin/components/OrdersTable";
import PurchasesManager from "./PaginaMicroAdmin/components/PurchasesManager";
import StoreInfo from "./PaginaMicroAdmin/components/StoreInfo";
import StorePreview from "./PaginaMicroAdmin/components/StorePreview";
import InventoryTable from "./PaginaMicroAdmin/components/InventoryTable";
import UserPage from "./UserComponents/UserPage";
import UserCompra from "./UserComponents/User-Compra";
import UserLayout from "./UserComponents/UserLayout";
import UserProfile from "./UserComponents/UserProfile";
import UserOrders from "./UserComponents/UserOrders";
import UserSettings from "./UserComponents/UserSettings";
import ProductDetails from "./UserComponents/ProductDetails";
import SuperPage from "./SuperAdmin/SuperPage"; 
import LoginSuperAdmin from "./SuperAdmin/LoginSuperAdmin"; 
import NavbarSuper from "./SuperAdmin/NavbarSuper"; // Importa el NavbarSuper
import { AuthUserProvider } from "../../context/authContext";
import { ProductProvider } from "../../context/ProductContext";
import { UserProvider } from "../../context/UserContext";
import { TiendaProvider } from "../../context/TiendaContext";
import {CartProvider, Cart } from "../../assets/front/UserComponents/CartPage";
import PaymentPage from "../../paymant";

import ReintentarOnboarding from "../../reintentar";
import ExitoOnboarding from "../../exito";


function App() {
  const [cart, setCart] = useState([]); // Estado del carrito

  return (
    <div className="min-h-screen w-full">
     <AuthUserProvider>
     <CartProvider> {/* Pass userId to CartProvider */}
      <ProductProvider>
      <TiendaProvider>
      <UserProvider>
      <Router>
        <Routes>
          {/* Rutas de autenticación */}
          <Route path="/registro" element={<RegistroClientes />} />
          <Route path="/LoginUsuarios" element={<LoginUsuarios />} />
          <Route path="/login-vendor" element={<LoginMicro />} />
          <Route path="/registro-micro" element={<RegistroMicro />} />

          <Route path="/reintentar" element={<ReintentarOnboarding />} />
          <Route path="/exito" element={<ExitoOnboarding />} />

          <Route path="/login-superadmin" element={<LoginSuperAdmin />} />

          {/* Rutas del usuario con layout */}
          <Route element={<UserLayout />}>
            <Route path="/" element={<UserPage cart={cart} setCart={setCart} />} />
            <Route path="/user-compra" element={<UserCompra />} />
            <Route path="/Payments" element={<PaymentPage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/user-profile" element={<UserProfile />} />
            <Route path="/user-orders" element={<UserOrders />} />
            <Route path="/user-settings" element={<UserSettings />} />
            <Route path="/product-details" element={<ProductDetails />} />
          </Route>

          {/* Rutas de administrador */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-dashboard/products" element={<ProductsTable />} />
          <Route path="/admin-dashboard/orders" element={<OrdersTable />} />
          <Route path="/admin-dashboard/purchases" element={<PurchasesManager />} />
          <Route path="/admin-dashboard/store" element={<StoreInfo />} />
          <Route path="/admin-dashboard/inventory" element={<InventoryTable />} />

          {/* Ruta para ver detalles de la tienda */}
          <Route path="/store/:storeName" element={<StorePreview />} />

          {/* Rutas de SuperAdmin con Navbar */}
          <Route
            path="/superadmin-dashboard"
            element={
              <div>
                <NavbarSuper /> {/* Incluye NavbarSuper en el dashboard */}
                <SuperPage />
              </div>
            }
          />
          <Route
            path="/superadmin-stores-products"
            element={
              <div>
                <NavbarSuper /> {/* Incluye NavbarSuper en la página de tiendas y productos */}
                <UserPage cart={cart} setCart={setCart} />
              </div>
            }
          />
          <Route
            path="/superadmin-product-details"
            element={
              <div>
                <NavbarSuper /> {/* Incluye NavbarSuper en la página de detalles del producto para SuperAdmin */}
                <ProductDetails />
              </div>
            }
          />

        </Routes>
      </Router>
      </UserProvider>
      </TiendaProvider> 
      </ProductProvider>
      </CartProvider>
      </AuthUserProvider>
    </div>
  );
}

export default App;
