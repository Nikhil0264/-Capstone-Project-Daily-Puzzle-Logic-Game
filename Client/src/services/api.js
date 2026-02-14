import axios from "axios";

const API_URL = "/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        localStorage.setItem("token", token);
    } else {
        delete api.defaults.headers.common["Authorization"];
        localStorage.removeItem("token");
    }
};


const savedToken = localStorage.getItem("token");
if (savedToken) {
    setAuthToken(savedToken);
}

export const authAPI = {
    login: async (credentials) => {
        
        const response = await api.post("/auth/login", credentials);
        return response.data;
    },
    googleLogin: () => {
        window.location.href = `${API_URL}/auth/google`;
    },
};

export const scoreAPI = {
    submitScore: async (data) => {
        
        const response = await api.post("/score/submit", data);
        return response.data;
    },
};

export default api;
