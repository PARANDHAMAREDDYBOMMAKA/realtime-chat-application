import { QueryCtx, MutationCtx } from "./_generated/server";

export const getUserByClerjId = async ({
    ctx, clerkId
}: { ctx: QueryCtx | MutationCtx; clerkId: string }) => {
    return await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId)).unique();
}

export const getCurrentUser = async (ctx: QueryCtx | MutationCtx, identity: any) => {
    return await getUserByClerjId({ ctx, clerkId: identity.subject });
}