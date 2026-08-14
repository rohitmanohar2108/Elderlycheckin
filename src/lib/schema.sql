-- Children table (adult children who register and pay)
CREATE TABLE IF NOT EXISTS children (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  whatsapp_number VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parents table (elderly parents being checked on)
CREATE TABLE IF NOT EXISTS parents (
  id SERIAL PRIMARY KEY,
  child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  preferred_language VARCHAR(50) DEFAULT 'en',
  check_in_time TIME NOT NULL,
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Check-ins table (daily check-in records)
CREATE TABLE IF NOT EXISTS check_ins (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER REFERENCES parents(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  message_sent_at TIMESTAMP,
  response_received_at TIMESTAMP,
  response_text TEXT,
  response_type VARCHAR(20) DEFAULT 'text', -- 'text' or 'voice'
  summary_sent_at TIMESTAMP,
  summary_sent_to VARCHAR(50), -- 'whatsapp' or 'email'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(parent_id, scheduled_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_check_ins_parent_id ON check_ins(parent_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_scheduled_date ON check_ins(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_parents_child_id ON parents(child_id);
