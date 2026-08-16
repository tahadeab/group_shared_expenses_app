import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  ArrowRightLeft,
  Trash2,
  Copy,
  Check,
  DoorOpen,
  MoreHorizontal,
  TrendingDown,
  TrendingUp,
  Receipt,
  ArrowRight,
  Users,
} from "lucide-react";
import { EXPENSE_CATEGORIES, currencySymbol } from "../../convex/utils";
import { formatCurrency, formatDate, displayName } from "@/lib/format";
import { SettlementPlan } from "./SettlementPlan";
import { CategoryBadge } from "./CategoryBadge";

interface GroupDetailsProps {
  groupId: Id<"groups">;
}

export function GroupDetails({ groupId }: GroupDetailsProps) {
  const groupData = useQuery(api.groups.getGroupDetails, { groupId });
  const settlement = useQuery(api.groups.getSettlementPlan, { groupId });
  const currentUser = useQuery(api.auth.loggedInUser);
  const addExpense = useMutation(api.expenses.addExpense);
  const deleteExpense = useMutation(api.expenses.deleteExpense);
  const recordPayment = useMutation(api.expenses.recordPayment);
  const deletePayment = useMutation(api.expenses.deletePayment);
  const leaveGroup = useMutation(api.groups.leaveGroup);

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [note, setNote] = useState("");
  const [splitMode, setSplitMode] = useState<"all" | "selected">("all");
  const [splitSelection, setSplitSelection] = useState<Id<"users">[]>([]);
  const [recipient, setRecipient] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyInviteCode = () => {
    void (async () => {
      if (!groupData) return;
      try {
        await navigator.clipboard.writeText(groupData.group.inviteCode);
        setCopied(true);
        toast.success("Invite code copied!");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Could not copy to clipboard");
      }
    })();
  };

  const resetExpenseForm = () => {
    setDescription("");
    setAmount("");
    setNote("");
    setCategory("food");
    setSplitMode("all");
    setSplitSelection([]);
  };

  const resetPaymentForm = () => {
    setRecipient("");
    setPaymentAmount("");
    setPaymentNote("");
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || !groupData) return;

    void (async () => {
      setLoading(true);
      try {
        const splitAmong =
          splitMode === "selected"
            ? splitSelection.length > 0
              ? splitSelection
              : undefined
            : undefined;
        await addExpense({
          groupId,
          description: description.trim(),
          amount: parseFloat(amount),
          category,
          note: note.trim() || undefined,
          splitAmong,
        });
        resetExpenseForm();
        setExpenseOpen(false);
        toast.success("Expense added successfully!");
      } catch (error: any) {
        toast.error("Failed to add expense", { description: error?.message });
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !paymentAmount) return;

    void (async () => {
      setLoading(true);
      try {
        await recordPayment({
          groupId,
          toUserId: recipient as Id<"users">,
          amount: parseFloat(paymentAmount),
          note: paymentNote.trim() || undefined,
        });
        resetPaymentForm();
        setPaymentOpen(false);
        toast.success("Payment recorded successfully!");
      } catch (error: any) {
        toast.error("Failed to record payment", { description: error?.message });
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleLeaveGroup = () => {
    void (async () => {
      try {
        await leaveGroup({ groupId });
        toast.success("You left the group");
        window.location.reload();
      } catch (error: any) {
        toast.error("Failed to leave group", { description: error?.message });
      }
    })();
  };

  const handleDeleteExpense = (expenseId: Id<"expenses">) => {
    void (async () => {
      try {
        await deleteExpense({ expenseId });
        toast.success("Expense deleted");
      } catch (error: any) {
        toast.error("Failed to delete", { description: error?.message });
      }
    })();
  };

  const handleDeletePayment = (paymentId: Id<"payments">) => {
    void (async () => {
      try {
        await deletePayment({ paymentId });
        toast.success("Payment deleted");
      } catch (error: any) {
        toast.error("Failed to delete", { description: error?.message });
      }
    })();
  };

  if (groupData === undefined) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { group, members, expenses, payments } = groupData;
  const symbol = currencySymbol(group.currency);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPayments = payments.reduce((s, p) => s + p.amount, 0);
  const currencyCode = group.currency;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{group.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  {members.length} {members.length === 1 ? "member" : "members"}
                </Badge>
                <Badge variant="outline">{group.currency}</Badge>
                <div className="flex items-center gap-1 bg-gray-100 rounded-md px-2 py-1">
                  <span className="text-xs text-gray-500">Invite:</span>
                  <span className="font-mono text-xs font-semibold">{group.inviteCode}</span>
                  <button
                    onClick={copyInviteCode}
                    className="ml-1 text-gray-400 hover:text-primary transition-colors"
                    title="Copy invite code"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => { resetExpenseForm(); setExpenseOpen(true); }}>
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
              <Button variant="outline" onClick={() => { resetPaymentForm(); setPaymentOpen(true); }}>
                <ArrowRightLeft className="h-4 w-4" />
                Settle Up
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={handleLeaveGroup}
                  >
                    <DoorOpen className="h-4 w-4" />
                    Leave group
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Expenses</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {formatCurrency(totalExpenses, currencyCode)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Settlements Made</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {formatCurrency(totalPayments, currencyCode)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 col-span-2 sm:col-span-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pending Balances</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {members.filter((m) => Math.abs(m.netBalance) > 0.005).length}{" "}
                {members.filter((m) => Math.abs(m.netBalance) > 0.005).length === 1 ? "person" : "people"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add an expense</DialogTitle>
            <DialogDescription>
              Record an expense paid on behalf of the group.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Dinner at the Italian restaurant"
                required
                maxLength={200}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Amount ({group.currency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Paid with credit card"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label>Split among</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={splitMode === "all" ? "default" : "outline"}
                  onClick={() => setSplitMode("all")}
                >
                  Everyone
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={splitMode === "selected" ? "default" : "outline"}
                  onClick={() => setSplitMode("selected")}
                >
                  Selected only
                </Button>
              </div>
              {splitMode === "selected" && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {members.map((m) => (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() => {
                        setSplitSelection((prev) =>
                          prev.includes(m.userId)
                            ? prev.filter((id) => id !== m.userId)
                            : [...prev, m.userId],
                        );
                      }}
                      className={`px-2 py-1 rounded-full text-xs border transition-colors ${
                        splitSelection.includes(m.userId)
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-600 border-gray-300"
                      }`}
                    >
                      {displayName({ name: m.name, email: m.email })}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setExpenseOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settle Up Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record a payment</DialogTitle>
            <DialogDescription>
              Record a payment from you to another member to settle balances.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="space-y-2">
              <Label>Pay to</Label>
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {members
                    .filter((m) => m.userId !== currentUser?._id)
                    .map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {displayName({ name: m.name, email: m.email })}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount ({group.currency})</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="e.g. Cash, bank transfer"
                maxLength={200}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Recording..." : "Record payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Settle Up</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="expenses">
            Expenses
            {expenses.length > 0 && (
              <span className="ml-1 bg-primary/10 text-primary rounded-full px-1.5 text-xs">
                {expenses.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="payments">
            Payments
            {payments.length > 0 && (
              <span className="ml-1 bg-primary/10 text-primary rounded-full px-1.5 text-xs">
                {payments.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Settle Up / Settlement Plan */}
        <TabsContent value="overview">
          <SettlementPlan
            plan={settlement?.plan ?? []}
            currency={currencyCode}
            members={members.map((m) => ({
              userId: m.userId,
              name: m.name,
              email: m.email,
            }))}
          />
          {/* Member balances */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Member balances</CardTitle>
              <CardDescription>
                Positive means others owe this member; negative means they owe the group.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                        {displayName({ name: member.name, email: member.email }).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {displayName({ name: member.name, email: member.email })}
                        </p>
                        {member.userId === currentUser?._id && (
                          <span className="text-xs text-gray-400">You</span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold whitespace-nowrap ${
                        member.netBalance > 0.005
                          ? "text-green-600"
                          : member.netBalance < -0.005
                            ? "text-red-600"
                            : "text-gray-500"
                      }`}
                    >
                      {member.netBalance > 0.005 ? "+" : ""}
                      {formatCurrency(member.netBalance, currencyCode)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members */}
        <TabsContent value="members">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Members ({members.length})</CardTitle>
              <CardDescription>
                Share the invite code below to invite others to this group.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                      {displayName({ name: member.name, email: member.email }).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {displayName({ name: member.name, email: member.email })}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {member.email || "No email"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">
                      Joined {formatDate(member.joinedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Expenses</CardTitle>
                <CardDescription>All expenses recorded in this group.</CardDescription>
              </div>
              <Button size="sm" onClick={() => { resetExpenseForm(); setExpenseOpen(true); }}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Receipt className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No expenses yet. Add the first one!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {expenses.map((expense) => (
                    <div
                      key={expense._id}
                      className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 group"
                    >
                      <CategoryBadge category={expense.category} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{expense.description}</p>
                        <p className="text-xs text-gray-400">
                          Paid by {displayName({ name: expense.paidByName, email: expense.paidByEmail })} ·{" "}
                          {formatDate(expense.createdAt)}
                          {expense.note ? ` · ${expense.note}` : ""}
                          {expense.splitAmong && expense.splitAmong.length > 0 ? " · split" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-sm">
                          {formatCurrency(expense.amount, currencyCode)}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => handleDeleteExpense(expense._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Payments</CardTitle>
                <CardDescription>Recorded payments that settle group balances.</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => { resetPaymentForm(); setPaymentOpen(true); }}>
                <ArrowRightLeft className="h-4 w-4" />
                Settle Up
              </Button>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <ArrowRightLeft className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No payments recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div
                      key={payment._id}
                      className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 group"
                    >
                      <div className="h-8 w-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {displayName({ name: payment.fromName, email: payment.fromEmail })}
                          <span className="text-gray-400 font-normal"> → </span>
                          {displayName({ name: payment.toName, email: payment.toEmail })}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(payment.createdAt)}
                          {payment.note ? ` · ${payment.note}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-sm text-green-700">
                          {formatCurrency(payment.amount, currencyCode)}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => handleDeletePayment(payment._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
