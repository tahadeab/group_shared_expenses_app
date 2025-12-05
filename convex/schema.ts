import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  groups: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
    inviteCode: v.string(),
  }).index("by_invite_code", ["inviteCode"]),

  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_group_and_user", ["groupId", "userId"]),

  expenses: defineTable({
    groupId: v.id("groups"),
    description: v.string(),
    amount: v.number(),
    paidBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_group", ["groupId"]),

  payments: defineTable({
    groupId: v.id("groups"),
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    amount: v.number(),
    createdAt: v.number(),
  }).index("by_group", ["groupId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
