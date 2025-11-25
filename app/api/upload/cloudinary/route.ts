import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';
import { cacheService } from '@/lib/redis';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/upload/cloudinary
 *
 * Upload image to Cloudinary with Redis caching
 * Body: FormData with 'file' field
 * Query params: ?type=avatar|message|story|group (default: message)
 */
export async function POST(request: Request) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get upload type from query params
    const { searchParams } = new URL(request.url);
    const uploadType = searchParams.get('type') || 'message';

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Only image and video files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    // Determine folder and transformations based on type
    const folderMap: Record<string, string> = {
      avatar: 'avatars',
      group: 'groups',
      message: 'messages',
      story: 'stories',
    };

    const folder = folderMap[uploadType] || 'messages';

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: `chat-app/${folder}`,
      resource_type: 'auto',
      transformation: uploadType === 'avatar' || uploadType === 'group'
        ? [
            { width: 400, height: 400, crop: 'fill', gravity: 'auto' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ]
        : uploadType === 'story'
        ? [
            { width: 600, height: 1067, crop: 'fill' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ]
        : [
            { width: 800, crop: 'limit' },
            { quality: 'auto:low' },
            { fetch_format: 'auto' },
          ],
    });

    const imageData = {
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      resourceType: uploadResult.resource_type,
      bytes: uploadResult.bytes,
      uploadedAt: new Date().toISOString(),
    };

    // Cache the image data in Redis (1 week TTL)
    const cacheKey = `cloudinary:${uploadResult.public_id}`;
    await cacheService.set(cacheKey, imageData, 604800); // 1 week

    console.log(`[Cloudinary] Uploaded ${uploadType}: ${uploadResult.public_id}`);

    return NextResponse.json({
      success: true,
      data: imageData,
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload/cloudinary?publicId=xxx
 *
 * Get cached image data from Redis or fetch from Cloudinary
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return NextResponse.json(
        { error: 'publicId is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `cloudinary:${publicId}`;
    const cachedData = await cacheService.get(cacheKey);

    if (cachedData) {
      console.log(`[Cloudinary] Cache hit: ${publicId}`);
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }

    // Fetch from Cloudinary if not in cache
    try {
      const result = await cloudinary.api.resource(publicId);

      const imageData = {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        resourceType: result.resource_type,
        bytes: result.bytes,
        uploadedAt: result.created_at,
      };

      // Cache for future requests
      await cacheService.set(cacheKey, imageData, 604800); // 1 week

      console.log(`[Cloudinary] Fetched and cached: ${publicId}`);

      return NextResponse.json({
        success: true,
        data: imageData,
        cached: false,
      });
    } catch (cloudinaryError) {
      console.error('Error fetching from Cloudinary:', cloudinaryError);
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error getting image data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
