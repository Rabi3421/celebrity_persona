// GET /api/user/news/[slug] — public, fetch a single news article by slug
// Optionally decodes Bearer token to return personal like/save/comment status
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CelebrityNews from '@/models/CelebrityNews';
import Celebrity from '@/models/Celebrity';
import TokenService from '@/lib/tokenService';
import mongoose from 'mongoose';
import { publicNewsFilter, serializeNews } from '@/lib/celebrityNews';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug?.toLowerCase().trim();
  if (!slug) {
    return NextResponse.json({ success: false, message: 'Missing slug' }, { status: 400 });
  }

  try {
    await dbConnect();
    void Celebrity.modelName;

    // Try slug first, fall back to ObjectId
    let article: any = await CelebrityNews.findOne(publicNewsFilter({ slug }))
      .populate('celebrity primaryCelebrity', 'name slug profileImage')
      .lean();

    if (!article && slug.match(/^[a-f\d]{24}$/i)) {
      article = await CelebrityNews.findOne(publicNewsFilter({ _id: slug }))
        .populate('celebrity primaryCelebrity', 'name slug profileImage')
        .lean();
    }

    if (!article) {
      return NextResponse.json({ success: false, message: 'Article not found' }, { status: 404 });
    }

    // Optionally resolve the logged-in user from Bearer token
    let userId: mongoose.Types.ObjectId | null = null;
    try {
      const auth = request.headers.get('authorization') ?? '';
      if (auth.startsWith('Bearer ')) {
        const payload = TokenService.verifyAccessToken(auth.replace('Bearer ', '').trim());
        if (payload?.userId) userId = new mongoose.Types.ObjectId(payload.userId as string);
      }
    } catch { /* not logged in */ }

    const likes:    any[] = article.likes    ?? [];
    const saves:    any[] = article.saves    ?? [];
    const comments: any[] = article.comments ?? [];

    const liked  = userId ? likes.some((id: any)  => String(id) === String(userId)) : false;
    const saved  = userId ? saves.some((id: any)   => String(id) === String(userId)) : false;

    // Fetch related: same category, latest 3
    const related = await CelebrityNews.find({
      _id:      { $ne: article._id },
      status:   'published',
      $or: [
        { category: article.category || { $exists: true } },
        { primaryCelebritySlug: article.primaryCelebritySlug || '__none__' },
        { 'relatedCelebrities.slug': article.primaryCelebritySlug || '__none__' },
      ],
    })
      .select('-content -body -seo -comments -likes -saves')
      .sort({ publishedAt: -1, publishDate: -1, createdAt: -1 })
      .limit(3)
      .lean();

    const normalizedArticle = serializeNews(article);

    return NextResponse.json({
      success: true,
      article: {
        ...normalizedArticle,
        likeCount:    likes.length,
        saveCount:    saves.length,
        commentCount: comments.length,
        liked,
        saved,
        comments: comments.slice().reverse().slice(0, 50).map((c: any) => ({
          id:         String(c._id),
          userId:     String(c.userId),
          userName:   c.userName,
          userAvatar: c.userAvatar || '',
          text:       c.text,
          createdAt:  c.createdAt,
          isOwn:      userId ? String(c.userId) === String(userId) : false,
        })),
      },
      related: related.map(serializeNews),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
