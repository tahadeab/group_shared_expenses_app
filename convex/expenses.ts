import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const addExpense = mutation({
  args: {
    groupId: v.id("groups"),
    description: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user is a member of the group
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", args.groupId).eq("userId", userId))
      .unique();

    if (!membership) {
      throw new Error("Not a member of this group");
    }

    if (args.amount <= 0) {
      throw new Error("Amount must be positive");
    }

    return await ctx.db.insert("expenses", {
      groupId: args.groupId,
      description: args.description,
      amount: args.amount,
      paidBy: userId,
      createdAt: Date.now(),
    });
  },
});

export const recordPayment = mutation({
  args: {
    groupId: v.id("groups"),
    toUserId: v.id("users"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user is a member of the group
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", args.groupId).eq("userId", userId))
      .unique();

    if (!membership) {
      throw new Error("Not a member of this group");
    }

    // Check if recipient is a member of the group
    const recipientMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", args.groupId).eq("userId", args.toUserId))
      .unique();

    if (!recipientMembership) {
      throw new Error("Recipient is not a member of this group");
    }

    if (args.amount <= 0) {
      throw new Error("Amount must be positive");
    }

    if (userId === args.toUserId) {
      throw new Error("Cannot pay yourself");
    }

    return await ctx.db.insert("payments", {
      groupId: args.groupId,
      fromUserId: userId,
      toUserId: args.toUserId,
      amount: args.amount,
      createdAt: Date.now(),
    });
  },
});
