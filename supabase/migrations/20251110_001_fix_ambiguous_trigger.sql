-- Fix ambiguous column reference in update_folder_asset_count trigger
-- The trigger was referencing 'id' without specifying which table (folder_structure or creative_assets)

DROP TRIGGER IF EXISTS update_folder_asset_count_trigger ON creative_assets;
DROP FUNCTION IF EXISTS update_folder_asset_count();

-- Recreate with fixed column reference
CREATE OR REPLACE FUNCTION update_folder_asset_count()
RETURNS TRIGGER AS $$
DECLARE
  folder_id UUID;
BEGIN
  -- Increment count when asset added
  IF TG_OP = 'INSERT' THEN
    -- Find folder by matching asset's full path prefix
    SELECT fs.id INTO folder_id  -- FIXED: Explicitly specify fs.id instead of ambiguous 'id'
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
