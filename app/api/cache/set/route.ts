import { NextResponse } from 'next/server';
import { cacheService } from '@/lib/redis';

/**
 * POST /api/cache/set
 *
 * Store data in Redis cache
 * Body: { key: string, data: any, ttl: number }
 */
export async function POST(request: Request) {
  try {
    const { key, data, ttl } = await request.json();

    if (!key) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      );
    }

    await cacheService.set(key, data, ttl);

    console.log(`[Redis] Cached: ${key} (TTL: ${ttl}s)`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting cache:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
