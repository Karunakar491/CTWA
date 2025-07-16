-- Create media files table
CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    meta_media_id VARCHAR(255),
    cdn_url TEXT,
    thumbnail_url TEXT,
    is_processed BOOLEAN DEFAULT false,
    processing_status VARCHAR(50) DEFAULT 'pending',
    processing_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create data exchange configurations table
CREATE TABLE IF NOT EXISTS data_exchange_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    endpoint_url TEXT NOT NULL,
    method VARCHAR(10) NOT NULL DEFAULT 'POST',
    headers JSONB,
    authentication JSONB,
    encryption_enabled BOOLEAN DEFAULT false,
    encryption_config JSONB,
    is_active BOOLEAN DEFAULT true,
    last_test_at TIMESTAMP,
    last_test_status VARCHAR(50),
    last_test_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create data exchange logs table
CREATE TABLE IF NOT EXISTS data_exchange_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES data_exchange_configs(id) ON DELETE CASCADE,
    flow_id UUID REFERENCES flows(id) ON DELETE SET NULL,
    request_data JSONB,
    response_data JSONB,
    status_code INTEGER,
    response_time INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_meta_id ON media_files(meta_media_id);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at);
CREATE INDEX IF NOT EXISTS idx_data_exchange_configs_user_id ON data_exchange_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_exchange_logs_config_id ON data_exchange_logs(config_id);
CREATE INDEX IF NOT EXISTS idx_data_exchange_logs_flow_id ON data_exchange_logs(flow_id);
CREATE INDEX IF NOT EXISTS idx_data_exchange_logs_created_at ON data_exchange_logs(created_at);

-- Add updated_at triggers
CREATE TRIGGER update_media_files_updated_at BEFORE UPDATE ON media_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_exchange_configs_updated_at BEFORE UPDATE ON data_exchange_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();