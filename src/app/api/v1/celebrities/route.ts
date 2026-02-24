/**
 * GET /api/v1/celebrities
 * ────────────────────────
 * Public API — requires x-api-key header.
 * Query params:
 *   page      (default 1)
 *   limit     (default 20, max 50)
 *   search    name search
 *   occupation
 *   nationality
 *   sort      name_asc | name_desc | latest | oldest  (default latest)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/apiKeyMiddleware';
import dbConnect from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';

export async function GET(request: NextRequest) {
  return withApiKey(request, async (req) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(req.url);
      const page     = Math.max(1, parseInt(searchParams.get('page')  || '1'));
      const limit    = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
      const search   = searchParams.get('search')   || '';
      const occupation   = searchParams.get('occupation')   || '';
      const nationality  = searchParams.get('nationality')  || '';
      const sort         = searchParams.get('sort') || 'latest';
      const skip = (page - 1) * limit;

      const query: Record<string, any> = {};
      if (search)      query.name = { $regex: search, $options: 'i' };
      if (occupation)  query.occupation = { $in: [occupation] };
      if (nationality) query.nationality = { $regex: nationality, $options: 'i' };

      const sortMap: Record<string, any> = {
        name_asc:  { name: 1 },
        name_desc: { name: -1 },
        latest:    { createdAt: -1 },
        oldest:    { createdAt: 1 },
      };
      const sortObj = sortMap[sort] || sortMap.latest;

      const [celebrities, total] = await Promise.all([
        Celebrity.find(query)
          .select('name slug profileImage occupation nationality netWorth born age gender categories isVerified createdAt')
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
        Celebrity.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        version: 'v1',
        resource: 'celebrities',
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        data: celebrities,
      });
    } catch (error) {
      console.error('v1/celebrities error:', error);
      return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
  });
}
