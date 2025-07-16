-- Create flows table
CREATE TABLE IF NOT EXISTS flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    flow_json JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    meta_flow_id VARCHAR(255),
    version INTEGER NOT NULL DEFAULT 1,
    api_version VARCHAR(10) NOT NULL DEFAULT '7.1',
    categories TEXT[] DEFAULT '{}',
    endpoint_uri TEXT,
    is_public BOOLEAN DEFAULT false,
    deployed_at TIMESTAMP,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create flow versions table for version history
CREATE TABLE IF NOT EXISTS flow_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    flow_json JSONB NOT NULL,
    change_log TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create flow sharing table
CREATE TABLE IF NOT EXISTS flow_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    shared_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(50) NOT NULL DEFAULT 'view',
    shared_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(flow_id, shared_with_user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_flows_user_id ON flows(user_id);
CREATE INDEX IF NOT EXISTS idx_flows_status ON flows(status);
CREATE INDEX IF NOT EXISTS idx_flows_meta_flow_id ON flows(meta_flow_id);
CREATE INDEX IF NOT EXISTS idx_flows_created_at ON flows(created_at);
CREATE INDEX IF NOT EXISTS idx_flow_versions_flow_id ON flow_versions(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_shares_flow_id ON flow_shares(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_shares_user_id ON flow_shares(shared_with_user_id);

-- Add updated_at trigger for flows
CREATE TRIGGER update_flows_updated_at BEFORE UPDATE ON flows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();