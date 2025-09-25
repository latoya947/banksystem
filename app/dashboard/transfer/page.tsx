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

export default function TransferPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [fromAccount, setFromAccount] = useState("")
  const [toAccount, setToAccount] = useState("")
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
      }

      setIsLoading(false)
    }

    loadAccounts()
  }, [router])

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromAccount || !toAccount || !amount) return

    if (fromAccount === toAccount) {
      setMessage({ type: "error", text: "Cannot transfer to the same account" })
      return
    }

    const transferAmount = Number.parseFloat(amount)
    if (transferAmount <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount" })
      return
    }

    const fromAccountData = accounts.find((acc) => acc.id === fromAccount)
    if (transferAmount > Number.parseFloat(fromAccountData?.balance || "0")) {
      setMessage({ type: "error", text: "Insufficient funds" })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    const supabase = createClient()

    try {
      // Withdraw from source account
      const { data: withdrawData, error: withdrawError } = await supabase.rpc("update_account_balance", {
        account_uuid: fromAccount,
        amount_change: -transferAmount,
        transaction_description:
          description || `Transfer to ${accounts.find((acc) => acc.id === toAccount)?.account_number}`,
      })

      if (withdrawError) throw withdrawError

      const withdrawResult = typeof withdrawData === "string" ? JSON.parse(withdrawData) : withdrawData
      if (!withdrawResult.success) {
        throw new Error(withdrawResult.error || "Transfer failed")
      }

      // Deposit to destination account
      const { data: depositData, error: depositError } = await supabase.rpc("update_account_balance", {
        account_uuid: toAccount,
        amount_change: transferAmount,
        transaction_description:
          description || `Transfer from ${accounts.find((acc) => acc.id === fromAccount)?.account_number}`,
      })

      if (depositError) throw depositError

      const depositResult = typeof depositData === "string" ? JSON.parse(depositData) : depositData
      if (!depositResult.success) {
        throw new Error(depositResult.error || "Transfer failed")
      }

      setMessage({ type: "success", text: `Successfully transferred $${transferAmount.toFixed(2)}` })
      setAmount("")
      setDescription("")
      setFromAccount("")
      setToAccount("")

      // Refresh accounts to show updated balances
      const { data: updatedAccounts } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .order("created_at", { ascending: true })

      if (updatedAccounts) {
        setAccounts(updatedAccounts)
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to process transfer",
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
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-blue-900">SecureBank</h1>
            <Badge variant="secondary">Transfer Money</Badge>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Transfer Between Accounts</CardTitle>
            <CardDescription>Move money between your accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {accounts.length < 2 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You need at least 2 accounts to make transfers.</p>
                <p className="text-sm text-gray-400">Contact support to open additional accounts.</p>
              </div>
            ) : (
              <form onSubmit={handleTransfer} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="fromAccount">From Account</Label>
                  <Select value={fromAccount} onValueChange={setFromAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source account" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Label htmlFor="toAccount">To Account</Label>
                  <Select value={toAccount} onValueChange={setToAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter((account) => account.id !== fromAccount)
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} -{" "}
                            {account.account_number}
                            (${Number.parseFloat(account.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            )
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
                  />
                  {fromAccount && (
                    <p className="text-sm text-gray-500">
                      Available: $
                      {Number.parseFloat(accounts.find((acc) => acc.id === fromAccount)?.balance || "0").toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2 },
                      )}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Monthly savings transfer"
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
                  <Button type="submit" disabled={isSubmitting || !fromAccount || !toAccount || !amount}>
                    {isSubmitting ? "Processing..." : "Transfer Money"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/dashboard">Cancel</Link>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
