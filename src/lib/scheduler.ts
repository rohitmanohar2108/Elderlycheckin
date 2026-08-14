import cron from 'node-cron';
import { query } from './db';
import { sendWhatsAppMessage, getCheckInMessage } from './whatsapp';

// Function to send daily check-in messages
async function sendDailyCheckIns() {
  try {
    console.log('Starting daily check-in process...');
    
    // Get all parents with their scheduled check-in time
    const result = await query(`
      SELECT p.id, p.name, p.phone_number, p.preferred_language, p.check_in_time, p.timezone
      FROM parents p
    `);

    const parents = result.rows;
    console.log(`Found ${parents.length} parents to check in`);

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    for (const parent of parents) {
      try {
        // Check if it's time for this parent's check-in
        // For MVP, we'll check if current time matches their scheduled time
        if (parent.check_in_time === currentTime) {
          // Check if check-in already sent today
          const today = now.toISOString().split('T')[0];
          const existingCheckIn = await query(
            'SELECT id FROM check_ins WHERE parent_id = $1 AND scheduled_date = $2',
            [parent.id, today]
          );

          if (existingCheckIn.rows.length === 0) {
            // Send WhatsApp message
            const message = getCheckInMessage(parent.name, parent.preferred_language);
            await sendWhatsAppMessage(parent.phone_number, message);

            // Create check-in record
            await query(
              `INSERT INTO check_ins (parent_id, scheduled_date, message_sent_at)
               VALUES ($1, $2, NOW())`,
              [parent.id, today]
            );

            console.log(`Check-in sent to parent ${parent.name} (${parent.id})`);
          } else {
            console.log(`Check-in already sent to parent ${parent.name} (${parent.id}) today`);
          }
        }
      } catch (error) {
        console.error(`Error processing check-in for parent ${parent.id}:`, error);
      }
    }

    console.log('Daily check-in process completed');
  } catch (error) {
    console.error('Error in daily check-in process:', error);
  }
}

// Function to check for missed responses and send summaries
async function checkMissedResponses() {
  try {
    console.log('Checking for missed responses...');
    
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Get check-ins where message was sent but no response received after 2 hours
    const result = await query(`
      SELECT ci.id, ci.parent_id, p.name, p.phone_number, p.preferred_language,
             c.whatsapp_number, c.email, ci.scheduled_date, ci.message_sent_at
      FROM check_ins ci
      JOIN parents p ON ci.parent_id = p.id
      JOIN children c ON p.child_id = c.id
      WHERE ci.message_sent_at IS NOT NULL
        AND ci.response_received_at IS NULL
        AND ci.summary_sent_at IS NULL
        AND ci.message_sent_at < $1
    `, [twoHoursAgo]);

    const missedCheckIns = result.rows;
    console.log(`Found ${missedCheckIns.length} missed responses`);

    for (const checkIn of missedCheckIns) {
      try {
        // Send alert to child
        const alertMessage = `⚠️ Alert: ${checkIn.name} has not responded to today's check-in. Last check-in was sent at ${checkIn.message_sent_at}. Please contact them directly.`;
        
        await sendWhatsAppMessage(checkIn.whatsapp_number, alertMessage);

        // Mark summary as sent
        await query(
          'UPDATE check_ins SET summary_sent_at = NOW(), summary_sent_to = $1 WHERE id = $2',
          ['whatsapp', checkIn.id]
        );

        console.log(`Alert sent to child for parent ${checkIn.name}`);
      } catch (error) {
        console.error(`Error sending alert for check-in ${checkIn.id}:`, error);
      }
    }

    console.log('Missed response check completed');
  } catch (error) {
    console.error('Error checking missed responses:', error);
  }
}

// Start the scheduler
export function startScheduler() {
  console.log('Starting scheduler...');
  
  // Run every minute to check for scheduled check-ins
  cron.schedule('* * * * *', sendDailyCheckIns);
  
  // Run every 30 minutes to check for missed responses
  cron.schedule('*/30 * * * *', checkMissedResponses);
  
  console.log('Scheduler started successfully');
}

// Manual trigger for testing
export async function triggerDailyCheckIns() {
  await sendDailyCheckIns();
}

export async function triggerMissedResponseCheck() {
  await checkMissedResponses();
}
