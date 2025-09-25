"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ArrowLeft, Home } from "lucide-react"
import Link from "next/link"

export default function WithdrawSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [transactionDetails, setTransactionDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const amount = searchParams.get('amount')
  const accountNumber = searchParams.get('account')
  const transactionId = searchParams.get('transactionId')

  useEffect(() => {
    const loadTransactionDetails = async () => {
      if (!transactionId) {
        setLoading(false)
        return
      }

      const supabase = createClient()
      
      try {
        // Get the latest transaction for this account
        const { data: transaction } = await supabase
          .from('transactions')
          .select(`
            *,
            accounts!inner(
              account_number,
              account_type,
              balance
            )
          `)
          .eq('id', transactionId)
          .single()

        if (transaction) {
          setTransactionDetails(transaction)
        }
      } catch (error) {
        console.error('Error loading transaction details:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTransactionDetails()
  }, [transactionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading transaction details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-blue-900">Capital Cayman Bank</h1>
            <Badge variant="secondary">Withdrawal Successful</Badge>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Success Message */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                Withdrawal Successful!
              </h2>
              <p className="text-green-700">
                Your withdrawal has been processed successfully.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>Details of your completed withdrawal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Amount Withdrawn</p>
                <p className="text-lg font-semibold text-red-600">
                  -${amount ? parseFloat(amount).toFixed(2) : '0.00'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Account</p>
                <p className="text-lg font-semibold">
                  {accountNumber || transactionDetails?.accounts?.account_number || 'N/A'}
                </p>
              </div>
            </div>

            {transactionDetails && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Account Type</p>
                    <p className="text-lg font-semibold capitalize">
                      {transactionDetails.accounts?.account_type || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">New Balance</p>
                    <p className="text-lg font-semibold text-green-600">
                      ${transactionDetails.accounts?.balance ? 
                        parseFloat(transactionDetails.accounts.balance).toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Transaction ID</p>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                    {transactionDetails.id}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Date & Time</p>
                  <p className="text-sm">
                    {new Date(transactionDetails.created_at).toLocaleString()}
                  </p>
                </div>

                {transactionDetails.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="text-sm">{transactionDetails.description}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3 justify-center">
          <Button asChild>
            <Link href="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/statements">
              <ArrowLeft className="w-4 h-4 mr-2" />
              View Statements
            </Link>
          </Button>
        </div>

        {/* Additional Info */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold text-blue-800 mb-2">What's Next?</h3>
              <p className="text-blue-700 text-sm">
                Your withdrawal has been processed and the funds have been deducted from your account. 
                You can view your updated balance and transaction history in your dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
