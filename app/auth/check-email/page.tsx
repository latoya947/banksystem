import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-6 md:p-10">
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
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="shadow-lg rounded-xl bg-white border border-gray-200">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-semibold text-indigo-900">Check Your Email</CardTitle>
              <CardDescription className="text-base text-indigo-700">We&apos;ve sent you a confirmation link</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-sm text-gray-600">
                Please check your email and click the confirmation link to activate your SecureBank account.
              </p>
              <p className="text-sm text-gray-600">Once confirmed, you can sign in to access your dashboard.</p>
              <Button 
                asChild 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <Link href="/auth/login">Back to Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
