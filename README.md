# Daily Check-In Service for Elderly Parents

A daily check-in service for elderly parents in India, used by their adult children living abroad. The service sends daily WhatsApp messages to parents and tracks their responses.

## Features

- **Daily WhatsApp Check-ins**: Automated daily messages to parents in their preferred language
- **Multi-language Support**: Supports Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Bengali, and English
- **Response Tracking**: Records parent responses and timestamps
- **Missed Response Alerts**: Notifies children if parents don't respond within 2 hours
- **Dashboard**: Web interface for children to view check-in history and manage parent details
- **Simple for Parents**: No app required - parents respond via WhatsApp

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL
- **WhatsApp**: Twilio WhatsApp Business API
- **Scheduler**: node-cron for daily message scheduling
- **Authentication**: JWT tokens with bcrypt password.hashing

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- PostgreSQL database running locally or on a cloud service
- Twilio account with WhatsApp Business API enabled

#### PostgreSQL Setup Options

**Option A: Local PostgreSQL (Mac/Linux)**
```bash
# Install PostgreSQL
brew install postgresql
brew services start postgresql

# Create database
createdb elderly_checkin

# Create user (optional)
psql postgres
CREATE USER elderly_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE elderly_checkin TO elderly_user;
\q
```

**Option B: Docker**
```bash
docker run --name elderly-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=elderly_checkin \
  -p 5432:5432 \
  -d postgres
```

**Option C: Cloud PostgreSQL (Supabase, Neon, etc.)**
- Create a free account on Supabase or Neon
- Create a new database
- Copy the connection string

### 2. Environment Configuration

Copy `config.example.ts` to create your configuration:

```bash
cp config.example.ts config.ts
```

Update `config.ts` with your actual credentials:

```typescript
export const config = {
  DATABASE_URL: 'postgresql://user:password@localhost:5432/elderly_checkin',
  TWILIO_ACCOUNT_SID: 'your_account_sid',
  TWILIO_AUTH_TOKEN: 'your_auth_token',
  TWILIO_WHATSAPP_NUMBER: 'whatsapp:+14155238886',
  JWT_SECRET: 'your_jwt_secret_key',
  APP_URL: 'http://localhost:3000',
};
```

Set these as environment variables or update the code to use your config file.

### 3. Database Setup

The database schema is automatically initialized when the server starts. The schema includes:
- `children`: Adult children who register and pay
- `parents`: Elderly parents being checked on
- `check_ins`: Daily check-in records

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 6. Database Initialization

The database schema will be automatically created when you first run the application. Alternatively, you can manually initialize it:

```bash
npx tsx scripts/init.ts
```

### 7. Seed Test Data (Optional)

To populate the database with test data:

```bash
npx tsx scripts/seed-test-data.ts
```

This creates:
- Test user: `test@example.com` / `test123`
- Test parent with sample check-in records

### 8. Twilio Webhook Setup

Configure your Twilio WhatsApp webhook URL to:
```
https://your-domain.com/api/whatsapp/webhook
```

For local development, use ngrok or similar to expose your localhost:
```bash
ngrok http 3000
```

Then set your Twilio webhook to the ngrok URL.

## Testing the End-to-End Flow

### Manual Test Setup

1. **Create a Test Account**
   - Navigate to `http://localhost:3000/signup`
   - Register with your email, WhatsApp number, and password

2. **Add a Parent**
   - Login and go to the dashboard
   - Click "Add Parent"
   - Enter parent details (name, phone, preferred language, check-in time)

3. **Test WhatsApp Message**
   - Use the test endpoint to manually trigger a check-in:
   ```bash
   curl -X POST http://localhost:3000/api/test/send-check-in \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"parentId": PARENT_ID}'
   ```

4. **Simulate Parent Response**
   - When the parent receives the WhatsApp message, have them reply
   - The webhook at `/api/whatsapp/webhook` will capture the response

5. **View Check-in History**
   - Check the dashboard to see the recorded response

### API Endpoints

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/parents` - Get list of parents (authenticated)
- `POST /api/parents` - Add new parent (authenticated)
- `GET /api/parents/:id/check-ins` - Get check-in history for a parent (authenticated)
- `POST /api/whatsapp/webhook` - Twilio webhook for receiving WhatsApp messages

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── signup/route.ts
│   │   ├── parents/
│   │   │   ├── route.ts
│   │   │   └── [id]/check-ins/route.ts
│   │   └── whatsapp/
│   │       └── webhook/route.ts
│   ├── dashboard/page.tsx
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── page.tsx
├── lib/
│   ├── db.ts
│   ├── init-db.ts
│   ├── schema.sql
│   ├── scheduler.ts
│   ├── server-init.ts
│   └── whatsapp.ts
└── middleware.ts
```

## Future Enhancements

The code is structured to support future enhancements:

- **AI Conversation Handler**: Swap in a conversation module for more natural check-ins
- **Voice Note Transcription**: Add transcription for voice note responses
- **Concern Detection**: Auto-detect concerning responses using AI
- **Email Summaries**: Send daily summaries via email in addition to WhatsApp
- **Multiple Children**: Allow multiple children to monitor the same parent
- **Payment Integration**: Add payment processing for the service

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- API routes are protected with middleware
- Never commit actual credentials to version control

## License

MIT
