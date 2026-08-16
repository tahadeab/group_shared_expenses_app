import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { AppError, positiveAmount } from "./utils";

export const addExpense = mutation({
  args: {
    groupId: v.id("groups"),
    description: v.string(),
    amount: v.number(),
    category: v.string(),
    note: v.optional(v.string()),
    splitAmong: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AppError("Not authenticated");
    }

    // Check if user is a member of the group
    await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", args.groupId).eq("userId", userId))
      .unique()
      .then((m) => {
        if (!m) throw new AppError("You are not a member of this group");
      });

    if (!args.description.trim()) {
      throw new AppError("Description is required");
    }
    if (args.description.trim().length > 200) {
      throw new AppError("Description must be 200 characters or fewer");
    }

    positiveAmount(args.amount);

    // Validate split list if provided
    if (args.splitAmong && args.splitAmong.length > 0) {
      for (const memberId of args.splitAmong) {
        const isMember = await ctx.db
          .query("groupMembers")
          .withIndex("by_group_and_user", (q) => q.eq("groupId", args.groupId).eq("userId", memberId))
          .unique();
        if (!isMember) {
          throw new AppError("Invalid member in split list");
        }
      }
    }

    return await ctx.db.insert("expenses", {
      groupId: args.groupId,
      description: args.description.trim(),
      amount: Math.round(args.amount * 100) / 100,
      category: args.category,
      note: args.note?.trim(),
      paidBy: userId,
      splitAmong: args.splitAmong,
      createdAt: Date.now(),
    });
  },
});

export const deleteExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AppError("Not authenticated");
    }

    const expense = await ctx.db.get(args.expenseId);
    if (!expense) {
      throw new AppError("Expense not found");
    }

    // Only group members can delete expenses in their group
    await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", expense.groupId).eq("userId", userId),
      )
      .unique()
      .then((m) => {
        if (!m) throw new AppError("You are not a member of this group");
      });

    await ctx.db.delete(args.expenseId);
    return true;
  },
});

export const recordPayment = mutation({
  args: {
    groupId: v.id("groups"),
    toUserId: v.id("users"),
    amount: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AppError("Not authenticated");
    }

    // Check if user is a member of the group
    await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", args.groupId).eq("userId", userId))
      .unique()
      .then((m) => {
        if (!m) throw new AppError("You are not a member of this group");
      });

    // Check if recipient is a member of the group
    const recipientMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", args.groupId).eq("userId", args.toUserId))
      .unique();

    if (!recipientMembership) {
      throw new AppError("Recipient is not a member of this group");
    }

    if (userId === args.toUserId) {
      throw new AppError("You cannot pay yourself");
    }

    positiveAmount(args.amount);

    return await ctx.db.insert("payments", {
      groupId: args.groupId,
      fromUserId: userId,
      toUserId: args.toUserId,
      amount: Math.round(args.amount * 100) / 100,
      note: args.note?.trim(),
      createdAt: Date.now(),
    });
  },
});

export const deletePayment = mutation({
  args: {
    paymentId: v.id("payments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AppError("Not authenticated");
    }

    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new AppError("Payment not found");
    }

    // Only members involved in or part of the group can delete the payment
    await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", payment.groupId).eq("userId", userId),
      )
      .unique()
      .then((m) => {
        if (!m) throw new AppError("You are not a member of this group");
      });

    await ctx.db.delete(args.paymentId);
    return true;
  },
});
