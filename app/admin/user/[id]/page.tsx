import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { BalanceUpdateForm } from "@/components/balance-update-form"

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const isAdmin = user.user_metadata?.is_admin === true || user.user_metadata?.role === "admin"
  if (!isAdmin) {
    redirect("/dashboard")
  }

  // Get user profile and accounts
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).single()

  console.log("[AdminUserPage] User ID:", id)
  console.log("[AdminUserPage] Profile found:", profile)

  if (!profile) {
    console.log("[AdminUserPage] No profile found, redirecting to admin")
    redirect("/admin")
  }

  const { data: accounts, error: accountsError } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: true })

  console.log("[AdminUserPage] Accounts found:", accounts)
  console.log("[AdminUserPage] Accounts error:", accountsError)

  // Get user transactions
  const { data: transactions } = await supabase
    .from("transactions")
    .select(`
      *,
      accounts!inner(account_number, account_type)
    `)
    .eq("accounts.user_id", id)
    .order("created_at", { ascending: false })
    .limit(20)

  // Get user's pending transactions
  const { data: pendingTransactions } = await supabase
    .from("pending_transactions")
    .select(`
      *,
      accounts!inner(account_number, account_type)
    `)
    .in("status", ["pending", "requires_otp"])
    .eq("accounts.user_id", id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-blue-900">SecureBank</h1>
            <Badge variant="destructive">Admin Panel</Badge>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/admin">Back to Admin</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Profile details for {profile.full_name || "Unknown User"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex items-center justify-between p-3 rounded-md border bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Account Status</p>
                    <p className="text-sm text-gray-500">
                      {profile.is_frozen ? `Frozen${profile.frozen_reason ? ` - ${profile.frozen_reason}` : ''}` : 'Active'}
                    </p>
                  </div>
                  <form action={async () => {
                    "use server"
                    const supabase = await createClient()
                    const {
                      data: { user },
                    } = await supabase.auth.getUser()
                    const isAdmin = user?.user_metadata?.is_admin === true || user?.user_metadata?.role === "admin"
                    if (!isAdmin) return
                    await supabase
                      .from('profiles')
                      .update({
                        is_frozen: !profile.is_frozen,
                        frozen_at: !profile.is_frozen ? new Date().toISOString() : null,
                        frozen_reason: !profile.is_frozen ? 'Frozen by admin' : null,
                      })
                      .eq('id', profile.id)
                  }}>
                    <Button type="submit" variant={profile.is_frozen ? 'default' : 'destructive'}>
                      {profile.is_frozen ? 'Unfreeze' : 'Freeze'} Account
                    </Button>
                  </form>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <p className="text-base">{profile.full_name || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">User ID</p>
                  <p className="text-sm font-mono">{profile.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-base">{profile.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-base">{profile.address || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Member Since</p>
                  <p className="text-base">{new Date(profile.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Updated</p>
                  <p className="text-base">{new Date(profile.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Management */}
          <Card>
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
              <CardDescription>Manage customer accounts and balances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {accounts?.map((account) => (
                  <div key={account.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold capitalize">{account.account_type} Account</h3>
                        <p className="text-sm text-gray-500">Account #{account.account_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ${Number.parseFloat(account.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-gray-500">Current Balance</p>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <BalanceUpdateForm accountId={account.id} currentBalance={Number.parseFloat(account.balance)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Recent transactions for this customer</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTransactions && pendingTransactions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Pending Transactions</h3>
                  <div className="overflow-x-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingTransactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{tx.accounts.account_number}</p>
                                <p className="text-sm text-gray-500 capitalize">{tx.accounts.account_type}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{tx.transaction_type}</Badge>
                            </TableCell>
                            <TableCell>{tx.description || "N/A"}</TableCell>
                            <TableCell className="text-right">
                              <span
                                className={`font-semibold ${Number.parseFloat(tx.amount) > 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {Number.parseFloat(tx.amount) > 0 ? "+" : ""}$
                                {Math.abs(Number.parseFloat(tx.amount)).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">Pending</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              {transactions && transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{transaction.accounts.account_number}</p>
                              <p className="text-sm text-gray-500 capitalize">{transaction.accounts.account_type}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                transaction.transaction_type === "balance_change" ? "destructive" : "secondary"
                              }
                            >
                              {transaction.transaction_type.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.description || "N/A"}</TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`font-semibold ${Number.parseFloat(transaction.amount) > 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {Number.parseFloat(transaction.amount) > 0 ? "+" : ""}$
                              {Math.abs(Number.parseFloat(transaction.amount)).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No transactions found</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
