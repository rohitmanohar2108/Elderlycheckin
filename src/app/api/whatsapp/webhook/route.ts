import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Twilio webhook structure
    const { From, Body, MessageSid } = body;
    
    if (!From || !Body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Extract phone number (remove 'whatsapp:' prefix if present)
    const phoneNumber = From.replace('whatsapp:', '');
    const messageText = Body.trim();
    const messageType = 'text'; // For MVP, we assume text. Voice notes would need transcription

    // Find parent by phone number
    const parentResult = await query(
      'SELECT id, name FROM parents WHERE phone_number = $1',
      [phoneNumber]
    );

    if (parentResult.rows.length === 0) {
      console.log('No parent found for phone number:', phoneNumber);
      return NextResponse.json({ message: 'No matching parent found' }, { status: 200 });
    }

    const parent = parentResult.rows[0];

    // Find today's check-in for this parent
    const today = new Date().toISOString().split('T')[0];
    const checkInResult = await query(
      'SELECT id FROM check_ins WHERE parent_id = $1 AND scheduled_date = $2',
      [parent.id, today]
    );

    if (checkInResult.rows.length === 0) {
      console.log('No check-in found for parent', parent.id, 'today');
      return NextResponse.json({ message: 'No check-in scheduled for today' }, { status: 200 });
    }

    const checkIn = checkInResult.rows[0];

    // Update check-in with response
    await query(
      `UPDATE check_ins 
       SET response_received_at = NOW(), 
           response_text = $1, 
           response_type = $2
       WHERE id = $3`,
      [messageText, messageType, checkIn.id]
    );

    console.log(`Response recorded for parent ${parent.name} (${parent.id})`);

    // Send acknowledgment message
    // For MVP, we'll send a simple acknowledgment
    // In production, this could be more sophisticated

    return NextResponse.json({ message: 'Response recorded successfully' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Twilio requires a GET endpoint for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'webhook active' }, { status: 200 });
}
