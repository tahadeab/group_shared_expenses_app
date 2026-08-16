/**
 * Shared backend utilities for the expense sharing application.
 */

export class AppError extends Error {}

export function positiveAmount(amount: number): void {
  if (!Number.isFinite(amount)) {
    throw new AppError("Amount must be a valid number");
  }
  if (amount <= 0) {
    throw new AppError("Amount must be greater than zero");
  }
  if (amount > 10_000_000_000) {
    throw new AppError("Amount is too large");
  }
  // Round to 2 decimal places
  if (Math.round(amount * 100) / 100 !== amount) {
    throw new AppError("Amount cannot have more than 2 decimal places");
  }
}

/**
 * Verify that the current user is a member of the given group.
 * Returns the membership document if authorized.
 */
export async function requireGroupMembership(
  ctx: any,
  groupId: any,
): Promise<any> {
  const membership = await ctx.db
    .query("groupMembers")
    .withIndex("by_group_and_user", (q: any) =>
      q.eq("groupId", groupId).eq("userId", ctx.userId),
    )
    .unique();
  if (!membership) {
    throw new AppError("You are not a member of this group");
  }
  return membership;
}

export const EXPENSE_CATEGORIES = [
  { id: "food", label: "Food & Drinks", icon: "UtensilsCrossed" },
  { id: "groceries", label: "Groceries", icon: "ShoppingCart" },
  { id: "transport", label: "Transport", icon: "Car" },
  { id: "housing", label: "Housing & Bills", icon: "Home" },
  { id: "entertainment", label: "Entertainment", icon: "Film" },
  { id: "shopping", label: "Shopping", icon: "Bag" },
  { id: "health", label: "Health", icon: "HeartPulse" },
  { id: "travel", label: "Travel", icon: "Plane" },
  { id: "other", label: "Other", icon: "MoreHorizontal" },
] as const;

export type CategoryId = (typeof EXPENSE_CATEGORIES)[number]["id"];

export const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "SAR", symbol: "﷼", label: "Saudi Riyal" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
  { code: "EGP", symbol: "E£", label: "Egyptian Pound" },
  { code: "KWD", symbol: "د.ك", label: "Kuwaiti Dinar" },
  { code: "JOD", symbol: "د.أ", label: "Jordanian Dinar" },
  { code: "QAR", symbol: "ر.ق", label: "Qatari Riyal" },
  { code: "TRY", symbol: "₺", label: "Turkish Lira" },
  { code: "MAD", symbol: "د.م.", label: "Moroccan Dirham" },
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "CNY", symbol: "¥", label: "Chinese Yuan" },
] as const;

export function currencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}
