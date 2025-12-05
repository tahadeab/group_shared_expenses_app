import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createGroup = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Generate a unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const groupId = await ctx.db.insert("groups", {
      name: args.name,
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
      throw new Error("Not authenticated");
    }

    const group = await ctx.db
      .query("groups")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .unique();

    if (!group) {
      throw new Error("Invalid invite code");
    }

    // Check if user is already a member
    const existingMember = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", group._id).eq("userId", userId))
      .unique();

    if (existingMember) {
      throw new Error("Already a member of this group");
    }

    await ctx.db.insert("groupMembers", {
      groupId: group._id,
      userId,
      joinedAt: Date.now(),
    });

    return group._id;
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

    const groups = await Promise.all(
      memberships.map(async (membership) => {
        const group = await ctx.db.get(membership.groupId);
        return group;
      })
    );

    return groups.filter(Boolean);
  },
});

export const getGroupDetails = query({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user is a member
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", args.groupId).eq("userId", userId))
      .unique();

    if (!membership) {
      throw new Error("Not a member of this group");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    // Get all members
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        return {
          ...membership,
          user,
        };
      })
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
          paidByUser,
        };
      })
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
          fromUser,
          toUser,
        };
      })
    );

    // Calculate balances
    const memberCount = members.length;
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const sharePerMember = totalExpenses / memberCount;

    const balances = members.map((member) => {
      const paidExpenses = expenses
        .filter((expense) => expense.paidBy === member.userId)
        .reduce((sum, expense) => sum + expense.amount, 0);

      const paidToOthers = payments
        .filter((payment) => payment.fromUserId === member.userId)
        .reduce((sum, payment) => sum + payment.amount, 0);

      const receivedFromOthers = payments
        .filter((payment) => payment.toUserId === member.userId)
        .reduce((sum, payment) => sum + payment.amount, 0);

      const netBalance = paidExpenses + paidToOthers - sharePerMember - receivedFromOthers;

      return {
        ...member,
        paidExpenses,
        paidToOthers,
        receivedFromOthers,
        shareAmount: sharePerMember,
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
