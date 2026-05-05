import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/LoadingScreen";

const signInSchema = Yup.object({
  email: Yup.string().trim().email("Invalid email").required("Email required"),
  password: Yup.string().min(6, "At least 6 characters").required("Password required"),
});
const signUpSchema = signInSchema.shape({
  display_name: Yup.string().trim().min(2, "At least 2 characters").max(40).required("Name required"),
});

export default function Auth() {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<"signin" | "signup">(params.get("mode") === "signup" ? "signup" : "signin");
  const [showPassword, setShowPassword] = useState(false);

  if (loading) return <LoadingScreen />;

  if (user) {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";
    return <Navigate to={from} replace />;
  }

  const isSignup = mode === "signup";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-subtle">
      <header className="flex items-center justify-between px-6 h-16">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Loopback Logo" className="size-8 object-contain" />
          <span className="font-serif-display text-xl">Loopback</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md animate-scale-in">
          <div className="bg-card border border-border rounded-2xl shadow-floating p-8">
            <h1 className="font-serif-display text-3xl mb-1">{isSignup ? "Create your account" : "Welcome back"}</h1>
            <p className="text-sm text-muted-foreground mb-6">
              {isSignup ? "Start collecting product feedback in seconds." : "Sign in to your workspace."}
            </p>

            <Formik
              key={mode}
              initialValues={{ email: "", password: "", display_name: "" }}
              validationSchema={isSignup ? signUpSchema : signInSchema}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  if (isSignup) {
                    const { error } = await supabase.auth.signUp({
                      email: values.email,
                      password: values.password,
                      options: {
                        emailRedirectTo: `${window.location.origin}/dashboard`,
                        data: { display_name: values.display_name },
                      },
                    });
                    if (error) throw error;
                    toast.success("Welcome aboard!");
                    navigate("/dashboard", { replace: true });
                  } else {
                    const { error } = await supabase.auth.signInWithPassword({
                      email: values.email,
                      password: values.password,
                    });
                    if (error) throw error;
                    toast.success("Signed in");
                    navigate("/dashboard", { replace: true });
                  }
                } catch (e) {
                  const msg = e instanceof Error ? e.message : "Something went wrong";
                  toast.error(msg);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-4">
                  {isSignup && (
                    <Field name="display_name">
                      {({ field }: any) => (
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium" htmlFor="display_name">Name</label>
                          <input
                            {...field}
                            id="display_name"
                            placeholder="Ada Lovelace"
                            className={cn(
                              "w-full px-3 py-2.5 rounded-lg border bg-background text-sm transition-base",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              errors.display_name && touched.display_name ? "border-destructive" : "border-input"
                            )}
                          />
                          <ErrorMessage name="display_name" component="p" className="text-xs text-destructive" />
                        </div>
                      )}
                    </Field>
                  )}

                  <Field name="email">
                    {({ field }: any) => (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium" htmlFor="email">Email</label>
                        <input
                          {...field}
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@company.com"
                          className={cn(
                            "w-full px-3 py-2.5 rounded-lg border bg-background text-sm transition-base",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            errors.email && touched.email ? "border-destructive" : "border-input"
                          )}
                        />
                        <ErrorMessage name="email" component="p" className="text-xs text-destructive" />
                      </div>
                    )}
                  </Field>

                  <Field name="password">
                    {({ field }: any) => (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium" htmlFor="password">Password</label>
                        <div className="relative">
                          <input
                            {...field}
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete={isSignup ? "new-password" : "current-password"}
                            placeholder="••••••••"
                            className={cn(
                              "w-full px-3 py-2.5 rounded-lg border bg-background text-sm transition-base pr-10",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              errors.password && touched.password ? "border-destructive" : "border-input"
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </button>
                        </div>
                        <ErrorMessage name="password" component="p" className="text-xs text-destructive" />
                      </div>
                    )}
                  </Field>

                  <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                    {isSubmitting ? (
                      <><Loader2 className="size-4 mr-2 animate-spin" /> {isSignup ? "Creating account…" : "Signing in…"}</>
                    ) : (isSignup ? "Create account" : "Sign in")}
                  </Button>
                </Form>
              )}
            </Formik>

            <p className="text-sm text-muted-foreground text-center mt-6">
              {isSignup ? "Already have an account?" : "New here?"}{" "}
              <button
                onClick={() => setMode(isSignup ? "signin" : "signup")}
                className="text-foreground font-medium hover:underline underline-offset-4"
              >
                {isSignup ? "Sign in" : "Create one"}
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
