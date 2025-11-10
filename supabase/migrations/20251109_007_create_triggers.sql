-- Trigger 1: Update upload_sessions.updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_upload_sessions_updated_at
BEFORE UPDATE ON upload_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger 2: Automatically update creative_sets.asset_count
CREATE OR REPLACE FUNCTION update_creative_set_asset_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE creative_sets
    SET asset_count = asset_count + 1
    WHERE id = NEW.creative_set_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE creative_sets
    SET asset_count = asset_count - 1
    WHERE id = OLD.creative_set_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_creative_set_asset_count_trigger
AFTER INSERT OR DELETE ON creative_assets
FOR EACH ROW
EXECUTE FUNCTION update_creative_set_asset_count();

-- Trigger 3: Automatically update folder_structure.asset_count
CREATE OR REPLACE FUNCTION update_folder_asset_count()
RETURNS TRIGGER AS $$
DECLARE
  folder_id UUID;
BEGIN
  -- Increment count when asset added
  IF TG_OP = 'INSERT' THEN
    -- Find folder by matching asset's full path prefix
    SELECT id INTO folder_id
    FROM folder_structure fs
    JOIN creative_assets ca ON ca.id = NEW.id
    WHERE ca.filename_sanitized LIKE fs.full_path || '%'
    ORDER BY LENGTH(fs.full_path) DESC
    LIMIT 1;

    IF folder_id IS NOT NULL THEN
      UPDATE folder_structure
      SET asset_count = asset_count + 1
      WHERE id = folder_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_folder_asset_count_trigger
AFTER INSERT ON creative_assets
FOR EACH ROW
EXECUTE FUNCTION update_folder_asset_count();
