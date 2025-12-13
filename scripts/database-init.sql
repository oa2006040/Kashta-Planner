-- Kashta Database Initialization Script
-- This script creates all tables if they don't exist and adds missing columns
-- Safe to run multiple times (idempotent)

-- ==========================================
-- SESSIONS TABLE (Required for authentication)
-- ==========================================
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions(expire);

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR UNIQUE,
    username VARCHAR UNIQUE,
    password_hash VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    phone VARCHAR,
    profile_image_url VARCHAR,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Fix legacy columns in users table
DO $$ 
BEGIN
    -- Handle legacy 'password' column (rename to password_hash or drop NOT NULL)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password') THEN
        -- If password_hash doesn't exist, rename password to password_hash
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') THEN
            ALTER TABLE users RENAME COLUMN password TO password_hash;
        ELSE
            -- Both exist, drop NOT NULL on legacy password column
            ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
        END IF;
    END IF;
    
    -- Handle legacy 'username' column (drop NOT NULL constraint)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username') THEN
        ALTER TABLE users ALTER COLUMN username DROP NOT NULL;
    END IF;
END $$;

-- Add missing columns to users
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
        ALTER TABLE users ADD COLUMN email VARCHAR UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') THEN
        ALTER TABLE users ADD COLUMN password_hash VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_name') THEN
        ALTER TABLE users ADD COLUMN first_name VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_name') THEN
        ALTER TABLE users ADD COLUMN last_name VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_image_url') THEN
        ALTER TABLE users ADD COLUMN profile_image_url VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin') THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- ==========================================
-- CATEGORIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- ==========================================
-- ITEMS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS items (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    category_id VARCHAR NOT NULL REFERENCES categories(id),
    owner_id VARCHAR REFERENCES users(id),
    name TEXT NOT NULL,
    description TEXT,
    is_common BOOLEAN DEFAULT TRUE
);

-- Add missing columns to items
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'owner_id') THEN
        ALTER TABLE items ADD COLUMN owner_id VARCHAR REFERENCES users(id);
    END IF;
END $$;

-- ==========================================
-- PARTICIPANTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS participants (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR REFERENCES users(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar TEXT,
    is_guest BOOLEAN DEFAULT FALSE,
    trip_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to participants
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'user_id') THEN
        ALTER TABLE participants ADD COLUMN user_id VARCHAR REFERENCES users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'email') THEN
        ALTER TABLE participants ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'phone') THEN
        ALTER TABLE participants ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'avatar') THEN
        ALTER TABLE participants ADD COLUMN avatar TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'is_guest') THEN
        ALTER TABLE participants ADD COLUMN is_guest BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'trip_count') THEN
        ALTER TABLE participants ADD COLUMN trip_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'created_at') THEN
        ALTER TABLE participants ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- ==========================================
-- EVENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    status TEXT DEFAULT 'upcoming',
    image_url TEXT,
    weather TEXT,
    temperature INTEGER,
    total_budget DECIMAL(10, 2) DEFAULT 0,
    share_token TEXT UNIQUE,
    is_share_enabled BOOLEAN DEFAULT FALSE,
    creator_participant_id VARCHAR REFERENCES participants(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to events
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'share_token') THEN
        ALTER TABLE events ADD COLUMN share_token TEXT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_share_enabled') THEN
        ALTER TABLE events ADD COLUMN is_share_enabled BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'creator_participant_id') THEN
        ALTER TABLE events ADD COLUMN creator_participant_id VARCHAR REFERENCES participants(id);
    END IF;
END $$;

-- ==========================================
-- EVENT_PARTICIPANTS TABLE (Junction)
-- ==========================================
CREATE TABLE IF NOT EXISTS event_participants (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    participant_id VARCHAR NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    status TEXT DEFAULT 'active',
    confirmed_at TIMESTAMP
);

