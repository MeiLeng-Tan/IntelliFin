import { useState } from "react";
import { authService } from "../../services/authService";
import type { LoginCredentials } from "../../types/authTypes";
import { cn } from "../../utils/cn";

interface LoginViewProps {
    onAuthSuccess: () => void;
    onSwitchToSignup: () => void;
}
export const LoginView: React.FC<LoginViewProps> = ({ onAuthSuccess, onSwitchToSignup }) => {
    const [formData, setFormData] = useState<LoginCredentials>({ email: "", password: ""});
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            setError("Please fill out all credential fields.");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            // login communication pipeline
            await authService.login(formData);
            // Redirect to dashboard view on success
            onAuthSuccess();
        } catch (err: any) {
            // Display erro message from backend
            const serverErrorMessage = err.response?.data?.error || "Invalid credentials. Please retry.";
            setError(serverErrorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 border border-gray-200 rounded-2xl shadow-sm">
                <div>
                    <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-900">
                        Sign in to IntelliFin
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-500">
                        Enter your login credentials below.
                    </p>
                </div>
                {error && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-medium animate-pulse">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            Email
                        </label>
                        <input
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className={cn(
                                "w-full bg-gray-50 rounded-xl px-4 py-3 text-sm transition-all",
                                "focus:outline-none focus:bg-white focus:border-indigo-600",
                                error ? "border-rose-300 bg-rose-50/30" : "border-gray-200"
                                )}
                            placeholder="name@domain.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            Password
                        </label>
                        <input
                            name="password"
                            type="password"
                            required
                            value={formData.password || ""}
                            onChange={handleChange}
                            className={cn(
                                "w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm transition-all",
                                "focus:outline-none focus:bg-white focus:border-indigo-600",
                                error ? "border-rose-300 bg-rose-50/30" : "border-gray-200"
                            )}
                            placeholder="******"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={isLoading}
                        className={cn(
                            "w-full flex justify-center py-3 px-4 text-sm font-semibold rounded-xl text-white transition-colors mt-6",
                            "bg-indigo-600 hover:bg-indigo-700 focus:outline-none",
                            "disabled:opacity-50 disabled:bg-indigo-400"
                        )}
                    >
                        {isLoading ? "Validating session..." : "Sign In"}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-4">
                    Don't have an account?{" "}
                    <button 
                        onClick={onSwitchToSignup}
                        className="text-indigo-600 font-semibold hover:underline"
                    >
                        Register a new account
                    </button>
                </p>
            </div>
        </div>
    );
};
