import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { AppError } from "./utils";

export const createGroup = mutation({
  args: {
    name: v.string(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AppError("Not authenticated");
    }

    if (!args.name.trim()) {
      throw new AppError("Group name is required");
    }
    if (args.name.trim().length < 2) {
      throw new AppError("Group name must be at least 2 characters");
    }
    if (args.name.trim().length > 50) {
      throw new AppError("Group name must be 50 characters or fewer");
    }

    // Generate a unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const groupId = await ctx.db.insert("groups", {
      name: args.name.trim(),
      currency: args.currency,
      createdBy: userId,
      inviteCode,
    });

    // Add creator as first member
    await ctx.db.insert("groupMembers", {
      groupId,
      userId,
      joinedAt: Date.now(),
    });

    return groupId;
  },
});

export const joinGroup = mutation({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AppError("Not authenticated");
    }

    const group = await ctx.db
      .query("groups")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode.toUpperCase()))
      .unique();

    if (!group) {
      throw new AppError("Invalid invite code");
    }

    // Check if user is already a member
    const existingMember = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", group._id).eq("userId", userId))
      .unique();

    if (existingMember) {
      throw new AppError("You are already a member of this group");
    }

    await ctx.db.insert("groupMembers", {
      groupId: group._id,
      userId,
      joinedAt: Date.now(),
    });

    return group._id;
  },
});

export const leaveGroup = mutation({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AppError("Not authenticated");
    }

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", args.groupId).eq("userId", userId))
      .unique();

    if (!membership) {
      throw new AppError("You are not a member of this group");
    }

    // Prevent the creator from leaving if they are the only member
    const memberCount = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect()
      .then((m) => m.length);

    if (memberCount <= 1) {
      throw new AppError("You cannot leave while being the last member; delete the group instead");
    }

    await ctx.db.delete(membership._id);
    return true;
  },
});

export const getUserGroups = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const groupsWithStats = await Promise.all(
      memberships.map(async (membership) => {
        const group = await ctx.db.get(membership.groupId);
        if (!group) return null;

        const memberCount = await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .collect()
          .then((m) => m.length);

        const totalSpent = await ctx.db
          .query("expenses")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .collect()
          .then((expenses) => expenses.reduce((sum, e) => sum + e.amount, 0));

        return { group, memberCount, totalSpent };
      }),
    );

    return groupsWithStats.filter(Boolean) as {
      group: NonNullable<Awaited<ReturnType<typeof ctx.db.get>> & { _id: any; name: string; currency: string; inviteCode: string }>;
      memberCount: number;
      totalSpent: number;
    }[];
  },
});

