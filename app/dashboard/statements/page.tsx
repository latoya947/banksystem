"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

interface Account {
  id: string
  account_number: string
  account_type: string
  balance: string
  user_id: string
  created_at: string
}

interface Transaction {
  id: string
  account_id: string
  amount: string
  transaction_type: string
  description: string
  created_at: string
  accounts: {
    account_number: string
    account_type: string
  }
}

export default function StatementsPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string; period?: string }>
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const params = use(searchParams)
  const selectedAccount = params.account || accounts?.[0]?.id
  const selectedPeriod = params.period || "30"

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error || !user) {
        router.push("/auth/login")
        return
      }

      setUser(user)

      const { data: accountsData } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })

      if (accountsData) {
        setAccounts(accountsData)

        const accountId = selectedAccount || accountsData[0]?.id
        if (accountId) {
          await loadTransactions(accountId, selectedPeriod)
        }
      }

      setLoading(false)
    }

    loadData()
  }, [router, selectedAccount, selectedPeriod])

  async function loadTransactions(accountId: string, period: string) {
    const supabase = createClient()

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(period))

    const { data: transactionsData } = await supabase
      .from("transactions")
      .select(`
        *,
        accounts!inner(account_number, account_type)
      `)
      .eq("account_id", accountId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: false })

    if (transactionsData) {
      setTransactions(transactionsData)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading statements...</p>
        </div>
      </div>
    )
  }

  const selectedAccountData = accounts?.find((acc) => acc.id === selectedAccount)

  const totalDeposits =
    transactions?.reduce((sum, t) => (Number.parseFloat(t.amount) > 0 ? sum + Number.parseFloat(t.amount) : sum), 0) ||
    0

  const totalWithdrawals =
    transactions?.reduce(
      (sum, t) => (Number.parseFloat(t.amount) < 0 ? sum + Math.abs(Number.parseFloat(t.amount)) : sum),
      0,
    ) || 0

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - Number.parseInt(selectedPeriod))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 shadow-md">
  <div className="container mx-auto px-4 py-4 flex items-center justify-between">
    
    {/* Logo + Badge */}
    <div className="flex items-center gap-4">
      {/* CapitalCayman Modern Logo */}
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
        Account Statements
      </Badge>
    </div>

    {/* Back to Dashboard Button */}
    <Button
      type="button"
      className="bg-white text-blue-900 font-semibold hover:bg-yellow-400 hover:text-blue-900 transition duration-200 border border-transparent px-4 py-2 rounded-md shadow-sm"
      asChild
    >
      <Link href="/dashboard">Back to Dashboard</Link>
    </Button>
  </div>
