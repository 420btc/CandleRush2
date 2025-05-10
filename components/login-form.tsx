"use client";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

export function LoginForm({
  className,
  onClose,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { onClose?: () => void }) {
  const { data: session } = useSession();
  const [mode, setMode] = useState<'login'|'signup'>('login');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (message === "¡Usuario creado y sesión iniciada!" || message === "¡Sesión iniciada!") {
      setCountdown(3);
    }
  }, [message]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      if (onClose) {
        onClose();
      } else {
        window.location.reload();
      }
      setCountdown(null);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onClose]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    if (users[username] && users[username].password === password) {
      localStorage.setItem("currentUser", username);
      setMessage("¡Sesión iniciada!");
      setCountdown(3);
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    if (users[username]) {
      setError("El usuario ya existe");
    } else {
      users[username] = { password };
      localStorage.setItem("users", JSON.stringify(users));
      localStorage.setItem("currentUser", username);
      setMessage("¡Usuario creado y sesión iniciada!");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-black text-white border-none shadow-none">
        <CardHeader className="text-white">
          <CardTitle className="text-2xl text-white">{mode === 'login' ? 'Login' : 'Crear cuenta'}</CardTitle>
          <CardDescription className="text-white/80">
            {mode === 'login' ? 'Introduce tu usuario para iniciar sesión' : 'Crea un usuario y contraseña para registrarte'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Tu usuario"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  className="bg-black text-white placeholder-white border-zinc-700"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  {mode === 'login' && (
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  )}
                </div>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-black text-white placeholder-white border-zinc-700" />
              </div>
              {error && <div className="text-red-400 text-xs">{error}</div>}
              {message && (
                <div className="text-green-400 text-xs">
                  {message}
                  {countdown !== null && countdown > 0 && (
                    <span className="ml-2 text-white">Cerrando en {countdown}...</span>
                  )}
                </div>
              )}
              <Button type="submit" className="w-full">
                {mode === 'login' ? 'Login' : 'Crear cuenta'}
              </Button>
              {mode === 'login' && (
  <>
    {session?.user ? (
      <Button
        variant="outline"
        className="w-full"
        type="button"
        onClick={() => {
          signOut();
          localStorage.removeItem('googleLoginReloaded');
          setTimeout(() => window.location.reload(), 250);
        }}
      >
        Logout Google
      </Button>
    ) : (
      <Button
        variant="outline"
        className="w-full"
        type="button"
        onClick={() => {
          // @ts-ignore
          import('next-auth/react').then(({ signIn }) => signIn('google'));
        }}
      >
        Login with Google
      </Button>
    )}
  </>
)}
            </div>
            <div className="mt-4 text-center text-sm">
              {mode === 'login' ? (
                <>
                  ¿No tienes cuenta?{' '}
                  <a
                    href="#"
                    className="underline underline-offset-4 cursor-pointer"
                    onClick={e => { e.preventDefault(); setMode('signup'); setError(""); setMessage(""); }}
                  >
                    Crear cuenta
                  </a>
                </>
              ) : (
                <>
                  ¿Ya tienes cuenta?{' '}
                  <a
                    href="#"
                    className="underline underline-offset-4 cursor-pointer"
                    onClick={e => { e.preventDefault(); setMode('login'); setError(""); setMessage(""); }}
                  >
                    Iniciar sesión
                  </a>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
