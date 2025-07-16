import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import authService from "../api/authService";
import toast from "react-hot-toast";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  password2: z.string().min(8, "Confirm Password must be at least 8 characters long"),
}).refine((data) => data.password === data.password2, {
    message: "Passwords must match",
    path: ["password2"],
});

const RegisterPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(registerSchema),
        mode: "onBlur",
        defaultValues: {
            username: "",
            email: "",
            password: "",
            password2: "",
        },
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await authService.register(data);
            toast.success('Registration successful! Please log in.');
            navigate("/login");
        } catch (error) {
            const apiErrors = error.response?.data;
            if (apiErrors) {
                Object.entries(apiErrors).forEach(([field, messages]) => {
                    const messageText = Array.isArray(messages) ? messages.join(", ") : messages;
                    toast.error(`${field}: ${messageText}`);
                });
            } else {
                toast.error("An unexpected error occurred. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Register</h1>
            <form onSubmit={ handleSubmit(onSubmit) }>
                <div>
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        type="text"
                        {...register("username")}
                    />
                    {errors.username && <p className="error">{errors.username.message}</p>}
                </div>
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        {...register("email")}
                    />
                    {errors.email && <p className="error">{errors.email.message}</p>}
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        {...register("password")}
                    />
                    {errors.password && <p className="error">{errors.password.message}</p>}
                </div>
                <div>
                    <label htmlFor="password2">Confirm Password</label>
                    <input
                        id="password2"
                        type="password"
                        {...register("password2")}
                    />
                    {errors.password2 && <p className="error">{errors.password2.message}</p>}
                </div>
                
                <button type="submit" disabled={loading}>
                    {loading ? "Registering..." : "Register"}
                </button>
            </form>
            <p>
                Already have an account? <Link to="/login">Login</Link>
            </p>
        </div>
    );
};

export default RegisterPage;
