"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen [bg-blue-900]">
      {/* Header with Logo */}
      <header className="absolute top-0 left-0 w-full bg-transparent p-4 z-10">
        <div className="flex items-center">
          {/* Capital Cayman Logo */}
          <h1 className="flex items-center space-x-3 cursor-pointer select-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-indigo-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-4xl font-extrabold tracking-tight uppercase font-sans text-yellow-400">
              Capital
            </span>
            <span className="text-4xl font-light tracking-widest uppercase font-serif text-indigo-900">
              Cayman
            </span>
            <span className="text-3xl font-extrabold tracking-tight uppercase font-sans drop-shadow-lg text-yellow-400">
                  Bank
                </span>
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex min-h-screen w-full items-center justify-center bg-cover bg-center p-6 md:p-10" style={{ backgroundImage: "url('/images/slider1.png')" }}>
        <div className="w-full max-w-sm px-4 animate-fade-slide">
          <Card className="rounded-2xl shadow-2xl bg-gray-400">
            <CardHeader className="text-center mb-2">
              <div className="flex items-center justify-center gap-2 cursor-pointer select-none mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-indigo-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-3xl font-extrabold tracking-tight uppercase font-sans drop-shadow-lg text-yellow-400">
                  Capital
                </span>
                <span className="text-3xl font-light tracking-widest uppercase font-serif drop-shadow-md text-indigo-900">
                  Cayman
                </span>
              </div>
              <CardDescription className="text-[15px] text-indigo-800 font-medium leading-snug tracking-tight">
                Sign in to your Capital Cayman Bank account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 bg-indigo-50 text-indigo-900 rounded-md"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-white">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 bg-indigo-50 text-indigo-900 rounded-md"
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-600 bg-red-100 p-3 rounded-md border border-red-300">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-semibold transition duration-300 rounded-md py-2"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
                <div className="mt-4 text-center text-sm text-indigo-500">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/auth/register"
                    className="underline underline-offset-4 text-indigo-600 hover:text-indigo-600 transition"
                  >
                    Register here
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 ">
        <div className="container mx-auto text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400">
            <div>
              <h3 className="font-semibold text-white">Company</h3>
              <ul>
                <li><a href="/about-us" className="hover:text-blue-400 transition duration-300">About Us</a></li>
                <li><a href="/careers" className="hover:text-blue-400 transition duration-300">Careers</a></li>
                <li><a href="/help-support" className="hover:text-blue-400 transition duration-300">Help & Support</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white">Security</h3>
              <ul>
                <li><a href="/security" className="hover:text-blue-400 transition duration-300">Security</a></li>
                <li><a href="/terms-of-service" className="hover:text-blue-400 transition duration-300">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white">Legal</h3>
              <ul>
                <li><a href="/legal" className="hover:text-blue-400 transition duration-300">Legal</a></li>
                <li><a href="/cookies-notice" className="hover:text-blue-400 transition duration-300">Cookies Notice</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white">Privacy</h3>
              <ul>
                <li><a href="/privacy-notice" className="hover:text-blue-400 transition duration-300">Privacy Notice</a></li>
                <li><a href="/terms-and-conditions" className="hover:text-blue-400 transition duration-300">Terms and Conditions</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-400">
              &copy; 2024 Capital Cayman. All rights reserved.
            </p>
            <p className="text-sm text-gray-400">Capital Cayman Bank Ltd. and Capital Cayman Securities Ltd. are licensed and regulated by the Cayman Islands Monetary Authority.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
