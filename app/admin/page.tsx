import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  const isAdmin = user.user_metadata?.is_admin === true || user.user_metadata?.role === "admin"
  if (!isAdmin) {
    redirect("/dashboard")
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      phone,
      address,
      role,
      is_admin,
      created_at,
      accounts(*)
    `)
    .order("created_at", { ascending: false })

  console.log("[v0] Profiles count:", profiles?.length || 0)
  console.log("[v0] Profiles data:", profiles)

  // Get total statistics
  const { data: totalAccounts } = await supabase.from("accounts").select("balance")
  const totalBalance = totalAccounts?.reduce((sum, account) => sum + Number.parseFloat(account.balance), 0) || 0

  console.log("[v0] Total accounts count:", totalAccounts?.length || 0)
  console.log("[v0] Total balance:", totalBalance)

  // Map profiles to users (email will be shown as "User" for now)
  const allUsers =
    profiles?.map((profile) => ({
      id: profile.id,
      email: profile.email ?? "User",
      created_at: profile.created_at,
      profile: profile,
      accounts: profile.accounts || [],
      is_admin: profile.is_admin === true || profile.role === 'admin',
    })) || []

  // Calculate regular users count (non-admin users)
  const regularUsersCount = profiles?.filter((p: any) => (p.is_admin !== true && p.role !== 'admin')).length || 0

  console.log("[v0] All users mapped:", allUsers.length)
  console.log("[v0] Regular users count:", regularUsersCount)

  // Get recent transactions
  const { data: recentTransactions } = await supabase
    .from("transactions")
    .select(`
      *,
      accounts!inner(account_number, account_type, user_id),
      profiles!inner(full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(10)

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gray-300">
      {/* Header */}
      <header className="bg-blue-900 border-b">
  <div className="container mx-auto px-4 py-4 flex items-center justify-between">
    
    {/* Logo + Admin Panel */}
    <div className="flex items-center gap-4">
      {/* Logo */}
      <div className="flex items-center space-x-3 select-none cursor-pointer">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-yellow-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span className="text-xl font-extrabold tracking-tight uppercase font-sans text-yellow-400 drop-shadow">
          Capital
        </span>
        <span className="text-xl font-light tracking-widest uppercase font-serif text-white drop-shadow">
          Cayman
        </span>
        <span className="text-3xl font-extrabold tracking-tight uppercase font-sans drop-shadow-lg text-yellow-400">
                  Bank
                </span>
      </div>

      {/* Admin Panel Badge */}
      <Badge variant="destructive">Admin Panel</Badge>
    </div>

    {/* Right Side: User Info + Actions */}
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-200">Admin: {user.email}</span>
      <Button variant="default" asChild>
        <Link href="/dashboard">Switch to User View</Link>
      </Button>
      <form action={handleSignOut}>
  <Button
    variant="outline"
    className="border-white text-blue hover:bg-white/10"
    type="submit"
  >
    Sign Out
  </Button>
</form>
    </div>

  </div>
</header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Statistics */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="bg-blue-50 border border-blue-100 shadow-sm rounded-lg">
      <CardHeader>
        <CardTitle className="text-lg text-blue-700">Total Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-blue-600">{allUsers?.length || 0}</div>
        <p className="text-sm text-blue-500 mt-2">All registered users</p>
      </CardContent>
    </Card>
            <Card className="bg-green-50 border border-green-100 shadow-sm rounded-lg">
      <CardHeader>
        <CardTitle className="text-lg text-green-700">Regular Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-green-600">{regularUsersCount}</div>
        <p className="text-sm text-green-500 mt-2">Customer accounts</p>
      </CardContent>
    </Card>
            <Card className="bg-orange-50 border border-orange-100 shadow-sm rounded-lg">
      <CardHeader>
        <CardTitle className="text-lg text-orange-700">Total Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-orange-600">{totalAccounts?.length || 0}</div>
        <p className="text-sm text-orange-500 mt-2">Active accounts</p>
      </CardContent>
    </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {(totalBalance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-sm text-gray-500 mt-2">Across all accounts</p>
              </CardContent>
            </Card>
          </div>

          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>Quick access to admin functions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button asChild className="bg-orange-600 hover:bg-orange-700">
                  <Link href="/admin/pending-transactions">
                    🔍 Review Pending Transactions
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/users">👥 Manage Users</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/transactions">📊 View All Transactions</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage all customer accounts - Click "Update Balance" to add or subtract funds
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allUsers?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No users found. Make sure to run the database setup scripts.</p>
                  <p className="text-sm text-gray-400">
                    Users should appear here after registration and running script 007.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Accounts</TableHead>
                        <TableHead>Total Balance</TableHead>
                        <TableHead>Balance Management</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers?.map((user) => {
                        const userBalance =
                          user.accounts?.reduce(
                            (sum: number, account: any) => sum + Number.parseFloat(account.balance),
                            0,
                          ) || 0
                        return (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{user.profile?.full_name || "N/A"}</p>
                                <p className="text-sm text-gray-500">
                                  Joined {new Date(user.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{user.email}</p>
                            </TableCell>
                            <TableCell>{user.profile?.phone || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{user.accounts?.length || 0} accounts</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-green-600">
                                ${userBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-2">
                                <Button size="sm" variant="default" asChild>
                                  <Link href={`/admin/user/${user.id}`}>💰 Update Balance</Link>
                                </Button>
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={`/admin/user/${user.id}`}>👤 View Details</Link>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest transactions across all accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions && recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between py-3 border-b last:border-b-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${transaction.amount > 0 ? "bg-green-500" : "bg-red-500"}`}
                          />
                          <div>
                            <p className="font-medium">{transaction.profiles?.full_name || "Unknown User"}</p>
                            <p className="text-sm text-gray-500">
                              {transaction.transaction_type.replace("_", " ").toUpperCase()} •{" "}
                              {transaction.accounts.account_number}
                            </p>
                            {transaction.description && (
                              <p className="text-sm text-gray-600">{transaction.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                          {transaction.amount > 0 ? "+" : ""}$
                          {Math.abs(Number.parseFloat(transaction.amount)).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-sm text-gray-500">{new Date(transaction.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
