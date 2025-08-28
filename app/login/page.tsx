"use client";
export const dynamic = "force-dynamic";
import type React from "react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import NativeLogo from "./native.png";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
}

type NativeUser = {
  id: number;
  created_at: string;
  fname: string;
  lname: string;
  email: string;
  phone: string;
  nic: string | null;
  amount: string | number | null;
  card_url: string | null;
  password: string; // plaintext in your current table
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errEmail, setErrEmail] = useState<string | null>(null);
  const [errPassword, setErrPassword] = useState<string | null>(null);
  const [errForm, setErrForm] = useState<string | null>(null);

  const emailRegex = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);

  const validate = () => {
    let ok = true;
    setErrEmail(null);
    setErrPassword(null);
    setErrForm(null);

    const e = email.trim().toLowerCase();
    if (!e) {
      setErrEmail("Email is required.");
      ok = false;
    } else if (!emailRegex.test(e)) {
      setErrEmail("Enter a valid email address.");
      ok = false;
    }

    if (!password.trim()) {
      setErrPassword("Password is required.");
      ok = false;
    }

    return ok;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
      setErrForm(
        "App configuration missing. Please try again later."
      );
      return;
    }

    setIsLoading(true);
    try {
      const eLower = email.trim().toLowerCase();

      // 1) Get user by email
      const { data, error } = await supabase
        .from("native_users")
        .select("*")
        .eq("email", eLower)
        .limit(1)
        .maybeSingle<NativeUser>();

      if (error) {
        setErrForm("Something went wrong. Please try again.");
        return;
      }

      if (!data) {
        setErrForm("No account found with this email.");
        return;
      }

      // 2) Compare password (plaintext in your current table)
      if (data.password !== password) {
        setErrForm("Incorrect password.");
        return;
      }

      // 3) Success: store minimal session + redirect
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", data.email);
      localStorage.setItem(
        "native_user",
        JSON.stringify({
          id: data.id,
          fname: data.fname,
          lname: data.lname,
          email: data.email,
          card_url: data.card_url,
        })
      );

      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Welcome to
          </CardTitle>

          <ClientOnly>
            <Image
              src={NativeLogo}
              alt="App Logo"
              width={120}
              height={120}
              className="mx-auto h-28 w-28 object-contain"
              priority
            />
          </ClientOnly>

          <CardDescription className="text-muted-foreground">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrEmail(null);
                }}
                required
                className={`h-12 rounded-xl border bg-background/50 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                  errEmail ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errEmail && (
                <p className="text-xs text-red-500 mt-1">{errEmail}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrPassword(null);
                  }}
                  required
                  className={`h-12 rounded-xl border bg-background/50 pr-12 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    errPassword ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errPassword && (
                <p className="text-xs text-red-500 mt-1">{errPassword}</p>
              )}
            </div>

            {errForm && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                {errForm}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              onClick={() => router.push("/change-password")}
            >
              Need to change your password?
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
