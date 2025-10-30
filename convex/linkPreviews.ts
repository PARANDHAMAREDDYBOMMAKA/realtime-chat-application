import { ConvexError, v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Fetch link preview metadata
export const fetchLinkPreview = action({
    args: {
        url: v.string(),
    },
    handler: async (ctx, args) => {
        try {
            const response = await fetch(args.url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)",
                },
            });

            if (!response.ok) {
                return null;
            }

            const html = await response.text();

            // Extract Open Graph tags and basic meta tags
            const title =
                extractMetaTag(html, 'property="og:title"') ||
                extractMetaTag(html, 'name="twitter:title"') ||
                extractTitleTag(html) ||
                "";

            const description =
                extractMetaTag(html, 'property="og:description"') ||
                extractMetaTag(html, 'name="twitter:description"') ||
                extractMetaTag(html, 'name="description"') ||
                "";

            const image =
                extractMetaTag(html, 'property="og:image"') ||
                extractMetaTag(html, 'name="twitter:image"') ||
                "";

            const siteName =
                extractMetaTag(html, 'property="og:site_name"') ||
                new URL(args.url).hostname;

            return {
                url: args.url,
                title,
                description,
                image,
                siteName,
            };
        } catch (error) {
            console.error("Error fetching link preview:", error);
            return null;
        }
    },
});

// Helper function to extract meta tags
function extractMetaTag(html: string, attribute: string): string {
    const regex = new RegExp(
        `<meta\\s+${attribute}\\s+content="([^"]*)"`,
        "i"
    );
    const match = html.match(regex);
    return match ? match[1] : "";
}

// Helper function to extract title tag
function extractTitleTag(html: string): string {
    const regex = /<title[^>]*>([^<]*)<\/title>/i;
    const match = html.match(regex);
    return match ? match[1].trim() : "";
}

// Save link preview to database
export const saveLinkPreview = mutation({
    args: {
        messageId: v.id("messages"),
        url: v.string(),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        image: v.optional(v.string()),
        siteName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if preview already exists
        const existing = await ctx.db
            .query("linkPreviews")
            .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
            .filter((q) => q.eq(q.field("url"), args.url))
            .first();

        if (existing) {
            return existing._id;
        }

        // Create new link preview
        const previewId = await ctx.db.insert("linkPreviews", {
            messageId: args.messageId,
            url: args.url,
            title: args.title,
            description: args.description,
            image: args.image,
            siteName: args.siteName,
            createdAt: Date.now(),
        });

        return previewId;
    },
});

// Get link previews for a message
export const getMessageLinkPreviews = query({
    args: {
        messageId: v.id("messages"),
    },
    handler: async (ctx, args) => {
        const previews = await ctx.db
            .query("linkPreviews")
            .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
            .collect();

        return previews;
    },
});

// Fetch and save link preview (action that can be scheduled)
export const fetchAndSaveLinkPreview = action({
    args: {
        messageId: v.id("messages"),
        url: v.string(),
    },
    handler: async (ctx, args) => {
        try {
            const response = await fetch(args.url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)",
                },
            });

            if (!response.ok) {
                return null;
            }

            const html = await response.text();

            // Extract Open Graph tags and basic meta tags
            const title =
                extractMetaTag(html, 'property="og:title"') ||
                extractMetaTag(html, 'name="twitter:title"') ||
                extractTitleTag(html) ||
                "";

            const description =
                extractMetaTag(html, 'property="og:description"') ||
                extractMetaTag(html, 'name="twitter:description"') ||
                extractMetaTag(html, 'name="description"') ||
                "";

            const image =
                extractMetaTag(html, 'property="og:image"') ||
                extractMetaTag(html, 'name="twitter:image"') ||
                "";

            const siteName =
                extractMetaTag(html, 'property="og:site_name"') ||
                new URL(args.url).hostname;

            // Save the preview
            await ctx.runMutation(api.linkPreviews.saveLinkPreview, {
                messageId: args.messageId,
                url: args.url,
                title,
                description,
                image,
                siteName,
            });

            return { url: args.url, title, description, image, siteName };
        } catch (error) {
            console.error("Error fetching link preview:", error);
            return null;
        }
    },
});

// Extract URLs from text
export const extractUrls = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches || [];
};
