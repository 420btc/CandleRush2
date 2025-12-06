"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useSession } from "next-auth/react"

interface User {
  id: string
  username: string
  email: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    console.log('[DEBUG AUTH] Iniciando AuthProvider useEffect');
    console.log('[DEBUG AUTH] Sesión de NextAuth:', session);
    
    // Si hay una sesión de Google activa, crear usuario basado en ella
    if (session?.user) {
      const googleUser = {
        id: session.user.email || "google-" + Math.random().toString(36).substring(2, 9),
        username: session.user.name || "Usuario Google",
        email: session.user.email || "google@example.com",
      }
      console.log('[DEBUG AUTH] Creando usuario desde sesión Google:', googleUser);
      setUser(googleUser)
      localStorage.setItem("user", JSON.stringify(googleUser))
      setIsLoading(false)
      return
    }
    
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem("user")
    console.log('[DEBUG AUTH] Usuario guardado en localStorage:', savedUser);
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('[DEBUG AUTH] Usuario parseado:', parsedUser);
        setUser(parsedUser)
      } catch (error) {
        console.error("Error parsing saved user:", error)
        localStorage.removeItem("user")
      }
    }

    // Create a guest user if none exists
    if (!savedUser) {
      const guestUser = {
        id: "guest-" + Math.random().toString(36).substring(2, 9),
        username: "Invitado",
        email: "guest@example.com",
      }
      console.log('[DEBUG AUTH] Creando usuario invitado:', guestUser);
      setUser(guestUser)
      localStorage.setItem("user", JSON.stringify(guestUser))
    }

    setIsLoading(false)
    console.log('[DEBUG AUTH] AuthProvider inicializado, isLoading: false');
  }, [session])

  const login = async (email: string, password: string) => {
    setIsLoading(true)

    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll just simulate a login
      const mockUser = {
        id: "user-" + Math.random().toString(36).substring(2, 9),
        username: email.split("@")[0],
        email,
      }

      setUser(mockUser)
      localStorage.setItem("user", JSON.stringify(mockUser))
    } catch (error) {
      console.error("Login error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")

    // Create a new guest user
    const guestUser = {
      id: "guest-" + Math.random().toString(36).substring(2, 9),
      username: "Invitado",
      email: "guest@example.com",
    }
    setUser(guestUser)
    localStorage.setItem("user", JSON.stringify(guestUser))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
