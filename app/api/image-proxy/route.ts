import { NextResponse } from 'next/server';
import { cacheService } from '@/lib/redis';

/**
 * GET /api/image-proxy?url=xxx
 *
 * Proxy and cache images in Redis (Base64 encoded)
 * This reduces external image loading time significantly
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Create cache key from URL
    const cacheKey = `image:${Buffer.from(imageUrl).toString('base64').slice(0, 50)}`;

    // Try to get from cache first
    const cached = await cacheService.get<{
      data: string;
      contentType: string;
    }>(cacheKey);

    if (cached) {
      console.log(`[Image Cache] HIT: ${imageUrl.slice(0, 50)}...`);

      // Return cached image
      const imageBuffer = Buffer.from(cached.data, 'base64');
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': 'public, max-age=86400', // 24 hours
          'X-Cache-Status': 'HIT',
        },
      });
    }

    console.log(`[Image Cache] MISS: ${imageUrl.slice(0, 50)}...`);

    // Fetch image from external URL
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Store in Redis as Base64 (24 hour TTL)
    await cacheService.set(
      cacheKey,
      {
        data: buffer.toString('base64'),
        contentType,
      },
      86400 // 24 hours
    );

    console.log(`[Image Cache] Cached: ${imageUrl.slice(0, 50)}... (${(buffer.length / 1024).toFixed(2)} KB)`);

    // Return image
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'X-Cache-Status': 'MISS',
      },
    });
  } catch (error) {
    console.error('Error in image proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
