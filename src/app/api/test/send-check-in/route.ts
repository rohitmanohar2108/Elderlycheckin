import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { sendWhatsAppMessage, getCheckInMessage } from '@/lib/whatsapp';

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_jwt_secret_key'
    ) as { userId: number; email: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { parentId } = body;

    if (!parentId) {
      return NextResponse.json(
        { error: 'Parent ID is required' },
        { status: 400 }
      );
    }

    // Get parent details
    const parentResult = await query(
      'SELECT * FROM parents WHERE id = $1 AND child_id = $2',
      [parentId, user.userId]
    );

    if (parentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Parent not found or unauthorized' },
        { status: 404 }
      );
    }

    const parent = parentResult.rows[0];

    // Check if check-in already sent today
    const today = new Date().toISOString().split('T')[0];
    const existingCheckIn = await query(
      'SELECT id FROM check_ins WHERE parent_id = $1 AND scheduled_date = $2',
      [parentId, today]
    );

    if (existingCheckIn.rows.length > 0) {
      return NextResponse.json(
        { error: 'Check-in already sent today' },
        { status: 400 }
      );
    }

    // Send WhatsApp message
    const message = getCheckInMessage(parent.name, parent.preferred_language);
    await sendWhatsAppMessage(parent.phone_number, message);

    // Create check-in record
    await query(
      `INSERT INTO check_ins (parent_id, scheduled_date, message_sent_at)
       VALUES ($1, $2, NOW())`,
      [parentId, today]
    );

    return NextResponse.json(
      { 
        message: 'Test check-in sent successfully',
        parent: {
          id: parent.id,
          name: parent.name,
          phoneNumber: parent.phone_number,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Test check-in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
