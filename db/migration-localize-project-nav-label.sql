-- Replace the legacy English default without overwriting customized labels.
UPDATE settings
SET value = '项目', updated_at = CURRENT_TIMESTAMP
WHERE key = 'projects_nav_label'
  AND value = 'Projects';
