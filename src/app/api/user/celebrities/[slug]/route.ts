import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';

function isAuthorized(req: NextRequest): boolean {
  return req.headers.get('x-api-key') === process.env.X_API_KEY;
}

// GET /api/user/celebrities/[slug]
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized: invalid or missing x-api-key' },
      { status: 401 }
    );
  }

  try {
    await dbConnect();

    const slug = params.slug?.toLowerCase().trim();
    if (!slug) {
      return NextResponse.json({ success: false, message: 'Missing slug' }, { status: 400 });
    }

    const doc = await Celebrity.findOne({
      slug,
      isActive: true,
      $or: [{ status: { $exists: false } }, { status: 'published' }],
    })
      .select('-__v')
      .lean();

    if (!doc) {
      return NextResponse.json({ success: false, message: 'Celebrity not found' }, { status: 404 });
    }

    // Increment view count (fire-and-forget)
    Celebrity.findByIdAndUpdate(doc._id, { $inc: { viewCount: 1 } }).exec();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const celebrity: Record<string, any> = { ...(doc as any), id: String((doc as any)._id) };
    delete celebrity._id;

    return NextResponse.json({ success: true, celebrity });
  } catch (err) {
    console.error('[GET /api/user/celebrities/[slug]]', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
