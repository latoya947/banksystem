"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    address: "",
  })
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push("/auth/login")
        return
      }

      setUser(user)

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          address: profileData.address || "",
        })
      }

      setIsLoading(false)
    }

    loadProfile()
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSaving(true)
    setMessage(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      setMessage({ type: "success", text: "Profile updated successfully!" })
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update profile",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 shadow-md animate-fade-slide">
  <div className="container mx-auto px-4 py-4 flex items-center justify-between">

    {/* Logo + Page Badge */}
    <div className="flex items-center gap-4">
      {/* Stylized Logo */}
      <div
        className="flex items-center space-x-3 cursor-pointer select-none transition-transform duration-300 hover:scale-105"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-yellow-400 animate-pulse"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span className="text-2xl font-extrabold tracking-tight uppercase font-sans text-yellow-400 drop-shadow">
          Capital
        </span>
        <span className="text-2xl font-light tracking-widest uppercase font-serif text-white drop-shadow">
          Cayman
        </span>
        <span className="text-2xl font-extrabold tracking-tight uppercase font-sans text-yellow-400 drop-shadow">
          Bank
        </span>
      </div>

      {/* Page Badge */}
      <Badge
        variant="secondary"
        className="bg-white text-blue-900 animate-fade-slide animate-delay-100"
      >
        Profile Settings
      </Badge>
    </div>

    {/* Styled & Animated Button */}
    <Button
      variant="outline"
      className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 border-yellow-400 font-semibold transition-all duration-300"
      asChild
    >
      <Link href="/dashboard">Back to Dashboard</Link>
    </Button>
  </div>
</header>


      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="max-w-lg mx-auto bg-white shadow-lg rounded-lg border-yellow-400 border-2">
  <CardHeader>
    <CardTitle className="text-2xl font-bold text-blue-900">Profile Information</CardTitle>
    <CardDescription className="text-yellow-600">
      Update your personal information and contact details
    </CardDescription>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid gap-2">
        <Label htmlFor="email" className="text-blue-700 font-semibold">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={user?.email || ""}
          disabled
          className="bg-blue-100 text-blue-800 border border-blue-300"
        />
        <p className="text-sm text-yellow-700">Email cannot be changed</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="fullName" className="text-blue-700 font-semibold">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          value={profile.full_name}
          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
          placeholder="Enter your full name"
          className="border border-blue-300 focus:ring-yellow-400 focus:border-yellow-400"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phone" className="text-blue-700 font-semibold">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={profile.phone}
          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
          placeholder="+1 (555) 123-4567"
          className="border border-blue-300 focus:ring-yellow-400 focus:border-yellow-400"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="address" className="text-blue-700 font-semibold">Address</Label>
        <Input
          id="address"
          type="text"
          value={profile.address}
          onChange={(e) => setProfile({ ...profile, address: e.target.value })}
          placeholder="123 Main St, City, State, ZIP"
          className="border border-blue-300 focus:ring-yellow-400 focus:border-yellow-400"
        />
      </div>

      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold px-5 py-2 rounded-lg transition duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>

        <Button
          type="button"
          variant="outline"
          asChild
          className="border-yellow-400 text-yellow-600 hover:bg-yellow-100 hover:text-yellow-700 transition rounded-lg px-5 py-2 font-semibold"
        >
          <Link href="/dashboard">Cancel</Link>
        </Button>
      </div>
    </form>
  </CardContent>
</Card>

<div className="min-h-screen bg-blue-50 py-10 px-4">
  {/* Your card goes here */}
</div>

      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-3 text-sm md:text-xs">
 {/* Reduced from py-6 to py-3 */}
  <div className="container mx-auto text-center">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-400"> {/* Smaller text & tighter gap */}
      <div>
        <h3 className="font-semibold text-white text-sm">Company</h3>
        <ul>
          <li><a href="/about-us" className="hover:text-blue-400 transition duration-300">About Us</a></li>
          <li><a href="/careers" className="hover:text-blue-400 transition duration-300">Careers</a></li>
          <li><a href="/help-support" className="hover:text-blue-400 transition duration-300">Help & Support</a></li>
        </ul>
      </div>
      <div>
        <h3 className="font-semibold text-white text-sm">Security</h3>
        <ul>
          <li><a href="/security" className="hover:text-blue-400 transition duration-300">Security</a></li>
          <li><a href="/terms-of-service" className="hover:text-blue-400 transition duration-300">Terms of Service</a></li>
        </ul>
      </div>
      <div>
        <h3 className="font-semibold text-white text-sm">Legal</h3>
        <ul>
          <li><a href="/legal" className="hover:text-blue-400 transition duration-300">Legal</a></li>
          <li><a href="/cookies-notice" className="hover:text-blue-400 transition duration-300">Cookies Notice</a></li>
        </ul>
      </div>
      <div>
        <h3 className="font-semibold text-white text-sm">Privacy</h3>
        <ul>
          <li><a href="/privacy-notice" className="hover:text-blue-400 transition duration-300">Privacy Notice</a></li>
          <li><a href="/terms-and-conditions" className="hover:text-blue-400 transition duration-300">Terms and Conditions</a></li>
        </ul>
      </div>
    </div>

    <div className="mt-4"> {/* Reduced from mt-6 */}
      <p className="text-xs text-gray-400">
        &copy; 2024 Capital Cayman. All rights reserved.
      </p>
      <p className="text-xs text-gray-400">
        Capital Cayman Bank Ltd. and Capital Cayman Securities Ltd. are licensed and regulated by the Cayman Islands Monetary Authority.
      </p>
    </div>

    {/* Social Media Icons */}
    <div className="mt-2 flex justify-center space-x-4"> {/* Smaller margin and tighter spacing */}
      <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
        <img src="/images/facebook.png" alt="Facebook" className="w-6 h-6 hover:opacity-80 transition duration-300" /> {/* Reduced size */}
      </a>
      <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
        <img src="/images/x-logo-50.png" alt="Twitter" className="w-6 h-6 hover:opacity-80 transition duration-300" />
      </a>
      <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
        <img src="/images/instagram.webp" alt="Instagram" className="w-6 h-6 hover:opacity-80 transition duration-300" />
      </a>
    </div>
  </div>
</footer>
    </div>
  )
}
