'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function FeatureHighlightSection() {
  return (
    <main className="flex-1 bg-gradient-to-r from-blue-300 to-white py-24">
      <div className="flex flex-col md:flex-row">
        {/* Left Section */}
        <div
          className="relative bg-cover bg-center md:w-1/2 w-full min-h-[40vh] flex items-center justify-start px-6"
          style={{ backgroundImage: "url(/images/image1.webp)" }}
        >
          <div className="absolute inset-0 bg-white/60 z-0" />
          <div className="relative z-10 text-left max-w-lg">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-gray-700 mb-4">
              How can we help you today?
            </h1>
            <p className="text-base md:text-lg font-semibold text-black leading-relaxed">
              Welcome to the banking group with the largest presence across the Cayman Islands. With more friendly staff and expertise in personal, business, and premier banking, as well as investment services, trust services, and fund management.
              We have the most accessible Customer Service Centres and the widest network of ATMs to offer you banking products and services that are sure to meet your needs.
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div
          className="relative bg-cover bg-center md:w-1/2 w-full min-h-[40vh] flex items-center justify-start px-6"
          style={{ backgroundImage: "url(/images/image2.webp)" }}
        >
          <div className="absolute inset-0 bg-black/40 z-0" />
          <div className="relative z-10 text-left max-w-lg">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-white mb-4">
              Save for the future
            </h3>
            <p className="text-base md:text-lg font-semibold text-white leading-relaxed mb-6">
              Our new deposit accounts give you the freedom, flexibility and peace of mind that you deserve.
            </p>
            <Link href="#services" passHref>
              <Button className="bg-blue-700 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transform hover:scale-105 transition duration-300">
                Save Now
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Centered Text + CTA Buttons */}
      <div className="container mx-auto px-6 text-center mt-16">
        <h2 className="text-5xl font-extrabold text-gray-800 leading-tight mb-6">
          Your Trusted Banking Partner
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Experience Capital Cayman — modern banking with real-time account management, instant transfers, and 24/7 access to your finances.
        </p>
        <div className="flex gap-6 justify-center flex-wrap">
          <Button size="lg" className="bg-indigo-600 text-white hover:bg-indigo-700 px-8 py-4">
            <Link href="/auth/register">Open Account</Link>
          </Button>
          <Button
            variant="outline"
            className="!bg-yellow-400 text-indigo-700 border-yellow-400 hover:bg-yellow-500 px-8 py-4"
          >
            <Link href="/auth/login">Access Account</Link>
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mt-16 px-6 max-w-7xl mx-auto">
        <Card className="bg-amber-100 shadow-lg hover:shadow-2xl hover:bg-amber-200 transition duration-300 rounded-xl p-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-amber-900">
              Capital Cayman Banking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-amber-800">
              Bank-grade security with multi-factor authentication and encrypted transactions.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="bg-sky-100 shadow-lg hover:shadow-2xl hover:bg-sky-200 transition duration-300 rounded-xl p-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-sky-900">
              Real-time Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sky-800">
              Instant notifications and real-time balance updates for all your transactions.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="bg-emerald-100 shadow-lg hover:shadow-2xl hover:bg-emerald-200 transition duration-300 rounded-xl p-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-emerald-900">
              24/7 Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-emerald-800">
              Access your accounts anytime, anywhere with our Capital Cayman online platform.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
