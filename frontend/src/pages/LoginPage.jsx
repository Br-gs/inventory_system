import { useContext, useState } from "react";
import AuthContext from "../context/authContext";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const LoginPage = () => {
  const { loginUser, error: apiError } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await loginUser(data.username, data.password);
      navigate("/");
    } catch (err) {
      const errorMessage = err.response?.data?.detail || "An error occurred during login.";
      toast.error(`Error: ${errorMessage}`);
      console.error("Login failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <h1>Login</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset disabled={isSubmitting}>
          <div>
            <label htmlFor="username">Username</label>
            <input 
            type="text"
            id="username" 
            {...register("username")} />
            {errors.username && <p>{errors.username.message}</p>}
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input 
            type="password"
            id="password"
            {...register("password")} />
            {errors.password && <p>{errors.password.message}</p>}
          </div>
          
          {apiError && <p className="error">{apiError}</p>}

          <button type="submit" >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </fieldset>
      </form>
      <p>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
};

export default LoginPage;