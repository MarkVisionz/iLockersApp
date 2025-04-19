import "./App.css";
import "react-toastify/dist/ReactToastify.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import Home from "./components/Home";
import NavBar from "./components/NavBar";
import NotFound from "./components/NotFound";

import Register from "./components/auth/Register";
import Login from "./components/auth/Login";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import EmailVerification from "./components/auth/EmailVerification";
import ProtectedVerificationRoute from "./components/auth/ProtectedRoute";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { loadUser } from "./features/authSlice";

import CheckoutSuccess from "./components/CheckoutSuccess";
import Dashboard from "./components/admin/Dashboard";
import CreateProduct from "./components/admin/CreateProduct";
import CreateService from "./components/admin/CreateService";
import ProductsList from "./components/admin/list/ProductsList";
import ServicesList from "./components/admin/list/ServicesList";

import Product from "./components/Details/Product";
import Order from "./components/Details/Order";
import Note from "./components/Details/Note";
import UserProfile from "./components/Details/UserProfile";
import LaundryStatusScreen from "./components/admin/LaundryStatusScreen";

// PAGES
import Users from "./components/pages/Users";
import Orders from "./components/pages/Orders";
import Products from "./components/pages/Products";
import Cart from "./components/pages/Cart";
import LaundryNote from "./components/pages/NotasList";
import Summary from "./components/pages/Summary";
import LocalSummary from "./components/pages/LocalSummary";
import Services from "./components/pages/Services";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <div className="App">
      <BrowserRouter>
        <ToastContainer limit={3} />

        <NavBar />
        <div className="content-container">
          <Routes>
            <Route path="/" exact element={<Home />} />
            <Route path="/laundry-note" element={<LaundryNote />} />
            <Route path="/laundry-screen" element={<LaundryStatusScreen />} />

            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout-success" element={<CheckoutSuccess />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/verify-email"
              element={
                <ProtectedVerificationRoute>
                  <EmailVerification />
                </ProtectedVerificationRoute>
              }
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/product/:id" element={<Product />} />
            <Route path="/order/:id" element={<Order />} />
            <Route path="/note/:id" element={<Note />} />
            <Route path="/user/:id" element={<UserProfile />} />
            <Route path="/admin" element={<Dashboard />}>
            
              <Route path="products" element={<Products />}>
                <Route index element={<ProductsList />} />
                <Route path="create-product" element={<CreateProduct />} />
              </Route>

              <Route path="services" element={<Services />}>
                <Route index element={<ServicesList />} />
                <Route path="create-service" element={<CreateService />} />
              </Route>

              <Route path="summary" element={<Summary />} />
              <Route path="users" element={<Users />} />
              <Route path="orders" element={<Orders />} />
              <Route path="notes-summary" element={<LocalSummary />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
