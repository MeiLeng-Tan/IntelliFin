import React, { useState } from "react";
import { authService } from "../../services/authService";
import type { SignUpCredentials } from "../../types/authTypes";
import { cn } from "../../utils/cn";

interface SignupViewProps {
    onAuthSuccess: () => void;
    onSwitchToLogin: () => void;
}

export const SignupView: React.FC<SignupViewProps> = ({ onAuthSuccess, onSwitchToLogin }) => {
    const [formData, setFormData] = useState<SignUpCredentials>({
        email: "",
        password: "",
        first_name: "",
        last_name: ""
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
            setError("Please fill out all required fields.");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            await authService.signup(formData);
            onAuthSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || "User registration failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full space-y-6 bg-white p-8 border border-gray-200 rounded-2xl shadow-sm">
                <div>
                    <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-900">
                        Create Account
                    </h2>
                </div>

                {error && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-medium">
                        {error}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                First Name
                            </label>
                            <input 
                                name="first_name"
                                type="text"
                                required
                                value={formData.first_name}
                                onChange={handleChange}
                                className={cn(
                                    "w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm transition-all",
                                "focus:outline-none focus:bg-white focus:border-indigo-600",
                                error ? "border-rose-300 bg-rose-50/30" : "border-gray-200"
                                )}
                                placeholder="Your First Name"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                Last Name
                            </label>
                            <input 
                                name="last_name"
                                type="text"
                                required
                                value={formData.last_name}
                                onChange={handleChange}
                                className={cn(
                                    "w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm transition-all",
                                "focus:outline-none focus:bg-white focus:border-indigo-600",
                                error ? "border-rose-300 bg-rose-50/30" : "border-gray-200"
                                )}
                                placeholder="Your Last Name"
                            />
                        </div>
                    </div>
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
                                    "w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm transition-all",
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
                                    "w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm transition-all",
                                "focus:outline-none focus:bg-white focus:border-indigo-600",
                                error ? "border-rose-300 bg-rose-50/30" : "border-gray-200"
                                )}
                                placeholder="Your password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={cn(
                                "w-full flex justify-center py-3 px-4 text-sm font-semibold rounded-xl text-white transition-colors mt-4",
                                "bg-indigo-600 hover:bg-indigo-700 focus:outline-none",
                                "disabled:opacity-50 disabled:bg-indigo-400"
                                )}
                        >
                            {isLoading ? "Registerign User..." : "Register & Auto Login"}
                        </button>
                </form>
                <p className="text-center text-xs text-gray-400 mt-2">
                    Already registered?{" "}
                    <button 
                        onClick={onSwitchToLogin}
                        className="text-indigo-600 font-semibold hover:underline"
                    >
                        Sign in here
                    </button>
                </p>
            </div>
        </div>
    );
};