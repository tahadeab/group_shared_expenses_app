import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSubmitting(true);
    void signIn("password", {
      email: email.trim(),
      password,
      ...(flow === "signUp" ? { name: name.trim() } : {}),
    })
      .then(() => {
        toast.success(flow === "signIn" ? "Welcome back!" : "Account created successfully!");
      })
      .catch(() => {
        const toastTitle = flow === "signIn" ? "Sign in failed" : "Sign up failed";
        const toastDesc =
          flow === "signIn"
            ? "Check your email and password, or create a new account."
            : "An account with this email may already exist. Try signing in instead.";
        toast.error(toastTitle, { description: toastDesc });
        setSubmitting(false);
      });
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">
          {flow === "signIn" ? "Welcome back" : "Create your account"}
        </CardTitle>
        <CardDescription>
          {flow === "signIn"
            ? "Sign in to manage your shared expenses"
            : "Start splitting expenses with friends and family"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {flow === "signUp" && (
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required={flow === "signUp"}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={flow === "signIn" ? "current-password" : "new-password"}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Please wait..." : flow === "signIn" ? "Sign in" : "Create account"}
          </Button>
          <div className="text-center text-sm text-gray-600">
            {flow === "signIn" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
            >
              {flow === "signIn" ? "Sign up" : "Sign in"}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
