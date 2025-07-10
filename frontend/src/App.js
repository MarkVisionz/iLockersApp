import "./App.css";
import "react-toastify/dist/ReactToastify.css";

import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadUser, logoutUser } from "./features/authSlice";

// Componentes comunes
import Home from "./components/Home";
import NavBar from "./components/NavBar";
import NotFound from "./components/NotFound";

// Auth
import Register from "./components/auth/Register";
import BusinessRegister from "./components/auth/BusinessRegister";
import Login from "./components/auth/Login";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import EmailVerification from "./components/auth/EmailVerification";
import ProtectedVerificationRoute from "./components/auth/ProtectedRoute";
import SetUpBusiness from "./components/admin/SetUpBusiness";

// Pages comunes
import Cart from "./components/pages/Cart";
import CheckoutSuccess from "./components/CheckoutSuccess";
import NotasList from "./components/pages/NotasList";
import LaundryStatusScreen from "./components/admin/LaundryStatusScreen";

// Admin dashboard y subrutas
import Dashboard from "./components/admin/Dashboard";
import Products from "./components/pages/Products";
import Orders from "./components/pages/Orders";
import Users from "./components/pages/Users";
import Services from "./components/pages/Services";
import Summary from "./components/pages/Summary";
import LocalSummary from "./components/pages/LocalSummary";
import CreateProduct from "./components/admin/CreateProduct";
import CreateService from "./components/admin/CreateService";
import ProductsList from "./components/admin/list/ProductsList";
import ServicesList from "./components/admin/list/ServicesList";

// Detalles
import Product from "./components/Details/Product";
import Order from "./components/Details/Order";
import Note from "./components/Details/Note";
import UserProfile from "./components/Details/UserProfile";

// Ruta protegida para owners
const ProtectedOwnerRoute = ({ children }) => {
  const { role, registrationStep, isAuthenticated, loading, token, businesses } = useSelector(
    (state) => state.auth || { role: null, registrationStep: null, isAuthenticated: false, loading: false, token: null, businesses: [] }
  );
  const localToken = localStorage.getItem("token") || localStorage.getItem("adminToken");
  const { pathname } = useLocation();

  console.log("ProtectedOwnerRoute:", {
    role,
    registrationStep,
    isAuthenticated,
    loading,
    businesses,
    reduxToken: token ? `Presente (${token.substring(0, 20)}...)` : "Ausente",
    localToken: localToken ? `Presente (${localToken.substring(0, 20)}...)` : "Ausente",
    pathname,
  });

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated || !localToken) {
    console.log("No autenticado o sin token, redirigiendo a /login");
    return <Navigate to="/login" replace />;
  }

  if (role !== "owner") {
    console.log("Rol no es owner, redirigiendo a /");
    return <Navigate to="/" replace />;
  }

  // Permitir acceso a /owner y subrutas incluso si no hay negocios
  if (registrationStep === "completed" || registrationStep === "business_setup" || pathname === "/owner" || pathname === "/owner/create-business") {
    return children;
  }

  console.log("registrationStep no válido, redirigiendo a /verify-email");
  return <Navigate to="/verify-email" replace />;
};

// Ruta protegida para admins
const ProtectedAdminRoute = ({ children }) => {
  const { isAdmin, isAuthenticated, loading, token } = useSelector(
    (state) => state.auth || { isAdmin: false, isAuthenticated: false, loading: false, token: null }
  );
  const localToken = localStorage.getItem("adminToken") || localStorage.getItem("token");

  console.log("ProtectedAdminRoute:", {
    isAdmin,
    isAuthenticated,
    loading,
    reduxToken: token ? `Presente (${token.substring(0, 20)}...)` : "Ausente",
    localToken: localToken ? `Presente (${localToken.substring(0, 20)}...)` : "Ausente",
  });

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated || !localToken) {
    console.log("No autenticado o sin token, redirigiendo a /login");
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    console.log("No es admin, redirigiendo a /");
    return <Navigate to="/" replace />;
  }

  return children;
};

// Ruta protegida para setup-business
const ProtectedSetupRoute = ({ children }) => {
  const { role, registrationStep, isAuthenticated, loading, token } = useSelector(
    (state) => state.auth || { role: null, registrationStep: null, isAuthenticated: false, loading: false, token: null }
  );
  const { businesses } = useSelector((state) => state.auth || { businesses: [] });
  const localToken = localStorage.getItem("token") || localStorage.getItem("adminToken");

  console.log("ProtectedSetupRoute:", {
    role,
    registrationStep,
    isAuthenticated,
    loading,
    businesses,
    reduxToken: token ? `Presente (${token.substring(0, 20)}...)` : "Ausente",
    localToken: localToken ? `Presente (${localToken.substring(0, 20)}...)` : "Ausente",
  });

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated || !localToken) {
    console.log("No autenticado o sin token, redirigiendo a /login");
    return <Navigate to="/login" replace />;
  }

  if (role !== "owner") {
    console.log("Rol no es owner, redirigiendo a /");
    return <Navigate to="/" replace />;
  }

  if (registrationStep === "business_setup" || (registrationStep === "completed" && businesses.length > 0)) {
    return children;
  }

  console.log("registrationStep no válido, redirigiendo a /verify-email");
  return <Navigate to="/verify-email" replace />;
};

