"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { OtpVerificationModal } from "@/components/otp-verification-modal"

export default function WithdrawPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [bankName, setBankName] = useState("")
  const [bankAddress, setBankAddress] = useState("")
  const [routingNumber, setRoutingNumber] = useState("")
  const [destinationAccountNumber, setDestinationAccountNumber] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState("")
  const [showVatModal, setShowVatModal] = useState(false)
  const [vatInput, setVatInput] = useState("")
  const [showCotModal, setShowCotModal] = useState(false)
  const [cotInput, setCotInput] = useState("")
  const router = useRouter()

  useEffect(() => {
    const loadAccounts = async () => {
      const supabase = createClient()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push("/auth/login")
        return
      }

      const { data: accountsData, error: accountsError } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })

      if (accountsData) {
        setAccounts(accountsData)
        if (accountsData.length > 0) {
          setSelectedAccount(accountsData[0].id)
        }
      }

      setIsLoading(false)
    }

    loadAccounts()
  }, [router])

  const proceedWithdraw = async () => {
    const supabase = createClient()

    try {
      // Compose rich description including bank details
      const bankDetails = `Bank: ${bankName}; Address: ${bankAddress}; Routing: ${routingNumber}; Account: ${destinationAccountNumber}`
      const fullDescription = description
        ? `${description} | ${bankDetails}`
        : `Withdrawal to external bank | ${bankDetails}`

      const { data, error } = await supabase.rpc("create_pending_transaction", {
        p_account_id: selectedAccount,
        p_amount: -Number.parseFloat(amount),
        p_transaction_type: "withdrawal",
        p_description: fullDescription,
      })

      if (error) throw error

      const result = typeof data === "string" ? JSON.parse(data) : data

      if (result.status === "completed") {
        const selectedAccountData = accounts.find(acc => acc.id === selectedAccount)
        const successUrl = `/dashboard/withdraw/success?amount=${Number.parseFloat(amount)}&account=${selectedAccountData?.account_number}&transactionId=${result.transaction_id || 'completed'}`
        router.push(successUrl)
        return
      } else if (result.status === "requires_otp") {
        setPendingTransactionId(result.pending_id)
        setShowOtpModal(true)
        setMessage({
          type: "info",
          text: `OTP verification required. Code: ${result.otp_code} (expires in 10 minutes)`,
        })
      } else if (result.status === "pending_approval") {
        setMessage({
          type: "info",
          text: "Transaction submitted for admin approval due to amount or daily limits.",
        })
        setAmount("")
        setDescription("")
        setBankName("")
        setBankAddress("")
        setRoutingNumber("")
        setDestinationAccountNumber("")
      } else {
        throw new Error(result.message || "Transaction failed")
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to process withdrawal",
      })
    } finally {
      setIsSubmitting(false)
      setShowVatModal(false)
      setShowCotModal(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccount || !amount) return

    const withdrawAmount = Number.parseFloat(amount)
    if (withdrawAmount <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount" })
      return
    }

    // basic validation for new fields
    if (!bankName || !bankAddress || !routingNumber || !destinationAccountNumber) {
      setMessage({ type: "error", text: "Please fill in all bank details" })
      return
    }

    setIsSubmitting(true)
    setMessage(null)
    // Start VAT step
    setShowVatModal(true)
  }

  const refreshAccounts = async () => {
    const supabase = createClient()
    const { data: updatedAccounts } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
      .order("created_at", { ascending: true })

    if (updatedAccounts) {
      setAccounts(updatedAccounts)
    }
  }

  const handleOtpVerification = async (otpInput: string) => {
    if (!pendingTransactionId) return

    const supabase = createClient()

    try {
      const { data, error } = await supabase.rpc("verify_otp_and_complete", {
        p_pending_id: pendingTransactionId,
        p_otp_code: otpInput,
      })

      if (error) throw error

      const result = typeof data === "string" ? JSON.parse(data) : data

      if (result.status === "completed") {
        // Redirect to success page with transaction details
        const selectedAccountData = accounts.find(acc => acc.id === selectedAccount)
        const successUrl = `/dashboard/withdraw/success?amount=${Math.abs(parseFloat(amount))}&account=${selectedAccountData?.account_number}&transactionId=${result.transaction_id || 'completed'}`
        router.push(successUrl)
        return
      } else {
        throw new Error(result.message || "OTP verification failed")
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "OTP verification failed",
      })
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
      <header className="bg-blue-900 shadow-md">
  <div className="container mx-auto px-4 py-4 flex items-center justify-between">
    
    {/* Logo and Badge */}
    <div className="flex items-center gap-4">
      {/* Modern Logo */}
      <div className="flex items-center space-x-3 cursor-pointer select-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-indigo-300"
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
      </div>

      {/* Page Badge */}
      <Badge variant="secondary" className="bg-white text-blue-900">
        Withdraw Money
      </Badge>
    </div>

    {/* Back Button */}
    <Button variant="outline" className="border-white text-blue-900 bg-yellow-400 hover:bg-white/10 transition" asChild>
      <Link href="/dashboard">Back to Dashboard</Link>
    </Button>
  </div>
</header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
       <Card className="bg-blue-900 text-white shadow-xl border-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-yellow-400">Withdraw Money</CardTitle>
    <CardDescription className="text-blue-100">Withdraw funds from your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="account" className="text-white">Select Account</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="bg-white text-blue-900 focus:ring-yellow-400">
            <SelectValue placeholder="Choose an account" />
          </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_number}
                        (${Number.parseFloat(account.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                 className="bg-white text-blue-900"
        />
                {selectedAccount && (
                  <p className="text-sm text-blue-100">
                    Available: $
                    {Number.parseFloat(
                      accounts.find((acc) => acc.id === selectedAccount)?.balance || "0",
                    ).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-white">Description (Optional)</Label>
                <Input
                  id="description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., ATM withdrawal, Cash for groceries"
                className="bg-white text-blue-900"
        />
              </div>

              {/* Bank Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bankName" className="text-white">Bank Name</Label>
                  <Input
                    id="bankName"
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g., Chase Bank"
                    required
                    className="bg-white text-blue-900"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bankAddress"className="text-white">Bank Address</Label>
                  <Input
                    id="bankAddress"
                    type="text"
                    value={bankAddress}
                    onChange={(e) => setBankAddress(e.target.value)}
                    placeholder="e.g., 123 Main St, NY"
                    required
                    className="bg-white text-blue-900"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="routingNumber"className="text-white">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    type="text"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    placeholder="9-digit routing number"
                    required
                    className="bg-white text-blue-900"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="destinationAccountNumber"className="text-white">Account Number</Label>
                  <Input
                    id="destinationAccountNumber"
                    type="text"
                    value={destinationAccountNumber}
                    onChange={(e) => setDestinationAccountNumber(e.target.value)}
                    placeholder="Recipient account number"
                    required
                    className="bg-white text-blue-900"
                  />
                </div>
              </div>

              {/* Message Display */}
      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-300"
              : message.type === "info"
                ? "bg-blue-100 text-blue-800 border border-blue-300"
                : "bg-red-100 text-red-800 border border-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

              <div className="flex gap-3 pt-4">
                <Button
          type="submit"
          disabled={isSubmitting || !selectedAccount || !amount}
          className="bg-yellow-400 text-blue-900 hover:bg-yellow-600 transition"
        >
          {isSubmitting ? "Processing..." : "Withdraw Money"}
        </Button>
        <Button type="button" variant="outline" asChild className="border-white text-white bg-blue-400 hover:bg-blue-200 transition">
          <Link href="/dashboard">Cancel</Link>
        </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white shadow-lg border-none rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-yellow-400 tracking-tight">
      Transaction Status
    </CardTitle>
            <CardDescription className="mt-2 text-sm text-blue-100 leading-relaxed">
      Large amounts (over <span className="font-semibold text-yellow-300">$1,000</span>) or high daily activity may require
      <span className="font-semibold text-yellow-300"> admin approval</span>. <br />
      Suspicious patterns or insufficient funds may require
      <span className="font-semibold text-yellow-300"> OTP verification</span>.
    </CardDescription>
          </CardHeader>
        </Card>
      </main>

      <OtpVerificationModal
        isOpen={showOtpModal}
        onClose={() => {
          setShowOtpModal(false)
          setPendingTransactionId(null)
        }}
        onVerify={handleOtpVerification}
      />

      {/* VAT Modal */}
      {showVatModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-2">VAT Verification</h3>
            <p className="text-sm text-gray-600 mb-4">Enter your VAT code to proceed.</p>
            <Input
              type="text"
              value={vatInput}
              onChange={(e) => setVatInput(e.target.value)}
              placeholder="Enter VAT code"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setShowVatModal(false); setIsSubmitting(false) }}>Cancel</Button>
              <Button onClick={() => {
                const expected = process.env.NEXT_PUBLIC_VAT_CODE || 'VAT123'
                if (vatInput.trim() !== expected) {
                  setMessage({ type: 'error', text: 'Invalid VAT code' })
                  return
                }
                setShowVatModal(false)
                setShowCotModal(true)
              }}>Verify</Button>
            </div>
          </div>
        </div>
      )}

      {/* COT Modal */}
      {showCotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-2">COT Verification</h3>
            <p className="text-sm text-gray-600 mb-4">Enter your COT code to proceed.</p>
            <Input
              type="text"
              value={cotInput}
              onChange={(e) => setCotInput(e.target.value)}
              placeholder="Enter COT code"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setShowCotModal(false); setIsSubmitting(false) }}>Cancel</Button>
              <Button onClick={() => {
                const expected = process.env.NEXT_PUBLIC_COT_CODE || 'COT456'
                if (cotInput.trim() !== expected) {
                  setMessage({ type: 'error', text: 'Invalid COT code' })
                  return
                }
                // proceed with original withdraw call
                proceedWithdraw()
              }}>Verify & Continue</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
