import axios from "axios";

const api = axios.create({
    baseURL: `${import.meta.env.VITE_BACK_END_SERVER_URL}/api`,
})

api.interceptors.request.use(
    (config) => {
        const token: string | null = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error: unknown) => {
        return Promise.reject(error);
    }
);

export default api;