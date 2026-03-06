// DELETE /api/user/account — permanently delete the logged-in user's account
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import UserOutfit from '@/models/UserOutfit';

async function deleteAccount(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Password is required to delete account.' },
        { status: 400 }
      );
    }

    const userId = request.user?.userId;

    // Fetch user with password field
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    // Verify password before allowing deletion
    const valid = await user.comparePassword(password);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: 'Incorrect password.' },
        { status: 400 }
      );
    }

    // Remove all uploads by this user
    await UserOutfit.deleteMany({ userId });

    // Delete the user document
    await User.findByIdAndDelete(userId);

    return NextResponse.json({ success: true, message: 'Account deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to delete account.' },
      { status: 500 }
    );
  }
}

export const DELETE = withAuth(deleteAccount);
