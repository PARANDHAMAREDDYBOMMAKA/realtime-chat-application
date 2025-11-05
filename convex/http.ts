import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";

const validatePayload = async (req: Request): Promise<WebhookEvent | undefined> => {
    const payload = await req.text();

    const svixHeaders = {
        "svix-id": req.headers.get("svix-id")!,
        "svix-timestamp": req.headers.get("svix-timestamp")!,
        "svix-signature": req.headers.get("svix-signature")!,
    };

    const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

    try {
        const event = webhook.verify(payload, svixHeaders) as WebhookEvent;
        return event;
    } catch (err) {
        console.error("Webhook verification failed:", err);
        return undefined;
    }
};

const handleClerkWebhook = httpAction(async (ctx, req) => {
    const event = await validatePayload(req);

    if (!event) {
        return new Response("Invalid payload", { status: 400 });
    }

    switch (event.type) {
        case "user.created": {
            const user = await ctx.runQuery(internal.user.get, { clerkId: event.data.id });
            const email = event.data.email_addresses?.[0]?.email_address ?? "";

            // Check if user with this email already exists
            const existingUserByEmail = await ctx.runQuery(internal.user.getByEmail, { email });

            if (!user && !existingUserByEmail) {
                console.log(`Creating new user ${event.data.id}`);
                await ctx.runMutation(internal.user.create, {
                    username: `${event.data.first_name} ${event.data.last_name}`,
                    imageUrl: event.data.image_url,
                    clerkId: event.data.id,
                    email,
                });
            } else if (user) {
                console.log(`User ${event.data.id} already exists, skipping creation`);
            } else if (existingUserByEmail) {
                console.log(`User with email ${email} already exists, skipping creation`);
            }
            break;
        }
        case "user.updated": {
            console.log("Updating user", event.data);

            await ctx.runMutation(internal.user.update, {
                username: `${event.data.first_name} ${event.data.last_name}`,
                imageUrl: event.data.image_url,
                clerkId: event.data.id,
                email: event.data.email_addresses?.[0]?.email_address ?? "",
            });
            break;
        }
        default: {
            console.log("Clerk webhook event not supported:", event.type);
            break;
        }
    }

    return new Response(null, { status: 200 });
});


const http = httpRouter();

http.route({
    path: "/clerk-users-webhook",
    method: "POST",
    handler: handleClerkWebhook,
});

export default http;
