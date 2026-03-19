-- Riders Table Schema
-- Run this SQL in your Supabase SQL Editor to create the riders table

-- Create the riders table
CREATE TABLE IF NOT EXISTS riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

    -- Basic Information
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,

    -- Vehicle Information
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('car', 'bike')),
    plate_number VARCHAR(50) NOT NULL,
    driver_license_number VARCHAR(100) NOT NULL,

    -- Guarantor Information
    guarantor_name VARCHAR(255) NOT NULL,
    guarantor_phone VARCHAR(50) NOT NULL,

    -- Photo URLs (stored in Supabase Storage)
    vehicle_photo_url TEXT,
    rider_photo_url TEXT,
    plate_photo_url TEXT,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_riders_company_id ON riders(company_id);
CREATE INDEX IF NOT EXISTS idx_riders_auth_user_id ON riders(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_riders_email ON riders(email);
CREATE INDEX IF NOT EXISTS idx_riders_status ON riders(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_riders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_riders_updated_at
    BEFORE UPDATE ON riders
    FOR EACH ROW
    EXECUTE FUNCTION update_riders_updated_at();

-- Create storage bucket for rider documents (run this in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('rider-documents', 'rider-documents', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policy to allow public read access
-- CREATE POLICY "Public read access for rider documents"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'rider-documents');

-- Storage policy to allow authenticated uploads (service role can always upload)
-- CREATE POLICY "Service role upload access for rider documents"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'rider-documents');
