"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  LogOut,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  Download,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";

type UiTransaction = {
  id: string;
  date: string; // ISO string
  amount: number; // + for Top-up, - for Purchase
  type: "Purchase" | "Top-up";
};

type ApiTransaction = {
  id: number | string;
  amount: string | number;
  type: "Debit" | "Top Up";
  created_at: string;
  user: string | number;
};

type NativeUser = {
  id: number;
  fname?: string;
  lname?: string;
  email: string;
  card_url?: string | null;
  amount?: number | string | null;
};

const PAGE_SIZE = 10;

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<NativeUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Transactions state
  const [transactions, setTransactions] = useState<UiTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  // UI state
  const [filteredTransactions, setFilteredTransactions] = useState<UiTransaction[]>([]);
  const [sortField, setSortField] = useState<keyof UiTransaction>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filter, setFilter] = useState<"All" | "Purchase" | "Top-up">("All");

  // Pagination state
  const [page, setPage] = useState(1);

  // --- Load user from localStorage ---
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    const nativeUserRaw = localStorage.getItem("native_user");
    if (nativeUserRaw) {
      try {
        const parsed = JSON.parse(nativeUserRaw) as NativeUser;
        setUser(parsed);
      } catch {
        const email = localStorage.getItem("userEmail") || "";
        setUser({ id: -1, email });
      }
    } else {
      const email = localStorage.getItem("userEmail") || "";
      setUser({ id: -1, email });
    }
    setLoadingUser(false);
  }, [router]);

  // --- Fetch transactions for this user ---
  useEffect(() => {
    const run = async () => {
      if (!user || user.id === -1) return;
      setLoadingTx(true);
      setTxError(null);

      const supabase = getSupabaseClient();
      if (!supabase) {
        setTxError("App configuration missing. Please try again later.");
        setLoadingTx(false);
        return;
      }

      const TABLE_NAME = "native_transactions";
      try {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select("*")
          .eq("user", String(user.id))
          .order("created_at", { ascending: false });

        if (error) throw error;
        const rows = (data || []) as ApiTransaction[];

        const mapped: UiTransaction[] = rows.map((r) => {
          const isTopUp = r.type.toLowerCase() === "top up";
          const amt = typeof r.amount === "string" ? parseFloat(r.amount) : Number(r.amount);
          const signed = isTopUp ? Math.abs(amt) : -Math.abs(amt);

          return {
            id: String(r.id),
            date: r.created_at,
            amount: Number.isFinite(signed) ? signed : 0,
            type: isTopUp ? "Top-up" : "Purchase",
          };
        });

        setTransactions(mapped);
      } catch (err: any) {
        setTxError(err?.message || "Failed to load transactions.");
      } finally {
        setLoadingTx(false);
      }
    };

    run();
  }, [user]);

  // Derived
  const displayName = useMemo(() => {
    if (!user) return "";
    if (user.fname || user.lname) return `${user.fname ?? ""} ${user.lname ?? ""}`.trim();
    const emailPart = user.email?.split("@")[0] ?? "";
    return emailPart ? emailPart.charAt(0).toUpperCase() + emailPart.slice(1) : "User";
  }, [user]);

  // --- Filtering & Sorting (reset to page 1 on changes) ---
  useEffect(() => {
    let filtered = transactions;
    if (filter !== "All") {
      filtered = transactions.filter((t) => t.type === filter);
    }

    filtered = [...filtered].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === "date") {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      }

      if (sortDirection === "asc") return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    });

    setFilteredTransactions(filtered);
    setPage(1);
  }, [transactions, filter, sortField, sortDirection]);

  const handleSort = (field: keyof UiTransaction) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  // --- Logout (confirmed) ---
  const actuallyLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("native_user");
    router.push("/login");
  };

  // --- Pagination derived values ---
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, filteredTransactions.length);
  const paginated = useMemo(
    () => filteredTransactions.slice(startIndex, endIndex),
    [filteredTransactions, startIndex, endIndex]
  );

  // Keep page in bounds if data changes
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {displayName}</p>
          </div>

          {/* Logout with confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl bg-transparent">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Log out?</AlertDialogTitle>
                <AlertDialogDescription>
                  You’ll be signed out of your session and returned to the login screen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={actuallyLogout}>Logout</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Centered 2-col grid */}
      <main className="min-h-[calc(100vh-88px)] flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Activation Card */}
            <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Your Activation Card</CardTitle>
                <CardDescription>
                  Use this card at checkout to verify your account and apply discounts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.card_url ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border/50 overflow-hidden">
                      <img src={user.card_url} alt="Activation Card" className="w-full h-auto block" />
                    </div>
                    <div className="flex gap-3">
                      <a
                        href={user.card_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent"
                      >
                        Open
                      </a>
                      <a
                        href={user.card_url}
                        download={`activation-card-${displayName || "user"}.png`}
                        className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-primary-foreground text-sm hover:bg-primary/90"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No activation card found on your profile.</div>
                )}
              </CardContent>
            </Card>

            {/* Right: Transactions */}
            <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">Recent Transactions</CardTitle>
                    <CardDescription>Your latest financial activity</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select value={filter} onValueChange={(v: "All" | "Purchase" | "Top-up") => setFilter(v)}>
                      <SelectTrigger className="w-36 rounded-xl border-border/50">
                        <SelectValue placeholder="Filter" />
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
                {txError && (
                  <div className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    {txError}
                  </div>
                )}

                {loadingTx ? (
                  <div className="animate-pulse rounded-xl border border-border/50 p-6 text-muted-foreground">
                    Loading transactions…
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-border/50 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/50">
                            <TableHead className="font-semibold whitespace-nowrap">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSort("date")}
                                className="h-8 p-0 font-semibold hover:bg-transparent"
                              >
                                Date
                                {sortField === "date" ? (
                                  sortDirection === "asc" ? (
                                    <ArrowUp className="ml-2 h-4 w-4" />
                                  ) : (
                                    <ArrowDown className="ml-2 h-4 w-4" />
                                  )
                                ) : (
                                  <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                                )}
                              </Button>
                            </TableHead>
                            <TableHead className="font-semibold whitespace-nowrap">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSort("type")}
                                className="h-8 p-0 font-semibold hover:bg-transparent"
                              >
                                Type
                                {sortField === "type" ? (
                                  sortDirection === "asc" ? (
                                    <ArrowUp className="ml-2 h-4 w-4" />
                                  ) : (
                                    <ArrowDown className="ml-2 h-4 w-4" />
                                  )
                                ) : (
                                  <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                                )}
                              </Button>
                            </TableHead>
                            <TableHead className="text-right font-semibold whitespace-nowrap">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSort("amount")}
                                className="h-8 p-0 font-semibold hover:bg-transparent"
                              >
                                Amount
                                {sortField === "amount" ? (
                                  sortDirection === "asc" ? (
                                    <ArrowUp className="ml-2 h-4 w-4" />
                                  ) : (
                                    <ArrowDown className="ml-2 h-4 w-4" />
                                  )
                                ) : (
                                  <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                                )}
                              </Button>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginated.map((t, index) => (
                            <TableRow
                              key={t.id}
                              className={`hover:bg-muted/30 transition-colors ${
                                index % 2 === 0 ? "bg-background" : "bg-muted/10"
                              }`}
                            >
                              <TableCell className="font-medium whitespace-nowrap">
                                {formatDate(t.date)}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <Badge
                                  className={`rounded-full ${
                                    t.type === "Top-up"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                      : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                                  }`}
                                >
                                  {t.type === "Top-up" ? (
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3 mr-1" />
                                  )}
                                  {t.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-semibold whitespace-nowrap">
                                <span
                                  className={
                                    t.amount >= 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }
                                >
                                  Rs {t.amount.toFixed ? t.amount.toFixed(2) : t.amount}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination bar */}
                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-sm text-muted-foreground">
                        Showing{" "}
                        <span className="font-medium">
                          {filteredTransactions.length === 0 ? 0 : startIndex + 1}
                        </span>
                        –<span className="font-medium">{endIndex}</span> of{" "}
                        <span className="font-medium">{filteredTransactions.length}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          Prev
                        </Button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5)
                          .map((p) => (
                            <Button
                              key={p}
                              variant={p === page ? "default" : "outline"}
                              size="sm"
                              className="rounded-xl w-9"
                              onClick={() => setPage(p)}
                            >
                              {p}
                            </Button>
                          ))}

                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>

                    {filteredTransactions.length === 0 && !txError && (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="text-lg font-medium mb-2">No transactions found</div>
                        <p className="text-sm">Try adjusting your filter to see more results.</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
