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

export default function DepositPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
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

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccount || !amount) return

    const depositAmount = Number.parseFloat(amount)
    if (depositAmount <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount" })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    const supabase = createClient()

    try {
      const { data, error } = await supabase.rpc("update_account_balance", {
        account_uuid: selectedAccount,
        amount_change: depositAmount,
        transaction_description: description || "Deposit",
      })

      if (error) throw error

      const result = typeof data === "string" ? JSON.parse(data) : data

      if (result.success) {
        setMessage({ type: "success", text: `Successfully deposited $${depositAmount.toFixed(2)}` })
        setAmount("")
        setDescription("")

        // Refresh accounts to show updated balance
        const { data: updatedAccounts } = await supabase
          .from("accounts")
          .select("*")
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
          .order("created_at", { ascending: true })

        if (updatedAccounts) {
          setAccounts(updatedAccounts)
        }
      } else {
        throw new Error(result.error || "Deposit failed")
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to process deposit",
      })
    } finally {
      setIsSubmitting(false)
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
      <header className="bg-blue-900 shadow-sm">
  <div className="container mx-auto px-4 py-4 flex items-center justify-between">
    
    {/* Logo + Page Badge */}
    <div className="flex items-center gap-4">
      {/* Logo */}
      <div className="flex items-center space-x-3 select-none cursor-pointer">
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
      <Badge className="bg-white text-blue-900">Make Deposit</Badge>
    </div>

    {/* Custom Button */}
    <Button
      asChild
      className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 border-none transition duration-200"
    >
      <Link href="/dashboard">Back to Dashboard</Link>
    </Button>
  </div>
</header>


      <main className="container mx-auto px-4 py-8 max-w-2xl">
       <Card className="bg-blue-50 border border-blue-200 shadow-md">
  <CardHeader>
    <CardTitle className="text-blue-900">Make a Deposit</CardTitle>
    <CardDescription className="text-blue-700">Add funds to your account</CardDescription>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleDeposit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="account" className="text-blue-900">Select Account</Label>
        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
          <SelectTrigger className="bg-white border-blue-300 focus:ring-2 focus:ring-blue-400">
            <SelectValue placeholder="Choose an account" />
          </SelectTrigger>
          <SelectContent className="bg-white border-blue-200">
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} -{" "}
                {account.account_number}
                (${Number.parseFloat(account.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="amount" className="text-blue-900">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
          className="bg-white border-blue-300 focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description" className="text-blue-900">Description (Optional)</Label>
        <Input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Paycheck deposit"
          className="bg-white border-blue-300 focus:ring-2 focus:ring-blue-400"
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

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || !selectedAccount || !amount}
          className="bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
        >
          {isSubmitting ? "Processing..." : "Make Deposit"}
        </Button>
        <Button
          type="button"
          variant="outline"
          asChild
          className="border-blue-600 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
        >
          <Link href="/dashboard">Cancel</Link>
        </Button>
      </div>
    </form>
  </CardContent>
</Card>
      </main>
    </div>
  )
}
