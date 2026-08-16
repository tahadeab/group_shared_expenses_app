import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { AppError } from "./utils";

export const getCurrentUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      _id: user._id,
      name: user.name,
      email: (user as any).email,
      image: (user as any).image,
    };
  },
});

export const setName = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AppError("Not authenticated");
    }
    const trimmed = args.name.trim();
    if (trimmed.length === 0) {
      throw new AppError("Name cannot be empty");
    }
    if (trimmed.length > 50) {
      throw new AppError("Name must be 50 characters or fewer");
    }
    await ctx.db.patch(userId, { name: trimmed });
    return true;
  },
});
