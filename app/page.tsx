'use client' // ✅ Must come first

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import FeatureHighlightSection from "@/components/FeatureHighlightSection"
import Link from "next/link"
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import Image from 'next/image'

// Swiper styles are already imported globally in layout.tsx


export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="relative bg-gradient-to-r from-indigo-700 to-indigo-700 shadow-md min-h-[100px]">
        {/* Header Content */}
        <div className="container mx-auto px-6 py-3 relative z-10 flex justify-between items-center">
          {/* Capital Cayman Logo on the Left */}
          <div className="flex flex-col items-start space-y-1">
  {/* Logo Title */}
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
    <span className="text-2xl font-extrabold tracking-tight uppercase font-sans drop-shadow-lg text-yellow-400">
      Capital
    </span>
    <span className="text-2xl font-light tracking-widest uppercase font-serif drop-shadow-md text-white">
      Cayman
    </span>
    <span className="text-xl font-extrabold tracking-tight uppercase font-sans drop-shadow-lg text-yellow-400">
      Bank
    </span>
  </h1>

  {/* 🔽 New Slogan */}
  <div className="ml-2 text-white text-base m:text-lg italic font-small tracking-wide drop-shadow-sm">
    Powering Global Finance.
  </div>

  {/* 🔽 Existing Navigation Text */}
  <div className="ml-2 text-white 700 text-sm sm:text-base font-semibold tracking-wide hidden sm:block">
    Personal &nbsp; Premier &nbsp; Business &nbsp; Investing
  </div>
</div>


          {/* Buttons on the Right */}
          <div className="flex gap-4">
            <Button className="bg-yellow-400 text-indigo-700 hover:bg-yellow-500 transition duration-300 ease-in-out">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button className="bg-indigo-600 text-white hover:bg-indigo-700 transition duration-300 ease-in-out">
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

<section className="relative w-full h-[400px] overflow-hidden">
  {/* Swiper Slider */}
  <Swiper
  modules={[Autoplay, Pagination, Navigation]}
  autoplay={{
    delay: 3000, // 5 seconds between slides (default is 3000ms)
    disableOnInteraction: false,
  }}
  speed={2000} // 1 second transition animation (default is 300ms)
  loop={true}
  pagination={{ clickable: true }}
  navigation={true}
  className="w-full h-full"
>
    {['/images/slider1.png', '/images/slider2.jpg', '/images/slider3.jpg'].map((src, idx) => (
      <SwiperSlide key={idx}>
        <div className="w-full h-full relative">
          <Image
            src={src}
            alt={`Slide ${idx + 1}`}
            fill
            className="object-cover"
            priority={idx === 0}
          />
        </div>
      </SwiperSlide>
    ))}
  </Swiper>

  {/* Overlay Text */}
  <div className="absolute inset-0 z-11 flex items-center justify-center text-center px-6 py-4 bg-black/20">
    <div className="text-white max-w-3xl">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-2 sm:mb-4">
        Capital Cayman Bank Your Premier Offshore Financial Partner
      </h2>
      <p className="text-sm sm:text-base md:text-lg leading-relaxed mb-3 sm:mb-4">
        Capital Cayman Bank is a premier offshore financial institution at the forefront of international banking. Strategically located in the Cayman Islands, we specialize in offering secure and discreet offshore accounts and tailored financial solutions for high-net-worth individuals, global entrepreneurs, and international corporations.
      </p>
      <p className="text-sm sm:text-base md:text-lg leading-relaxed mb-3 sm:mb-4">
        Our commitment to trust, security, and global accessibility allows clients to manage and protect their wealth with complete confidence. Whether you're diversifying assets, expanding internationally, or seeking financial privacy, Capital Cayman Bank delivers world-class service with unmatched expertise.
      </p>
    </div>
  </div>
</section>

      {/* Hero Section */}
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
