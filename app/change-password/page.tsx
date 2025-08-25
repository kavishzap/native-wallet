"use client";

import type React from "react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import NativeLogo from "../login/native.png";
import { supabase } from "@/lib/supabaseClient";

type NativeUser = {
  id: number;
  email: string;
  password: string; // plaintext in your current schema
};

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Simple email regex
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const emailLower = email.trim().toLowerCase();
    const oldPwd = oldPassword.trim();
    const newPwd = newPassword.trim();
    const confirmPwd = confirmPassword.trim();

    // Client-side validation
    if (!emailLower || !isValidEmail(emailLower)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!oldPwd) {
      setError("Current password is required.");
      return;
    }
    if (!newPwd) {
      setError("New password is required.");
      return;
    }
    if (newPwd.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setError("New passwords do not match.");
      return;
    }
    if (newPwd === oldPwd) {
      setError("New password must be different from the current password.");
      return;
    }

    setIsLoading(true);
    try {
      // 1) Fetch user by email
      const { data: user, error: fetchErr } = await supabase
        .from("native_users")
        .select("id,email,password")
        .eq("email", emailLower)
        .limit(1)
        .maybeSingle<NativeUser>();

      if (fetchErr) {
        setError("Something went wrong while fetching your account. Please try again.");
        return;
      }
      if (!user) {
        setError("No account found with this email.");
        return;
      }

      // 2) Check old password
      if (user.password !== oldPwd) {
        setError("Current password is incorrect.");
        return;
      }

      // 3) Update to new password
      const { error: updErr } = await supabase
        .from("native_users")
        .update({ password: newPwd })
        .eq("id", user.id);

      if (updErr) {
        setError("Failed to update password. Please try again.");
        return;
      }

      // 4) Show success UI and redirect
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1800);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-8">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">Password Changed!</h2>
              <p className="text-muted-foreground">
                Your password has been successfully updated. Redirecting to login...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md shadow-xl border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="flex items-center gap-2 justify-start">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-1 h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>

          <CardTitle className="text-3xl font-bold tracking-tight">
            Change Password
          </CardTitle>

          {/* Match the login header with a logo (client-only to avoid hydration edge cases) */}
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
            Update your account password
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert className="mb-6 border-destructive/50 bg-destructive/10">
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}

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
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border border-gray-300 bg-background/50 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oldPassword" className="text-sm font-medium">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="oldPassword"
                  type={showOldPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border border-gray-300 bg-background/50 pr-12 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowOldPassword((v) => !v)}
                  aria-label={showOldPassword ? "Hide password" : "Show password"}
                >
                  {showOldPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border border-gray-300 bg-background/50 pr-12 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowNewPassword((v) => !v)}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border border-gray-300 bg-background/50 pr-12 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70"
              disabled={isLoading}
            >
              {isLoading ? "Updating Password..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
