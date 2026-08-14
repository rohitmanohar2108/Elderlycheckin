import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://rohitvijaymanohar@localhost:5432/elderly_checkin',
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
