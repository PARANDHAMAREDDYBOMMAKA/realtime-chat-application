import { QueryCtx, MutationCtx } from "./_generated/server";

export const getUserByClerjId = async ({
    ctx, clerkId
}: { ctx: QueryCtx | MutationCtx; clerkId: string }) => {
    return await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId)).first();
}

export const getCurrentUser = async (ctx: QueryCtx | MutationCtx, identity: any) => {
    return await getUserByClerjId({ ctx, clerkId: identity.subject });
}

export function capitalizeName(name: string | undefined | null): string {
    if (!name) return "";
    return name
        .split(" ")
        .map(word => {
            if (word.length === 0) return "";
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
}