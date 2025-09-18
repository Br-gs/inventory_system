import { useContext, useState } from "react";
import AuthContext from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const LoginPage = () => {
  const { loginUser, error: apiError } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
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
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Log In</CardTitle>
          <CardDescription>Enter your credentials to access the system.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="on">
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                type="text"
                id="username"
                disabled={isSubmitting}
                autoComplete="username"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="Enter your username"
                {...register("username")}
              />
              {errors.username && (
                <p className="text-xs text-red-600 mt-1" role="alert">
                  {errors.username.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                type="password"
                id="password"
                disabled={isSubmitting}
                autoComplete="current-password"
                placeholder="Enter password (min 8 characters)"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-600 mt-1" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>
            
            {apiError && (
              <p className="text-sm text-red-600 text-center" role="alert">
                {apiError}
              </p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button 
              className="w-full" 
              type="submit" 
              disabled={isSubmitting}
              aria-describedby={isSubmitting ? "login-loading" : undefined}
            >
              {isSubmitting ? (
                <>
                  <span className="sr-only" id="login-loading">Loading</span>
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
        
            {/* Registration removed - only admins can create users */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Contact your administrator if you need access to the system.
              </AlertDescription>
            </Alert>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;