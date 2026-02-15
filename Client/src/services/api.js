import axios from "axios";

// Determine API URL based on environment
const getApiUrl = () => {
   
    if (import.meta.env.DEV) {
        return "/api";
    }
    return import.meta.env.VITE_API_URL || "/api";
};

const API_URL = getApiUrl();

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000, 
    withCredentials: true, 
});


api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle common errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle 401 Unauthorized - token expired or invalid (skip redirect for login/register requests)
        const isAuthRequest = error.config?.url?.includes("/auth/login") || error.config?.url?.includes("/auth/register");
        if (error.response?.status === 401 && !isAuthRequest) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }

        console.error(
            "API Error:",
            error.response?.status,
            error.response?.data?.message || error.response?.data?.error || error.message
        );

        return Promise.reject(error);
    }
);

// Set auth token utility function
export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        localStorage.setItem("token", token);
    } else {
        delete api.defaults.headers.common["Authorization"];
        localStorage.removeItem("token");
    }
};

// Load token from localStorage on app startup
const savedToken = localStorage.getItem("token");
if (savedToken) {
    setAuthToken(savedToken);
}

// Authentication API endpoints
export const authAPI = {
    login: async (credentials) => {
        try {
            const response = await api.post("/auth/login", credentials);
            if (response.data.token) {
                setAuthToken(response.data.token);
            }
            return response.data;
        } catch (error) {
            const data = error.response?.data;
            const message = data?.error || data?.message || error.message || "Login failed";
            throw { error: message, response: error.response };
        }
    },

    logout: async () => {
        try {
            setAuthToken(null);
            return { success: true };
        } catch (error) {
            throw error.response?.data || { error: "Logout failed" };
        }
    },

    googleLogin: () => {
        // Use full backend URL so OAuth redirect hits the server (avoids proxy issues with full-page nav)
        const backendBase =
            import.meta.env.VITE_BACKEND_URL ||
            (import.meta.env.DEV ? "http://localhost:5000" : "");
        const url = backendBase
            ? `${backendBase.replace(/\/$/, "")}/api/auth/google`
            : "/api/auth/google";
        window.location.href = url;
    },

    truecallerLogin: async (credentials) => {
        try {
            const response = await api.post("/auth/truecaller/login", credentials);
            if (response.data.token) {
                setAuthToken(response.data.token);
            }
            return response.data;
        } catch (error) {
            const data = error.response?.data;
            const message = data?.error || data?.message || error.message || "TrueCaller login failed";
            throw { error: message, response: error.response };
        }
    },

    register: async (userData) => {
        try {
            const response = await api.post("/auth/register", userData);
            if (response.data.token) {
                setAuthToken(response.data.token);
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: "Registration failed" };
        }
    },
};


export const scoreAPI = {
    submitScore: async (scoreData) => {
        try {
            const response = await api.post("/score/submit", scoreData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: "Score submission failed" };
        }
    },

    getScores: async (params = {}) => {
        try {
            const response = await api.get("/score", { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: "Failed to fetch scores" };
        }
    },

    getUserScores: async (userId, params = {}) => {
        try {
            const response = await api.get(`/score/user/${userId}`, { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: "Failed to fetch user scores" };
        }
    },
};


export const userAPI = {
    getProfile: async () => {
        try {
            const response = await api.get("/user/profile");
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: "Failed to fetch profile" };
        }
    },

    updateProfile: async (profileData) => {
        try {
            const response = await api.put("/user/profile", profileData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: "Failed to update profile" };
        }
    },

    getHistory: async (page = 1, limit = 10) => {
        try {
            const response = await api.get("/user/scores", {
                params: { page, limit },
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: "Failed to fetch history" };
        }
    },

    getHeatmap: async () => {
        try {
            const response = await api.get("/user/heatmap");
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: "Failed to fetch heatmap" };
        }
    },

    getStats: async () => {
        try {
            const response = await api.get("/user/stats");
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: "Failed to fetch stats" };
        }
    },
};

export const leaderboardAPI = {
    getDaily: async () => {
        try {
            const response = await api.get("/leaderboard/daily");
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: "Failed to fetch daily leaderboard" };
        }
    },
    getWeekly: async () => {
        try {
            const response = await api.get("/leaderboard/weekly");
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: "Failed to fetch weekly leaderboard" };
        }
    },
    getAllTime: async () => {
        try {
            const response = await api.get("/leaderboard/all-time");
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: "Failed to fetch leaderboard" };
        }
    },
};

// Health check
export const healthCheck = async () => {
    // eslint-disable-next-line no-useless-catch
    try {
        const response = await api.get("/health");
        return response.data;
    } catch (error) {
        throw error;
    }
};

export default api;
