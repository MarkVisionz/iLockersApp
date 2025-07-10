import axios from "axios";
import { setHeaders } from "../features/api";

const api = axios.create({
  baseURL: "http://localhost:5001/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data;
    console.error(`[${error.config.method.toUpperCase()} ${error.config.url}] Error del backend:`, {
      status: error.response?.status,
      message: errorData?.message,
      errors: errorData?.errors,
      validation: errorData?.validation,
      stack: error.stack,
    });

    const errorMessage =
      errorData?.message ||
      (errorData?.errors ? JSON.stringify(errorData.errors) : null) ||
      "Error en la solicitud";

    const customError = new Error(errorMessage);
    customError.status = error.response?.status;
    customError.data = errorData;

    return Promise.reject(customError);
  }
);

const API_URL = "/services";

export const serviceAPI = {
  async fetchServices({ businessId }) {
    try {
      console.log("Enviando solicitud GET a:", API_URL, { businessId });
      return await api.get(API_URL, { ...setHeaders(), params: { businessId } });
    } catch (error) {
      console.error("Error fetching services:", error);
      throw error;
    }
  },

  async createService(serviceData) {
    try {
      console.log("Enviando solicitud POST a:", API_URL, serviceData);
      return await api.post(API_URL, serviceData, setHeaders());
    } catch (error) {
      console.error("Error creating service:", error);
      throw error;
    }
  },

  async bulkCreateServices({ services, businessId }) {
    try {
      console.log("Enviando solicitud POST a:", `${API_URL}/bulk`, { services, businessId });
      return await api.post(`${API_URL}/bulk`, { services, businessId }, setHeaders());
    } catch (error) {
      console.error("Error creating bulk services:", error);
      throw error;
    }
  },

  async getService(id, businessId) {
    try {
      console.log("Enviando solicitud GET a:", `${API_URL}/${id}`, { businessId });
      return await api.get(`${API_URL}/${id}`, { ...setHeaders(), params: { businessId } });
    } catch (error) {
      console.error("Error fetching service:", error);
      throw error;
    }
  },

  async updateService(id, serviceData) {
    try {
      console.log("Enviando solicitud PUT a:", `${API_URL}/${id}`, serviceData);
      return await api.put(`${API_URL}/${id}`, serviceData, setHeaders());
    } catch (error) {
      console.error("Error updating service:", error);
      throw error;
    }
  },

  async deleteService({ id, businessId }) {
    try {
      console.log("Enviando solicitud DELETE a:", `${API_URL}/${id}`, { businessId });
      return await api.delete(`${API_URL}/${id}`, { ...setHeaders(), params: { businessId } });
    } catch (error) {
      console.error("Error deleting service:", error);
      throw error;
    }
  },

  async deleteAllServices(businessId) {
    try {
      console.log("Enviando solicitud DELETE a:", API_URL, { businessId });
      return await api.delete(API_URL, { ...setHeaders(), params: { businessId } });
    } catch (error) {
      console.error("Error deleting all services:", error);
      throw error;
    }
  },
};