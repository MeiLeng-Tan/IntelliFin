import api from "./api"
import type { LoginCredentials, AuthResponse, SignUpCredentials } from "../types/authTypes";

export const authService = {
    /**
     * POST /api/auth/login
     * Sends user credentials, receive JWT token, and save it to localStorage
     */
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>("/auth/login", credentials);
        if (response.data.token) {
            localStorage.setItem("token", response.data.token);
        }
        return response.data;
    },
    /**
     * POST /api/auth/signup
     * Sends user data, receive JWT token and save it to localStorage.
     */
    signup: async (userData: SignUpCredentials): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>("/auth/signup", userData);
        if (response.data.token) {
            localStorage.setItem("token", response.data.token);
        }
        return response.data;
    },

    logout: (): void => {
        localStorage.removeItem("token");
        window.location.href = "/login"
    }
}