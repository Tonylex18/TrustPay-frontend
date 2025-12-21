const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const getStoredToken = () =>
  localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

const setStoredToken = (token: string, remember: boolean) => {
  if (remember) {
    localStorage.setItem("authToken", token);
    sessionStorage.removeItem("authToken");
  } else {
    sessionStorage.setItem("authToken", token);
    localStorage.removeItem("authToken");
  }
};

const clearStoredToken = () => {
  localStorage.removeItem("authToken");
  sessionStorage.removeItem("authToken");
};

export { API_BASE_URL, getStoredToken, setStoredToken, clearStoredToken };
