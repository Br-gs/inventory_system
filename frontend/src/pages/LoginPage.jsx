import { useContext, useState } from "react";
import AuthContext from "../context/authContext";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Log In</CardTitle>
          <CardDescription>Enter your credentials to access the system.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input 
              type="text"
              id="username"
              disabled={isSubmitting}
              {...register("username")} />
              {errors.username && <p className="text-xs text-red-600 mt-1">{errors.username.message}</p>}
            </div>
            <div className="grid gap-2">
              <label htmlFor="password">Password</label>
              <input 
              type="password"
              id="password"
              disabled={isSubmitting}
              {...register("password")} />
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
            </div>
            
            {apiError && <p className="text-sm text-red-600 text-center">{apiError}</p>}
          </CardContent>

          <CardFooter className="flex flex-col">
            <button className="w-full" type="submit" disabled={isSubmitting} >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
        
            <p className="mt-4 text-center text-sm text-gray-600">
              Don't have an account? <Link to="/register" className="underline hover:text-blue-600">Register here</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;