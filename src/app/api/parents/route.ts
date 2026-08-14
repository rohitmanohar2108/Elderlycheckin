import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

// Middleware to verify JWT token
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
    const { 
      name, 
      phoneNumber, 
      preferredLanguage = 'en', 
      checkInTime, 
      timezone = 'Asia/Kolkata' 
    } = body;

    if (!name || !phoneNumber || !checkInTime) {
      return NextResponse.json(
        { error: 'Name, phone number, and check-in time are required' },
        { status: 400 }
      );
    }

    // Create parent record
    const result = await query(
      `INSERT INTO parents (child_id, name, phone_number, preferred_language, check_in_time, timezone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, phone_number, preferred_language, check_in_time, timezone`,
      [user.userId, name, phoneNumber, preferredLanguage, checkInTime, timezone]
    );

    const parent = result.rows[0];

    return NextResponse.json(
      { 
        message: 'Parent registered successfully',
        parent: {
          id: parent.id,
          name: parent.name,
          phoneNumber: parent.phone_number,
          preferredLanguage: parent.preferred_language,
          checkInTime: parent.check_in_time,
          timezone: parent.timezone
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Parent registration error:', error);
    
    // Handle duplicate phone number error
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A parent with this phone number already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await query(
      `SELECT id, name, phone_number, preferred_language, check_in_time, timezone, created_at
       FROM parents
       WHERE child_id = $1
       ORDER BY created_at DESC`,
      [user.userId]
    );

    const parents = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      phoneNumber: row.phone_number,
      preferredLanguage: row.preferred_language,
      checkInTime: row.check_in_time,
      timezone: row.timezone,
      createdAt: row.created_at
    }));

    return NextResponse.json({ parents }, { status: 200 });
  } catch (error) {
    console.error('Get parents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
