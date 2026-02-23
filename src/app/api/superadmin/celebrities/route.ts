// /api/superadmin/celebrities — GET list + POST create (superadmin only)
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';

async function handler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // ── GET: paginated list ───────────────────────────────────────────────
    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      const page  = Math.max(1, parseInt(searchParams.get('page')  || '1', 10));
      const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
      const q     = (searchParams.get('q') || '').trim();
      const status = searchParams.get('status') || '';

      const filter: Record<string, any> = {};
      if (q) filter.$or = [
        { name:       { $regex: q, $options: 'i' } },
        { slug:       { $regex: q, $options: 'i' } },
        { nationality:{ $regex: q, $options: 'i' } },
      ];
      if (status) filter.status = status;

      const [total, docs] = await Promise.all([
        Celebrity.countDocuments(filter),
        Celebrity.find(filter)
          .select('name slug nationality occupation profileImage status isActive isFeatured isVerified contentQuality popularity createdAt')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
      ]);

      const data = docs.map((d: any) => {
        const obj = { ...d, id: String(d._id) };
        delete obj._id; delete obj.__v;
        return obj;
      });

      return NextResponse.json({ success: true, data, total, page, limit, pages: Math.ceil(total / limit) });
    }

    // ── POST: create ─────────────────────────────────────────────────────
    if (request.method === 'POST') {
      let body: any = {};
      try { body = await request.json(); } catch {
        return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
      }

      const { name, slug, nationality, occupation, introduction, status: s, profileImage } = body;

      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json({ success: false, message: 'Name is required (min 2 characters)' }, { status: 400 });
      }

      // Auto-generate slug from name if not provided
      const finalSlug = (slug || name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      // Check slug uniqueness
      const existing = await Celebrity.findOne({ slug: finalSlug });
      if (existing) {
        return NextResponse.json({ success: false, message: 'A celebrity with this slug already exists' }, { status: 409 });
      }

      const celebrity = await Celebrity.create({
        name:             name.trim(),
        slug:             finalSlug,
        born:             body.born?.trim()             || undefined,
        birthPlace:       body.birthPlace?.trim()       || undefined,
        died:             body.died?.trim()             || undefined,
        age:              body.age                      || undefined,
        nationality:      nationality?.trim()           || '',
        citizenship:      Array.isArray(body.citizenship)     ? body.citizenship     : [],
        occupation:       Array.isArray(occupation)           ? occupation           : occupation ? [occupation] : [],
        yearsActive:      body.yearsActive?.trim()      || undefined,
        height:           body.height?.trim()           || undefined,
        weight:           body.weight?.trim()           || undefined,
        bodyMeasurements: body.bodyMeasurements?.trim() || undefined,
        eyeColor:         body.eyeColor?.trim()         || undefined,
        hairColor:        body.hairColor?.trim()        || undefined,
        spouse:           body.spouse?.trim()           || undefined,
        children:         Array.isArray(body.children)         ? body.children         : [],
        parents:          Array.isArray(body.parents)          ? body.parents          : [],
        siblings:         Array.isArray(body.siblings)         ? body.siblings         : [],
        relatives:        Array.isArray(body.relatives)        ? body.relatives        : [],
        education:        Array.isArray(body.education)        ? body.education        : [],
        netWorth:         body.netWorth?.trim()         || undefined,
        introduction:     introduction?.trim()          || '',
        earlyLife:        body.earlyLife?.trim()        || undefined,
        career:           body.career?.trim()           || undefined,
        personalLife:     body.personalLife?.trim()     || undefined,
        achievements:     Array.isArray(body.achievements)     ? body.achievements     : [],
        controversies:    Array.isArray(body.controversies)    ? body.controversies    : [],
        philanthropy:     Array.isArray(body.philanthropy)     ? body.philanthropy     : [],
        trivia:           Array.isArray(body.trivia)           ? body.trivia           : [],
        works:            Array.isArray(body.works)            ? body.works            : [],
        quotes:           Array.isArray(body.quotes)           ? body.quotes           : [],
        tags:             Array.isArray(body.tags)             ? body.tags             : [],
        categories:       Array.isArray(body.categories)       ? body.categories       : [],
        language:         body.language                || 'en',
        profileImage:     profileImage?.trim()         || '',
        coverImage:       body.coverImage?.trim()      || undefined,
        galleryImages:    Array.isArray(body.galleryImages)    ? body.galleryImages    : [],
        status:           ['draft', 'published', 'archived'].includes(s) ? s : 'draft',
        contentQuality:   ['draft', 'review', 'published', 'archived'].includes(body.contentQuality) ? body.contentQuality : 'draft',
        isActive:         body.isActive  !== undefined ? Boolean(body.isActive)  : true,
        isFeatured:       body.isFeatured !== undefined ? Boolean(body.isFeatured) : false,
        isVerified:       body.isVerified !== undefined ? Boolean(body.isVerified) : false,
        socialMedia: {
          instagram: body.socialMedia?.instagram || '',
          twitter:   body.socialMedia?.twitter   || '',
          facebook:  body.socialMedia?.facebook  || '',
          youtube:   body.socialMedia?.youtube   || '',
          tiktok:    body.socialMedia?.tiktok    || '',
          website:   body.socialMedia?.website   || '',
        },
        seo: {
          metaTitle:         body.seo?.metaTitle         || '',
          metaDescription:   body.seo?.metaDescription   || '',
          focusKeyword:      body.seo?.focusKeyword      || '',
          metaKeywords:      Array.isArray(body.seo?.metaKeywords) ? body.seo.metaKeywords : [],
          canonicalUrl:      body.seo?.canonicalUrl      || '',
          ogTitle:           body.seo?.ogTitle           || '',
          ogDescription:     body.seo?.ogDescription     || '',
          ogImages:          Array.isArray(body.seo?.ogImages)    ? body.seo.ogImages    : [],
          twitterCard:       body.seo?.twitterCard       || 'summary_large_image',
          twitterCreator:    body.seo?.twitterCreator    || '',
          schemaType:        body.seo?.schemaType        || 'Person',
          noindex:           body.seo?.noindex           ?? false,
          nofollow:          body.seo?.nofollow          ?? false,
          section:           body.seo?.section           || '',
          tags:              [],
          alternateLangs:    [],
          canonicalAlternates: [],
          relatedTopics:     [],
        },
        relatedCelebrities: [],
        newsArticles:       [],
        movies:             [],
      });

      const obj: any = celebrity.toObject();
      obj.id = String(obj._id); delete obj._id; delete obj.__v;

      return NextResponse.json({ success: true, data: obj }, { status: 201 });
    }

    return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('Superadmin celebrities error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'A celebrity with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}

export const GET  = withAuth(handler, ['superadmin']);
export const POST = withAuth(handler, ['superadmin']);