// Ruta protegida para NotasList y LaundryStatusScreen
const ProtectedLaundryNoteRoute = ({ children }) => {
  const { role, isAdmin, isAuthenticated, loading, token } = useSelector(
    (state) => state.auth || { role: null, isAdmin: false, isAuthenticated: false, loading: false, token: null }
  );
  const localToken = localStorage.getItem("token") || localStorage.getItem("adminToken");

  console.log("ProtectedLaundryNoteRoute:", {
    role,
    isAdmin,
    isAuthenticated,
    loading,
    reduxToken: token ? `Presente (${token.substring(0, 20)}...)` : "Ausente",
    localToken: localToken ? `Presente (${localToken.substring(0, 20)}...)` : "Ausente",
  });

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated || !localToken) {
    console.log("No autenticado o sin token, redirigiendo a /login");
    return <Navigate to="/login" replace />;
  }

  if (role !== "owner" && !isAdmin) {
    console.log("No es owner ni admin, redirigiendo a /");
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const dispatch = useDispatch();
  const { loading, isAuthenticated, _id, token } = useSelector((state) => state.auth);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const localToken = localStorage.getItem("token") || localStorage.getItem("adminToken");
        console.log("Token inicial en App.js:", {
          reduxToken: token ? `Presente (${token.substring(0, 20)}...)` : "Ausente",
          localToken: localToken ? `Presente (${localToken.substring(0, 20)}...)` : "Ausente",
        });

        if (!localToken) {
          console.log("No hay token, estableciendo estado inicial");
          dispatch(logoutUser());
          return;
        }

        if (!isAuthenticated && !loading) {
          console.log("Cargando usuario desde token en App.js");
          await dispatch(loadUser()).unwrap();
        }
      } catch (error) {
        console.error("Error initializing user:", error);
        dispatch(logoutUser());
      }
    };

    initializeUser();
  }, [dispatch, isAuthenticated, loading]);

  return (
    <div className="App">
      <BrowserRouter>
        <ToastContainer limit={3} />
        <NavBar />

        <div className="content-container">
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout-success" element={<CheckoutSuccess />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-business" element={<BusinessRegister />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/verify-email"
              element={
                <ProtectedVerificationRoute>
                  <EmailVerification />
                </ProtectedVerificationRoute>
              }
            />

            {/* Ruta protegida para setup-business */}
            <Route
              path="/setup-business"
              element={
                <ProtectedSetupRoute>
                  <SetUpBusiness />
                </ProtectedSetupRoute>
              }
            />

            {/* Detalles */}
            <Route path="/product/:id" element={<Product />} />
            <Route path="/order/:id" element={<Order />} />
            <Route path="/note/:id/:businessId" element={<Note />} />
            <Route path="/user/:id" element={<UserProfile />} />

            {/* Módulos lavandería */}
            <Route
              path="/laundry-note"
              element={
                <ProtectedLaundryNoteRoute>
                  <NotasList />
                </ProtectedLaundryNoteRoute>
              }
            />
            <Route
              path="/laundry-status/:businessId"
              element={
                <ProtectedLaundryNoteRoute>
                  <LaundryStatusScreen />
                </ProtectedLaundryNoteRoute>
              }
            />

            {/* Rutas protegidas para owner */}
            <Route
              path="/owner"
              element={
                <ProtectedOwnerRoute>
                  <Dashboard />
                </ProtectedOwnerRoute>
              }
            >
              <Route path="local-summary/:businessId" element={<LocalSummary />} />
              <Route path="services/:businessId" element={<ServicesList />} />
              <Route path="services/:businessId/create" element={<CreateService />} />
              <Route path="create-business" element={<SetUpBusiness />} />
            </Route>

            {/* Rutas protegidas para admin */}
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <Dashboard />
                </ProtectedAdminRoute>
              }
            >
              <Route path="summary" element={<Summary />} />
              <Route path="products" element={<Products />}>
                <Route index element={<ProductsList />} />
                <Route path="create-product" element={<CreateProduct />} />
              </Route>
              <Route path="services" element={<ServicesList />} />
              <Route path="services/create" element={<CreateService />} />
              <Route path="users" element={<Users />} />
              <Route path="orders" element={<Orders />} />
              <Route path="notes-summary" element={<LocalSummary />} />
            </Route>

            {/* Página 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;