"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function PendingTransactionsPage() {
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [loadInfo, setLoadInfo] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadPendingTransactions = async () => {
      const supabase = createClient()

      // Check if user is admin
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      // Check admin via user metadata (role or is_admin flag)
      const isAdmin = user.user_metadata?.is_admin === true || user.user_metadata?.role === "admin"
      if (!isAdmin) {
        router.push("/dashboard")
        return
      }

      // Load pending transactions
      const { data: transactions, error: txError } = await supabase
        .from("pending_transactions")
        .select("*")
        .in("status", ["pending", "requires_otp"]) // only show actionable items
        .order("created_at", { ascending: false })

      if (txError) {
        setLoadInfo(`Load error: ${txError.message}`)
      }

      if (transactions) {
        setPendingTransactions(transactions)
        setLoadInfo(`Loaded ${transactions.length} pending item(s)`) // debug info
      }

      setIsLoading(false)
    }

    loadPendingTransactions()
  }, [router])

  const handleApprove = async (transactionId: string) => {
    const supabase = createClient()

    try {
      // Get the pending transaction details
      const { data: pendingTx } = await supabase
        .from("pending_transactions")
        .select("*")
        .eq("id", transactionId)
        .single()

      if (!pendingTx) throw new Error("Transaction not found")

      // Get current admin user id
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Process the transaction using admin context so negatives are allowed and logged as admin_adjustment
      const { error: processError } = await supabase.rpc("update_account_balance", {
        account_uuid: pendingTx.account_id,
        amount_change: pendingTx.amount,
        transaction_description: `${pendingTx.description || pendingTx.transaction_type} (Admin Approved)`,
        admin_user_id: user.id,
      })

      if (processError) throw processError

      // Update pending transaction status
      const { error: updateError } = await supabase
        .from("pending_transactions")
        .update({
          status: "approved",
        })
        .eq("id", transactionId)

      if (updateError) throw updateError

      setMessage({ type: "success", text: "Transaction approved successfully" })

      // Refresh the list
      setPendingTransactions((prev) => prev.filter((tx) => tx.id !== transactionId))
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to approve transaction",
      })
    }
  }

  const handleReject = async (transactionId: string, reason: string) => {
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("pending_transactions")
        .update({
          status: "rejected",
        })
        .eq("id", transactionId)

      if (error) throw error

      setMessage({ type: "success", text: "Transaction rejected" })

      // Refresh the list
      setPendingTransactions((prev) => prev.filter((tx) => tx.id !== transactionId))
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to reject transaction",
      })
    }
  }

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-blue-900">Capital Cayman Bank Admin</h1>
            <Badge variant="secondary">Pending Transactions</Badge>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin">Back to Admin Panel</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {message && (
          <div
            className={`mb-6 p-3 rounded-md text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {loadInfo && (
          <div className="mb-4 text-xs text-gray-500">{loadInfo}</div>
        )}

        <div className="grid gap-6">
          {pendingTransactions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">No pending transactions</p>
              </CardContent>
            </Card>
          ) : (
            pendingTransactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1)}{" "}
                        Request
                      </CardTitle>
                      <CardDescription>Pending review by admin</CardDescription>
                    </div>
                    <Badge variant="outline">Pending Approval</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Amount</Label>
                        <p className="text-lg font-semibold">
                          $
                          {Math.abs(transaction.amount).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Account</Label>
                        <p className="font-mono text-xs">{transaction.account_id}</p>
                      </div>
                    </div>

                    {transaction.description && (
                      <div>
                        <Label className="text-sm font-medium">Description</Label>
                        <p>{transaction.description}</p>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-medium">Requested At</Label>
                      <p>{new Date(transaction.created_at).toLocaleString()}</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button onClick={() => handleApprove(transaction.id)} className="bg-green-600 hover:bg-green-700">
                        Approve Transaction
                      </Button>
                      <Button variant="destructive" onClick={() => handleReject(transaction.id, "Rejected by admin")}>
                        Reject Transaction
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
