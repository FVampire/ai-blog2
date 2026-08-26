-- Project showcase display settings

INSERT INTO settings (key, value, type, description) VALUES
  ('projects_enabled', 'true', 'boolean', '启用项目展示页面'),
  ('projects_show_on_home', 'true', 'boolean', '在首页显示精选项目'),
  ('projects_home_count', '3', 'number', '首页显示项目数量'),
  ('projects_intro', '我的项目与开发成果', 'string', '项目页面介绍文字'),
  ('projects_nav_label', 'Projects', 'string', '导航栏项目链接文字')
ON CONFLICT (key) DO NOTHING;
