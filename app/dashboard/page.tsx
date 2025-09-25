import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

async function handleSignOut() {
  "use server"
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Check if user is admin and redirect to admin panel
  const isAdmin = user.user_metadata?.is_admin === true || user.user_metadata?.role === "admin"
  if (isAdmin) {
    redirect("/admin")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get user accounts
  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  // Get recent transactions
  const { data: transactions } = await supabase
    .from("transactions")
    .select(`
      *,
      accounts!inner(account_number, account_type)
    `)
    .eq("accounts.user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 shadow-sm">
  <div className="container mx-auto px-4 py-4 flex items-center justify-between">
    
    {/* Logo + Badge */}
    <div className="flex items-center gap-4">
      {/* Logo */}
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
        <span className="text-2xl font-extrabold tracking-tight uppercase font-sans text-yellow-400 drop-shadow">
          Bank
        </span>
      </div>

      {/* Dashboard Badge */}
      <Badge variant="secondary" className="bg-white text-blue-900">
        Dashboard
      </Badge>
    </div>

    {/* Right Section: Welcome Text + Sign Out */}
    <div className="flex items-center gap-4">
      <span className="text-sm text-white">
        Welcome, {profile?.full_name || user.email}
      </span>
      <form action={handleSignOut}>
        <Button
  type="submit"
  className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 font-medium"
>
          Sign Out
        </Button>
      </form>
    </div>
  </div>
</header>


      <main className="container mx-auto px-4 py-8">
       <div className="grid gap-6">
  {/* Account Overview */}
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {accounts?.map((account) => (
      <Card
        key={account.id}
        className="bg-gradient-to-br from-green-800 via-green-700 to-green-800 text-white shadow-md border border-green-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg animate-fadeIn"
      >
        <CardHeader>
          <CardTitle className="text-lg capitalize text-green-100">
            {account.account_type} Account
          </CardTitle>
          <CardDescription className="text-green-200">
            Account #{account.account_number}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-100 animate-pulse-slow">
            ${Number.parseFloat(account.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-sm text-green-200 mt-2">Available Balance</p>
        </CardContent>
      </Card>
    ))}
</div>



          {/* Quick Actions */}
<Card className="bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-200 shadow-md transition-all duration-300 hover:shadow-lg">
  <CardHeader>
    <CardTitle className="text-blue-900">Quick Actions</CardTitle>
    <CardDescription className="text-blue-700">
      Manage your accounts and transactions
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex flex-wrap gap-3">
      <Button
        asChild
        className="bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        <Link href="/dashboard/transfer">Transfer Money</Link>
      </Button>
      <Button
        variant="outline"
        asChild
        className="border-green-600 text-green-700 hover:bg-green-50"
      >
        <Link href="/dashboard/deposit">Make Deposit</Link>
      </Button>
      <Button
        variant="outline"
        asChild
        className="border-red-600 text-red-700 hover:bg-red-50"
      >
        <Link href="/dashboard/withdraw">Withdraw Money</Link>
      </Button>
      <Button
        variant="outline"
        asChild
        className="border-purple-600 text-purple-700 hover:bg-purple-50"
      >
        <Link href="/dashboard/statements">View Statements</Link>
      </Button>
      <Button
        variant="outline"
        asChild
        className="border-yellow-600 text-yellow-700 hover:bg-yellow-50"
      >
        <Link href="/dashboard/profile">Update Profile</Link>
      </Button>
    </div>
  </CardContent>
</Card>


          {/* Recent Transactions */}
<Card className="bg-gradient-to-br from-white via-gray-50 to-gray-100 border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
  <CardHeader>
    <CardTitle className="text-blue-900">Recent Transactions</CardTitle>
    <CardDescription className="text-gray-600">Your latest account activity</CardDescription>
  </CardHeader>
  <CardContent>
    {transactions && transactions.length > 0 ? (
      <div className="space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0 group transition-colors duration-200 hover:bg-white/60 rounded-md px-2"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {/* Status Dot */}
                <div
                  className={`w-3 h-3 rounded-full transition-all ${
                    transaction.amount > 0 ? "bg-green-500 group-hover:bg-green-600" : "bg-red-500 group-hover:bg-red-600"
                  }`}
                />
                {/* Transaction Info */}
                <div>
                  <p className="font-semibold capitalize text-gray-800">
                    {transaction.transaction_type.replace("_", " ")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {transaction.accounts.account_type} • {transaction.accounts.account_number}
                  </p>
                  {transaction.description && (
                    <p className="text-sm text-gray-600">{transaction.description}</p>
                  )}
                </div>
              </div>
            </div>
            {/* Amount + Date */}
            <div className="text-right">
              <p
                className={`font-semibold text-lg ${
                  transaction.amount > 0
                    ? "text-green-600 group-hover:text-green-700"
                    : "text-red-600 group-hover:text-red-700"
                }`}
              >
                {transaction.amount > 0 ? "+" : "-"}$
                {Math.abs(Number.parseFloat(transaction.amount)).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(transaction.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-gray-500 text-center py-8">No transactions yet</p>
    )}
  </CardContent>
</Card>


          {/* Account Information */}
<Card className="bg-gradient-to-br from-blue-50 via-white to-gray-100 border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
  <CardHeader>
    <CardTitle className="text-blue-900">Account Information</CardTitle>
    <CardDescription className="text-gray-600">Your profile and contact details</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <p className="text-sm font-semibold text-gray-500">Full Name</p>
        <p className="text-base text-gray-800">{profile?.full_name || "Not provided"}</p>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-500">Email</p>
        <p className="text-base text-gray-800">{user.email}</p>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-500">Phone</p>
        <p className="text-base text-gray-800">{profile?.phone || "Not provided"}</p>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-500">Address</p>
        <p className="text-base text-gray-800">{profile?.address || "Not provided"}</p>
      </div>
    </div>

    {/* Separator */}
    <div className="my-6 h-px bg-gray-200" />

    {/* Footer Section */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div>
        <p className="text-sm font-semibold text-gray-500">Member Since</p>
        <p className="text-base text-gray-800">{new Date(user.created_at).toLocaleDateString()}</p>
      </div>
      <Button
        variant="ghost"
        className="border border-blue-600 text-blue-600 hover:bg-blue-50 transition duration-200"
        asChild
      >
        <Link href="/dashboard/profile">Edit Profile</Link>
      </Button>
    </div>
  </CardContent>
</Card>
        </div>
      </main>
    </div>
  )
}
