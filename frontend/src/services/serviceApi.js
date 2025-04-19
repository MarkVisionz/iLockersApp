import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data;
    console.error("Error completo del backend:", {
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
  async fetchServices(params = {}) {
    try {
      return await api.get(API_URL, { params });
    } catch (error) {
      console.error("Error fetching services:", error);
      throw error;
    }
  },

  async createService(serviceData) {
    try {
      console.log("Enviando solicitud POST a:", API_URL, serviceData);
      return await api.post(API_URL, serviceData);
    } catch (error) {
      console.error("Error creating service:", error);
      throw error;
    }
  },

  async getService(id) {
    try {
      return await api.get(`${API_URL}/${id}`);
    } catch (error) {
      console.error("Error fetching service:", error);
      throw error;
    }
  },

  async updateService(id, serviceData) {
    try {
      return await api.put(`${API_URL}/${id}`, serviceData);
    } catch (error) {
      console.error("Error updating service:", error);
      throw error;
    }
  },

  async deleteService(id) {
    try {
      return await api.delete(`${API_URL}/${id}`);
    } catch (error) {
      console.error("Error deleting service:", error);
      throw error;
    }
  },

  async deleteAllServices() {
    try {
      return await api.delete(API_URL);
    } catch (error) {
      console.error("Error deleting all services:", error);
      throw error;
    }
  },
};
