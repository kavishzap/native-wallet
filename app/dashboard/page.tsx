"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Settings,
  LogOut,
  Key,
  User,
  Mail,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

type Transaction = {
  id: string
  date: string
  amount: number
  type: "Purchase" | "Top-up"
  description: string
}

const sampleTransactions: Transaction[] = [
  { id: "1", date: "2024-01-15", amount: -89.99, type: "Purchase", description: "Online Store Purchase" },
  { id: "2", date: "2024-01-14", amount: 500.0, type: "Top-up", description: "Account Top-up" },
  { id: "3", date: "2024-01-12", amount: -45.5, type: "Purchase", description: "Grocery Store" },
  { id: "4", date: "2024-01-10", amount: -120.0, type: "Purchase", description: "Subscription Service" },
  { id: "5", date: "2024-01-08", amount: 1000.0, type: "Top-up", description: "Salary Deposit" },
  { id: "6", date: "2024-01-05", amount: -25.99, type: "Purchase", description: "Coffee Shop" },
  { id: "7", date: "2024-01-03", amount: -199.99, type: "Purchase", description: "Electronics Store" },
  { id: "8", date: "2024-01-01", amount: 250.0, type: "Top-up", description: "Gift Card Redemption" },
]

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState("")
  const [userName, setUserName] = useState("")
  const [transactions, setTransactions] = useState<Transaction[]>(sampleTransactions)
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(sampleTransactions)
  const [sortField, setSortField] = useState<keyof Transaction>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [filter, setFilter] = useState<"All" | "Purchase" | "Top-up">("All")
  const router = useRouter()

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn")
    const email = localStorage.getItem("userEmail")

    if (!isLoggedIn) {
      router.push("/login")
      return
    }

    if (email) {
      setUserEmail(email)
      // Generate name from email for demo
      const name = email.split("@")[0]
      setUserName(name.charAt(0).toUpperCase() + name.slice(1))
    }
  }, [router])

  useEffect(() => {
    let filtered = transactions

    if (filter !== "All") {
      filtered = transactions.filter((t) => t.type === filter)
    }

    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      if (sortField === "date") {
        aValue = new Date(a.date).getTime()
        bValue = new Date(b.date).getTime()
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setFilteredTransactions(filtered)
  }, [transactions, filter, sortField, sortDirection])

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatAmount = (amount: number) => {
    const formatted = Math.abs(amount).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    })
    return amount >= 0 ? `+${formatted}` : `-${formatted}`
  }

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("userEmail")
    router.push("/login")
  }

  const handleChangePassword = () => {
    router.push("/change-password")
  }

  if (!userEmail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {userName}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-xl bg-transparent">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Banner + User Card Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* User Card */}
          <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                  <AvatarImage src="/placeholder-user.png" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                    {userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-xl">{userName}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    {userEmail}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Member since Jan 2024</span>
                </div>
                <Badge variant="secondary" className="rounded-full">
                  Active
                </Badge>
              </div>

              <div className="pt-4 border-t border-border/50">
                <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleChangePassword}
                    className="justify-start rounded-xl h-10 bg-transparent"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start rounded-xl h-10 bg-transparent">
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start rounded-xl h-10 bg-transparent">
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hero Banner */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 backdrop-blur-sm overflow-hidden">
            <div className="relative h-full min-h-[400px]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
              <img
                src="/modern-business-dashboard-hero-banner-with-abstrac.png"
                alt="Dashboard Hero"
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
              <div className="relative z-10 p-8 h-full flex flex-col justify-center">
                <div className="space-y-4">
                  <Badge className="w-fit bg-primary/20 text-primary border-primary/30 rounded-full">
                    Welcome Back
                  </Badge>
                  <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    Your Financial
                    <br />
                    <span className="text-primary">Dashboard</span>
                  </h2>
                  <p className="text-muted-foreground max-w-md leading-relaxed">
                    Monitor your transactions, track your spending, and manage your account with our comprehensive
                    dashboard tools.
                  </p>
                  <div className="pt-4">
                    <Button className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200">
                      View Analytics
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Recent Transactions</CardTitle>
                <CardDescription>Your latest financial activity</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Select value={filter} onValueChange={(value: "All" | "Purchase" | "Top-up") => setFilter(value)}>
                  <SelectTrigger className="w-32 rounded-xl border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50">
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Purchase">Purchase</SelectItem>
                    <SelectItem value="Top-up">Top-up</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="rounded-xl bg-transparent">
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/50">
                    <TableHead className="font-semibold">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("date")}
                        className="h-8 p-0 font-semibold hover:bg-transparent"
                      >
                        Date
                        {sortField === "date" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowDown className="ml-2 h-4 w-4" />
                          ))}
                        {sortField !== "date" && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("type")}
                        className="h-8 p-0 font-semibold hover:bg-transparent"
                      >
                        Type
                        {sortField === "type" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowDown className="ml-2 h-4 w-4" />
                          ))}
                        {sortField !== "type" && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("amount")}
                        className="h-8 p-0 font-semibold hover:bg-transparent"
                      >
                        Amount
                        {sortField === "amount" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowDown className="ml-2 h-4 w-4" />
                          ))}
                        {sortField !== "amount" && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction, index) => (
                    <TableRow
                      key={transaction.id}
                      className={`hover:bg-muted/30 transition-colors ${index % 2 === 0 ? "bg-background" : "bg-muted/10"}`}
                    >
                      <TableCell className="font-medium">{formatDate(transaction.date)}</TableCell>
                      <TableCell className="text-muted-foreground">{transaction.description}</TableCell>
                      <TableCell>
                        <Badge
                          variant={transaction.type === "Top-up" ? "default" : "secondary"}
                          className={`rounded-full ${
                            transaction.type === "Top-up"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                          }`}
                        >
                          {transaction.type === "Top-up" ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <span
                          className={
                            transaction.amount >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {formatAmount(transaction.amount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-lg font-medium mb-2">No transactions found</div>
                <p className="text-sm">Try adjusting your filter to see more results.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
