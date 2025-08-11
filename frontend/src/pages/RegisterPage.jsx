import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import authService from "../api/authService";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Enter your details to register.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">User</Label>
              <Input id="username" type="text" {...register("username")} />
              {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password2">Confirm Password</Label>
              <Input id="password2" type="password" {...register("password2")} />
              {errors.password2 && <p className="text-xs text-red-500 mt-1">{errors.password2.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </Button>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
            </p>
              <Link to="/login" className="underline hover:text-primary">
                Log In
              </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
    );
};

export default RegisterPage;
