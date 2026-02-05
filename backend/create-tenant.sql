-- Create default tenant for development
INSERT INTO tenants (
  id,
  name,
  slug,
  status,
  subscription_plan,
  primary_color,
  secondary_color,
  font_family,
  default_language,
  supported_languages,
  currency,
  timezone,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Store',
  'default',
  'active',
  'basic',
  '#4CAF50',
  '#2196F3',
  'Roboto',
  'en',
  '["en", "te"]'::jsonb,
  'INR',
  'Asia/Kolkata',
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

SELECT * FROM tenants WHERE slug = 'default';