</header>


      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
       <Card className="bg-blue-900 text-white shadow-lg rounded-lg border border-blue-800">
  <CardHeader>
    <CardTitle className="text-yellow-400 text-xl font-semibold">Statement Filters</CardTitle>
    <CardDescription className="text-blue-100">Select account and time period</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid md:grid-cols-2 gap-4">
      {/* Account Selector */}
      <div>
        <label className="text-sm font-medium mb-2 block text-yellow-300">Account</label>
        <Select
          value={selectedAccount}
          onValueChange={(value) => {
            const url = new URL(window.location.href)
            url.searchParams.set("account", value)
            window.location.href = url.toString()
          }}
        >
          <SelectTrigger className="bg-white text-blue-900 border border-yellow-300 shadow-sm hover:bg-yellow-100 transition">
            <SelectValue placeholder="Choose an account" />
          </SelectTrigger>
          <SelectContent className="bg-white text-blue-900">
            {accounts?.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} -{" "}
                {account.account_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Period Selector */}
      <div>
        <label className="text-sm font-medium mb-2 block text-yellow-300">Period</label>
        <Select
          value={selectedPeriod}
          onValueChange={(value) => {
            const url = new URL(window.location.href)
            url.searchParams.set("period", value)
            window.location.href = url.toString()
          }}
        >
          <SelectTrigger className="bg-white text-blue-900 border border-yellow-300 shadow-sm hover:bg-yellow-100 transition">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent className="bg-white text-blue-900">
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </CardContent>
</Card>


          {selectedAccountData && (
            <Card className="bg-white shadow-xl border border-blue-200 rounded-lg mt-6">
  <CardHeader className="bg-blue-900 text-white rounded-t-lg px-6 py-4">
    <CardTitle className="text-yellow-400 text-lg font-bold">Account Summary</CardTitle>
    <CardDescription className="text-blue-100 text-sm">
      {selectedAccountData.account_type.charAt(0).toUpperCase() + selectedAccountData.account_type.slice(1)} Account -{" "}
      {selectedAccountData.account_number}
    </CardDescription>
  </CardHeader>

  <CardContent className="p-6">
    <div className="grid md:grid-cols-4 gap-6">
      {/* Current Balance */}
      <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200">
        <p className="text-sm font-medium text-green-800">Current Balance</p>
        <p className="text-2xl font-extrabold text-green-700 mt-1">
          $
          {Number.parseFloat(selectedAccountData.balance).toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
        </p>
      </div>

      {/* Total Deposits */}
      <div className="bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-200">
        <p className="text-sm font-medium text-blue-800">Total Deposits</p>
        <p className="text-xl font-bold text-blue-700 mt-1">
          ${totalDeposits.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Total Withdrawals */}
      <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
        <p className="text-sm font-medium text-red-800">Total Withdrawals</p>
        <p className="text-xl font-bold text-red-700 mt-1">
          ${totalWithdrawals.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Total Transactions */}
      <div className="bg-yellow-50 rounded-lg p-4 shadow-sm border border-yellow-200">
        <p className="text-sm font-medium text-yellow-800">Transactions</p>
        <p className="text-xl font-bold text-yellow-700 mt-1">{transactions?.length || 0}</p>
      </div>
    </div>
  </CardContent>
</Card>
          )}

          <Card className="bg-white shadow-xl border border-blue-200 rounded-lg mt-6">
  <CardHeader className="bg-blue-900 text-white px-6 py-4 rounded-t-lg">
    <CardTitle className="text-yellow-400 text-lg font-bold">Transaction History</CardTitle>
    <CardDescription className="text-blue-100 text-sm">
      Showing transactions from {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
    </CardDescription>
  </CardHeader>

  <CardContent className="p-0">
    {transactions && transactions.length > 0 ? (
      <div className="overflow-x-auto">
        <Table className="min-w-full divide-y divide-gray-200 text-sm">
          <TableHeader className="bg-blue-50">
            <TableRow>
              <TableHead className="text-blue-900 font-semibold">Date</TableHead>
              <TableHead className="text-blue-900 font-semibold">Type</TableHead>
              <TableHead className="text-blue-900 font-semibold">Description</TableHead>
              <TableHead className="text-right text-blue-900 font-semibold">Amount</TableHead>
              <TableHead className="text-right text-blue-900 font-semibold">Balance After</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="bg-white divide-y divide-gray-100">
            {transactions.map((transaction) => {
              const currentBalance = Number.parseFloat(selectedAccountData?.balance || "0")
              const isPositive = Number.parseFloat(transaction.amount) > 0

              return (
                <TableRow key={transaction.id} className="hover:bg-blue-50 transition-all">
                  {/* Date */}
                  <TableCell>
                    <p className="font-medium text-gray-800">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleTimeString()}
                    </p>
                  </TableCell>

                  {/* Type */}
                  <TableCell>
                    <Badge
                      className={`text-xs px-3 py-1 ${
                        transaction.transaction_type === "balance_change"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {transaction.transaction_type.replace("_", " ")}
                    </Badge>
                  </TableCell>

                  {/* Description */}
                  <TableCell className="text-gray-700">{transaction.description || "N/A"}</TableCell>

                  {/* Amount */}
                  <TableCell className="text-right font-semibold">
                    <span className={isPositive ? "text-green-600" : "text-red-600"}>
                      {isPositive ? "+" : "-"}$
                      {Math.abs(Number.parseFloat(transaction.amount)).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </TableCell>

                  {/* Balance After */}
                  <TableCell className="text-right text-blue-700 font-medium">
                    ${currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    ) : (
      <p className="text-gray-500 text-center py-8">No transactions found for the selected period</p>
    )}
  </CardContent>
</Card>
<div className="min-h-screen bg-[#f0f6ff] py-8 px-4">
  {/* Your header */}
  {/* Your card components */}
</div>

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
