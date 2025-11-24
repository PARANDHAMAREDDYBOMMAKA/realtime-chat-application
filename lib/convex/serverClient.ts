import { ConvexHttpClient } from 'convex/browser';
import { auth } from '@clerk/nextjs/server';

/**
 * Get authenticated Convex client for server-side API routes
 * This ensures Convex queries have proper authentication
 */
export async function getAuthenticatedConvexClient() {
  const { getToken } = await auth();
  const token = await getToken({ template: 'convex' });

  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  if (token) {
    client.setAuth(token);
  }

  return client;
}

/**
 * Unauthenticated Convex client for public data
 */
export function getConvexClient() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}
