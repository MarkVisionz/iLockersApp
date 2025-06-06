import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

import productsReducer, { productsFetch } from "./features/productsSlice";
import cartReducer, { getTotals } from "./features/cartSlice";
import authReducer, { loadUser } from "./features/authSlice";
import { productsApi } from "./features/productsApi";
import ordersSlice from "./features/ordersSlice";
import usersSlice from "./features/usersSlice";
import notesReducer from "./features/notesSlice";
import servicesSlice from "./features/servicesSlice";

import setupAllSocketListeners from "./features/socketListeners/AllSocketListeners";

const store = configureStore({
  reducer: {
    products: productsReducer,
    orders: ordersSlice,
    users: usersSlice,
    cart: cartReducer,
    auth: authReducer,
    services: servicesSlice,
    [productsApi.reducerPath]: productsApi.reducer,
    notes: notesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(productsApi.middleware),
});

store.dispatch(productsFetch());
store.dispatch(getTotals());
store.dispatch(loadUser(null));

setupAllSocketListeners(store.dispatch);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
