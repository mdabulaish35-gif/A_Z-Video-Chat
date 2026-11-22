import React, { useState } from "react";
import { SERVER_URL } from "../config";
import { EyeIcon, EyeOffIcon } from "./Icons";

const AuthScreen = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async () => {
        if (!formData.email || !formData.password) {
            setError("Please fill all details");
            return;
        }

        if (!isLogin) {
            if (!formData.name) {
                setError("Name is required");
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                setError("Invalid Email Format! (e.g., user@gmail.com)");
                return;
            }
            if (formData.password.length < 6) {
                setError("Password too weak! Must be at least 6 characters.");
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError("Passwords do not match!");
                return;
            }
        }

        setLoading(true);
        const endpoint = isLogin ? "/login" : "/signup";

        try {
            const response = await fetch(`${SERVER_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                onLogin(data.user);
            } else {
                if (data.error && data.error.includes("User validation failed")) {
                    if (data.error.includes("email")) setError("Please enter a valid email address");
                    else if (data.error.includes("password")) setError("Password must be at least 6 characters");
                    else setError(data.message || "Invalid Data");
                } else {
                    setError(data.message || "Something went wrong");
                }
            }
        } catch (err) {
            setError("Server connection failed. Is Backend running?");
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="login-card">
            <h2 className="card-title">{isLogin ? "Welcome Back" : "Create Account"}</h2>
            <h4 className="card-subtitle">
                {isLogin ? "Login to A_Z Video Chat" : "Sign up to get started"}
            </h4>

            {!isLogin && (
                <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                />
            )}

            <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
            />

            <div className="password-container">
                <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder={isLogin ? "Enter Password Here" : "Create Password"}
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="eye-btn"
                >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            </div>

            {!isLogin && (
                <div className="password-container">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="input-field"
                    />
                </div>
            )}

            {error && <p className="error-text">{error}</p>}

            <button
                onClick={handleSubmit}
                className="join-btn auth-submit-btn"
                disabled={loading}
            >
                {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
            </button>

            <p
                className="auth-toggle"
                onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
                }}
            >
                {isLogin ? "New user? Create Account" : "Already have account? Login"}
            </p>
        </div>
    );
};

export default AuthScreen;