import { NextResponse } from 'next/server';
import { cacheService } from '@/lib/redis';

/**
 * GET /api/cache/get?key=xxx
 *
 * Get data from Redis cache
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      );
    }

    const data = await cacheService.get(key);

    if (data === null) {
      console.log(`[Redis] Cache MISS: ${key}`);
      return NextResponse.json({ data: null, cached: false });
    }

    console.log(`[Redis] Cache HIT: ${key}`);
    return NextResponse.json({ data, cached: true });
  } catch (error) {
    console.error('Error getting from cache:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
