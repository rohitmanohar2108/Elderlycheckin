import { query } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function seedTestData() {
  try {
    console.log('Seeding test data...');

    // Create test child user
    const passwordHash = await bcrypt.hash('test123', 10);
    const childResult = await query(
      `INSERT INTO children (email, whatsapp_number, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET whatsapp_number = $2, password_hash = $3
       RETURNING id`,
      ['test@example.com', '+1234567890', passwordHash]
    );
    const childId = childResult.rows[0].id;
    console.log('Created test child:', childId);

    // Create test parent
    const parentResult = await query(
      `INSERT INTO parents (child_id, name, phone_number, preferred_language, check_in_time, timezone)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (phone_number) DO UPDATE SET name = $2, preferred_language = $4, check_in_time = $5
       RETURNING id`,
      [childId, 'Test Parent', '+919876543210', 'en', '10:00', 'Asia/Kolkata']
    );
    const parentId = parentResult.rows[0].id;
    console.log('Created test parent:', parentId);

    // Create some test check-ins
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Yesterday's check-in (with response)
    await query(
      `INSERT INTO check_ins (parent_id, scheduled_date, message_sent_at, response_received_at, response_text)
       VALUES ($1, $2, NOW() - INTERVAL '24 hours', NOW() - INTERVAL '23 hours', $3)
       ON CONFLICT (parent_id, scheduled_date) DO NOTHING`,
      [parentId, yesterday.toISOString().split('T')[0], 'I am doing well today. Had my meals and medicines on time.']
    );

    // Today's check-in (message sent, no response yet)
    await query(
      `INSERT INTO check_ins (parent_id, scheduled_date, message_sent_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (parent_id, scheduled_date) DO NOTHING`,
      [parentId, today.toISOString().split('T')[0]]
    );

    console.log('Test data seeded successfully');
    console.log('\nTest credentials:');
    console.log('Email: test@example.com');
    console.log('Password: test123');
    console.log('Parent ID:', parentId);
  } catch (error) {
    console.error('Error seeding test data:', error);
    process.exit(1);
  }
}

seedTestData();
