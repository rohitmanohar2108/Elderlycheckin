import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const parentId = parseInt(params.id);

    // Verify that this parent belongs to the authenticated user
    const parentCheck = await query(
      'SELECT child_id FROM parents WHERE id = $1',
      [parentId]
    );

    if (parentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      );
    }

    if (parentCheck.rows[0].child_id !== user.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get check-ins for this parent
    const result = await query(
      `SELECT id, scheduled_date, message_sent_at, response_received_at, 
              response_text, response_type, summary_sent_at, summary_sent_to
       FROM check_ins
       WHERE parent_id = $1
       ORDER BY scheduled_date DESC`,
      [parentId]
    );

    const checkIns = result.rows.map(row => ({
      id: row.id,
      scheduledDate: row.scheduled_date,
      messageSentAt: row.message_sent_at,
      responseReceivedAt: row.response_received_at,
      responseText: row.response_text,
      responseType: row.response_type,
      summarySentAt: row.summary_sent_at,
      summarySentTo: row.summary_sent_to,
    }));

    return NextResponse.json({ checkIns }, { status: 200 });
  } catch (error) {
    console.error('Get check-ins error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
