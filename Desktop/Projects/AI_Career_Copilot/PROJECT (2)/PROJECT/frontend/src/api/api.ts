import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5001/api",
});

// ✅ FIXED INTERCEPTOR (no TS error)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;