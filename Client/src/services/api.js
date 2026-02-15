import axios from "axios";

// Determine API URL based on environment
const getApiUrl = () => {
    // In development, use the relative path /api which is proxied by Vite to localhost:5000
    // In production, use the environment variable or default to /api
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
    timeout: 10000, // 10 second timeout
    withCredentials: true, // Include credentials in requests
});

// Request interceptor - add auth token to all requests
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
        // Handle 401 Unauthorized - token expired or invalid
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login"; // Redirect to login
        }

        // Log error for debugging
        console.error(
            "API Error:",
            error.response?.status,
            error.response?.data?.message || error.message
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
            throw error.response?.data || { error: "Login failed" };
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
        window.location.href = `${API_URL}/auth/google`;
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

// Score API endpoints
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

// User API endpoints
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

// Leaderboard API endpoints
export const leaderboardAPI = {
    getLeaderboard: async (params = {}) => {
        try {
            const response = await api.get("/leaderboard", { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: "Failed to fetch leaderboard" };
        }
    },

    getTopPlayers: async (limit = 10) => {
        try {
            const response = await api.get("/leaderboard/top", {
                params: { limit },
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: "Failed to fetch top players" };
        }
    },

    getUserRank: async (userId) => {
        try {
            const response = await api.get(`/leaderboard/rank/${userId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: "Failed to fetch user rank" };
        }
    },
};

// Health check
export const healthCheck = async () => {
    try {
        const response = await api.get("/health");
        return response.data;
    } catch (error) {
        throw error;
    }
};

export default api;
