"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BalanceUpdateFormProps {
  accountId: string
  currentBalance: number
}

export function BalanceUpdateForm({ accountId, currentBalance }: BalanceUpdateFormProps) {
  const [amount, setAmount] = useState("")
  const [operation, setOperation] = useState<"add" | "subtract" | "set">("add")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) return

    const inputAmount = Number.parseFloat(amount)
    if (isNaN(inputAmount)) {
      setMessage({ type: "error", text: "Please enter a valid amount" })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    const supabase = createClient()

    try {
      let amountChange: number

      switch (operation) {
        case "add":
          amountChange = inputAmount
          break
        case "subtract":
          amountChange = -inputAmount
          break
        case "set":
          amountChange = inputAmount - currentBalance
          break
        default:
          throw new Error("Invalid operation")
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Create a clean transaction description
      const transactionDescription = description || `Transfer ${amountChange > 0 ? '+' : ''}$${Math.abs(amountChange)}`

      console.log("[BalanceUpdate] Updating balance:", {
        accountId,
        amountChange,
        description: transactionDescription,
        adminUserId: user.id,
        currentBalance
      })

      const { data, error } = await supabase.rpc("update_account_balance", {
        account_uuid: accountId,
        amount_change: amountChange,
        transaction_description: transactionDescription,
        admin_user_id: user.id,
      })

      if (error) {
        console.error("[BalanceUpdate] Supabase error:", error)
        throw error
      }

      console.log("[BalanceUpdate] Function response:", data)

      const result = typeof data === "string" ? JSON.parse(data) : data

      if (result.success) {
        setMessage({
          type: "success",
          text: `Balance updated successfully. New balance: $${result.new_balance}`,
        })
        setAmount("")
        setDescription("")
        // Refresh the page to show updated balance
        window.location.reload()
      } else {
        console.error("[BalanceUpdate] Function returned error:", result.error)
        throw new Error(result.error || "Update failed")
      }
    } catch (error) {
      console.error("[BalanceUpdate] Error:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update balance",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="operation">Operation</Label>
          <Select value={operation} onValueChange={(value: "add" | "subtract" | "set") => setOperation(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="add">Add to balance</SelectItem>
              <SelectItem value="subtract">Subtract from balance</SelectItem>
              <SelectItem value="set">Set balance to</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Reason for balance adjustment..."
          rows={2}
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

      <Button type="submit" disabled={isSubmitting || !amount} className="w-full">
        {isSubmitting ? "Updating..." : `Update Balance`}
      </Button>
    </form>
  )
}
