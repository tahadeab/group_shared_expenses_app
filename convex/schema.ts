import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User profile information shared across groups.
  // Mirrors the fields of authTables.users so we can add custom
  // profile fields while keeping the auth table structure intact.
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  groups: defineTable({
    name: v.string(),
    currency: v.string(),
    createdBy: v.id("users"),
    inviteCode: v.string(),
  })
    .index("by_invite_code", ["inviteCode"])
    .index("by_creator", ["createdBy"]),

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
    category: v.string(),
    note: v.optional(v.string()),
    paidBy: v.id("users"),
    splitAmong: v.optional(v.array(v.id("users"))),
    createdAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_paid_by", ["paidBy"]),

  payments: defineTable({
    groupId: v.id("groups"),
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    amount: v.number(),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_from", ["fromUserId"])
    .index("by_to", ["toUserId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