-- Add missing columns to event_participants
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_participants' AND column_name = 'role') THEN
        ALTER TABLE event_participants ADD COLUMN role TEXT DEFAULT 'member';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_participants' AND column_name = 'role_id') THEN
        ALTER TABLE event_participants ADD COLUMN role_id VARCHAR REFERENCES event_roles(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_participants' AND column_name = 'status') THEN
        ALTER TABLE event_participants ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_participants' AND column_name = 'confirmed_at') THEN
        ALTER TABLE event_participants ADD COLUMN confirmed_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_participants' AND column_name = 'can_edit') THEN
        ALTER TABLE event_participants ADD COLUMN can_edit BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_participants' AND column_name = 'can_manage_participants') THEN
        ALTER TABLE event_participants ADD COLUMN can_manage_participants BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- ==========================================
-- CONTRIBUTIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS contributions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    item_id VARCHAR NOT NULL REFERENCES items(id),
    participant_id VARCHAR REFERENCES participants(id),
    quantity INTEGER DEFAULT 1,
    cost DECIMAL(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to contributions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contributions' AND column_name = 'receipt_url') THEN
        ALTER TABLE contributions ADD COLUMN receipt_url TEXT;
    END IF;
END $$;

-- ==========================================
-- ACTIVITY_LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- SETTLEMENT_RECORDS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS settlement_records (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    debtor_id VARCHAR NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    creditor_id VARCHAR NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    is_settled BOOLEAN DEFAULT FALSE,
    settled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- SETTLEMENT_ACTIVITY_LOG TABLE (Immutable audit trail)
-- ==========================================
CREATE TABLE IF NOT EXISTS settlement_activity_log (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id INTEGER,
    event_title TEXT NOT NULL,
    debtor_id VARCHAR,
    debtor_name TEXT NOT NULL,
    creditor_id VARCHAR,
    creditor_name TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ==========================================
-- EVENT_INVITATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS event_invitations (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    inviter_participant_id VARCHAR REFERENCES participants(id),
    invited_participant_id VARCHAR REFERENCES participants(id),
    status TEXT DEFAULT 'pending',
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    payload JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- SETTLEMENT_CLAIMS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS settlement_claims (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    settlement_record_id VARCHAR REFERENCES settlement_records(id),
    event_id INTEGER NOT NULL REFERENCES events(id),
    debtor_participant_id VARCHAR NOT NULL REFERENCES participants(id),
    creditor_participant_id VARCHAR NOT NULL REFERENCES participants(id),
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending',
    submitted_by_participant_id VARCHAR REFERENCES participants(id),
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- REFRESH_TOKENS TABLE (for "Remember Me" feature)
-- ==========================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR NOT NULL,
    device_name TEXT,
    user_agent TEXT,
    ip_address TEXT,
    issued_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    last_used_at TIMESTAMP,
    revoked_at TIMESTAMP
);

-- ==========================================
-- WEBAUTHN_CREDENTIALS TABLE (for biometric login)
-- ==========================================
CREATE TABLE IF NOT EXISTS webauthn_credentials (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    sign_count INTEGER DEFAULT 0,
    transports TEXT,
    friendly_name TEXT,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- EVENT_ROLES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS event_roles (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    is_creator_role BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to event_roles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_roles' AND column_name = 'name_ar') THEN
        ALTER TABLE event_roles ADD COLUMN name_ar TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_roles' AND column_name = 'description') THEN
        ALTER TABLE event_roles ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_roles' AND column_name = 'is_creator_role') THEN
        ALTER TABLE event_roles ADD COLUMN is_creator_role BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_roles' AND column_name = 'is_default') THEN
        ALTER TABLE event_roles ADD COLUMN is_default BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_roles' AND column_name = 'sort_order') THEN
        ALTER TABLE event_roles ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_roles' AND column_name = 'created_at') THEN
        ALTER TABLE event_roles ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- ==========================================
-- ROLE_PERMISSIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    role_id VARCHAR NOT NULL REFERENCES event_roles(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL,
    allowed BOOLEAN DEFAULT TRUE
);

-- ==========================================
-- PARTICIPANT_PERMISSION_OVERRIDES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS participant_permission_overrides (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_participant_id VARCHAR NOT NULL REFERENCES event_participants(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL,
    allowed BOOLEAN NOT NULL
);

-- ==========================================
-- USEFUL INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_owner_id ON items(owner_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_participant_id ON event_participants(participant_id);
CREATE INDEX IF NOT EXISTS idx_contributions_event_id ON contributions(event_id);
CREATE INDEX IF NOT EXISTS idx_contributions_participant_id ON contributions(participant_id);
CREATE INDEX IF NOT EXISTS idx_settlement_records_event_id ON settlement_records(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_event_roles_event_id ON event_roles(event_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);

-- ==========================================
-- SEED DEFAULT CATEGORIES (if empty)
-- ==========================================
INSERT INTO categories (id, name, name_ar, icon, color, sort_order)
SELECT * FROM (VALUES
    ('coffee', 'Coffee & Tea', 'القهوة والشاي', 'Coffee', '#8B4513', 1),
    ('grilling', 'Grilling & BBQ', 'الشواء والمشاوي', 'Flame', '#FF6B35', 2),
    ('camping', 'Camping Gear', 'مستلزمات التخييم', 'Tent', '#228B22', 3),
    ('food', 'Food & Drinks', 'الأكل والمشروبات', 'UtensilsCrossed', '#FF9500', 4),
    ('lighting', 'Lighting', 'الإضاءة', 'Lightbulb', '#FFD700', 5),
    ('seating', 'Seating & Comfort', 'الجلسات والراحة', 'Armchair', '#9370DB', 6),
    ('games', 'Games & Entertainment', 'الألعاب والترفيه', 'Gamepad2', '#FF69B4', 7),
    ('safety', 'Safety & First Aid', 'السلامة والإسعافات', 'ShieldCheck', '#DC143C', 8)
) AS v(id, name, name_ar, icon, color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

-- Done!
SELECT 'Database initialization complete!' AS status;
