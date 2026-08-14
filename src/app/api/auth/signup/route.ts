import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, whatsappNumber, password } = body;

    if (!email || !whatsappNumber || !password) {
      return NextResponse.json(
        { error: 'Email, WhatsApp number, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM children WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      'INSERT INTO children (email, whatsapp_number, password_hash) VALUES ($1, $2, $3) RETURNING id, email, whatsapp_number',
      [email, whatsappNumber, passwordHash]
    );

    const user = result.rows[0];

    // Generate JWT token for auto-login
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );

    return NextResponse.json(
      { 
        message: 'User created successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          whatsappNumber: user.whatsapp_number
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
