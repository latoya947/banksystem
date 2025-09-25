"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { createClient } from "@/lib/supabase/client"
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

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            phone: phone,
            address: address,
            role: "user",
          },
        },
      })
      if (error) throw error
      router.push("/auth/check-email")
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "An error occurred"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-cover bg-gray-500 bg-center bg-no-repeat flex flex-col"
      style={{ backgroundImage: "url('/images/slider1.png')" }}
    >
      {/* Header with Logo */}
  <header className="relative bg-gradient-to-r from-indigo-700 to-indigo-700 shadow-md min-h-[100px]">
  <div className="container mx-auto px-6 py-3 flex justify-between items-center">
    {/* Left: Logo Section */}
    <div className="flex items-center space-x-3 select-none cursor-pointer">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-yellow-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      <span className="text-xl font-extrabold tracking-tight uppercase font-sans text-yellow-400 drop-shadow">
        Capital
      </span>
      <span className="text-xl font-light tracking-widest uppercase font-serif text-white drop-shadow">
        Cayman
      </span>
      <span className="text-xl font-extrabold tracking-tight uppercase font-sans text-yellow-400 drop-shadow">
        Bank
      </span>
    </div>

    {/* Right: Buttons */}
    <div className="flex gap-4">
      <Link href="/auth/login">
        <button className="bg-yellow-400 text-indigo-700 hover:bg-yellow-500 font-semibold px-4 py-2 rounded transition duration-300">
          Sign In
        </button>
      </Link>
      <Link href="/auth/register">
        <button className="bg-indigo-600 text-white hover:bg-indigo-700 font-semibold px-4 py-2 rounded transition duration-300">
          Get Started
        </button>
      </Link>
    </div>
  </div>
</header>


      {/* Form Container */}
      <div className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="rounded-xl shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <h1 className="text-3xl font-extrabold text-blue-700 mb-2">
                Create Your Account
              </h1>
              <p className="text-base font-medium text-gray-800">
                Join{" "}
                <span className="text-yellow-500 font-semibold">Capital</span>
                <span className="text-blue-600 font-semibold">Cayman Bank</span>{" "}
                and manage your finances with ease
              </p>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName" className="text-gray-700 font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="rounded-md border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-md border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone" className="text-gray-700 font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-md border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address" className="text-gray-700 font-medium">
                    Address
                  </Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="123 Main St, City, State"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="rounded-md border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-md border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-md border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition duration-300"
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>

                <div className="mt-4 text-center text-sm text-gray-700">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="underline underline-offset-4 text-blue-600 hover:text-blue-800"
                  >
                    Sign in here
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