export const getGroupDetails = query({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AppError("Not authenticated");
    }

    // Check if user is a member
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", args.groupId).eq("userId", userId))
      .unique();

    if (!membership) {
      throw new AppError("You are not a member of this group");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new AppError("Group not found");
    }

    // Get all members
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          userId: m.userId,
          name: user?.name,
          email: (user as any)?.email,
          image: (user as any)?.image,
        };
      }),
    );

    // Get expenses
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .collect();

    const expensesWithUsers = await Promise.all(
      expenses.map(async (expense) => {
        const paidByUser = await ctx.db.get(expense.paidBy);
        return {
          ...expense,
          paidByName: paidByUser?.name,
          paidByEmail: (paidByUser as any)?.email,
        };
      }),
    );

    // Get payments
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .collect();

    const paymentsWithUsers = await Promise.all(
      payments.map(async (payment) => {
        const fromUser = await ctx.db.get(payment.fromUserId);
        const toUser = await ctx.db.get(payment.toUserId);
        return {
          ...payment,
          fromName: fromUser?.name,
          fromEmail: (fromUser as any)?.email,
          toName: toUser?.name,
          toEmail: (toUser as any)?.email,
        };
      }),
    );

    // Calculate balances: total paid / split logic
    const memberCount = members.length;
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Each member's fair share (default equal split if splitAmong is not set)
    const balances = members.map((member) => {
      const paidExpenses = expenses
        .filter((expense) => expense.paidBy === member.userId)
        .reduce((sum, expense) => {
          const splitList = expense.splitAmong;
          if (splitList && splitList.length > 0) {
            return sum + (splitList.includes(member.userId) ? expense.amount / splitList.length : 0);
          }
          return sum + expense.amount / memberCount;
        }, 0);

      // What this member owes (their share of everyone's expenses)
      const owesAmount = expenses.reduce((sum, expense) => {
        const splitList = expense.splitAmong;
        if (splitList && splitList.length > 0) {
          return sum + (splitList.includes(member.userId) ? expense.amount / splitList.length : 0);
        }
        return sum + expense.amount / memberCount;
      }, 0);

      const paidToOthers = payments
        .filter((payment) => payment.fromUserId === member.userId)
        .reduce((sum, payment) => sum + payment.amount, 0);

      const receivedFromOthers = payments
        .filter((payment) => payment.toUserId === member.userId)
        .reduce((sum, payment) => sum + payment.amount, 0);

      // Positive = group owes this member, Negative = member owes the group
      const netBalance = paidExpenses - owesAmount + paidToOthers - receivedFromOthers;

      return {
        ...member,
        paidExpenses,
        owesAmount,
        paidToOthers,
        receivedFromOthers,
        netBalance,
      };
    });

    return {
      group,
      members: balances,
      expenses: expensesWithUsers,
      payments: paymentsWithUsers,
    };
  },
});

/**
 * Compute a simplified settlement plan: who should pay whom to settle all
 * balances with the minimum number of transactions.
 */
export const getSettlementPlan = query({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AppError("Not authenticated");
    }

    const details = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", args.groupId).eq("userId", userId))
      .unique()
      .then(async (membership) => {
        if (!membership) {
          throw new AppError("You are not a member of this group");
        }
        return await ctx.db.get(args.groupId);
      });

    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new AppError("Group not found");
    }

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          userId: m.userId,
          name: user?.name,
          email: (user as any)?.email,
        };
      }),
    );

    const memberCount = members.length;

    // Compute net balance for each member
    const netBalanceByMember = new Map<string, number>();
    for (const member of members) {
      let paid = 0;
      let owed = 0;
      for (const expense of expenses) {
        const splitList = expense.splitAmong;
        const share =
          splitList && splitList.length > 0
            ? splitList.includes(member.userId)
              ? expense.amount / splitList.length
              : 0
            : expense.amount / memberCount;
        if (expense.paidBy === member.userId) {
          paid += expense.amount;
        }
        owed += share;
      }
      for (const payment of payments) {
        if (payment.fromUserId === member.userId) paid += payment.amount;
        if (payment.toUserId === member.userId) paid -= payment.amount;
      }
      netBalanceByMember.set(member.userId, paid - owed);
    }

    // Greedy min-transaction algorithm
    const debtors = members
      .map((m) => ({ ...m, balance: netBalanceByMember.get(m.userId) ?? 0 }))
      .filter((m) => m.balance < -0.005)
      .sort((a, b) => a.balance - b.balance);
    const creditors = members
      .map((m) => ({ ...m, balance: netBalanceByMember.get(m.userId) ?? 0 }))
      .filter((m) => m.balance > 0.005)
      .sort((a, b) => b.balance - a.balance);

    const plan: { fromId: string; fromName: string; toId: string; toName: string; amount: number }[] = [];
    let i = 0;
    let j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(-debtors[i].balance, creditors[j].balance);
      plan.push({
        fromId: debtors[i].userId,
        fromName: debtors[i].name || debtors[i].email || "Member",
        toId: creditors[j].userId,
        toName: creditors[j].name || creditors[j].email || "Member",
        amount: Math.round(amount * 100) / 100,
      });
      debtors[i].balance += amount;
      creditors[j].balance -= amount;
      if (debtors[i].balance > -0.005) i++;
      if (creditors[j].balance < 0.005) j++;
    }

    return { plan, totalSettled: plan.reduce((s, p) => s + p.amount, 0) };
  },
});
