-- 1. Table des plans
CREATE TABLE plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_monthly integer,
  price_yearly integer,
  price_lifetime integer,
  limits jsonb NOT NULL,
  features jsonb,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  stripe_price_id_lifetime text
);

-- 2. Données initiales
INSERT INTO plans VALUES
('free', 'Découverte', 0, NULL, NULL, 
  '{"souvenirs":3,"ai_calls":10,"photos":5,"witnesses":0,"audio_exports":0}',
  '{"pdf_export":false}', NULL, NULL, NULL),
('writer', 'Écrivain', 900, 9000, NULL,
  '{"souvenirs":50,"ai_calls":100,"photos":50,"witnesses":2,"audio_exports":5}',
  '{"pdf_export":true}', 'price_xxx', 'price_yyy', NULL),
('biographer', 'Biographe', 1900, 18000, 29900,
  '{"souvenirs":-1,"ai_calls":500,"photos":-1,"witnesses":10,"audio_exports":20}',
  '{"pdf_export":true,"premium_templates":true}', 'price_xxx', 'price_yyy', 'price_zzz'),
('family', 'Famille', 2900, 28000, 49900,
  '{"souvenirs":-1,"ai_calls":1000,"photos":-1,"witnesses":-1,"audio_exports":50}',
  '{"pdf_export":true,"premium_templates":true,"multi_book":true}', 'price_xxx', 'price_yyy', 'price_zzz');

-- 3. Table subscriptions
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE UNIQUE,
  plan_id text REFERENCES plans DEFAULT 'free',
  billing_cycle text,
  status text DEFAULT 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  is_lifetime boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 4. Table usage
CREATE TABLE usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  metric text NOT NULL,
  count integer DEFAULT 0,
  period_start date DEFAULT date_trunc('month', now()),
  period_end date DEFAULT (date_trunc('month', now()) + interval '1 month')::date,
  UNIQUE(user_id, metric, period_start)
);

-- 5. RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own usage" ON usage_tracking 
  FOR SELECT USING (auth.uid() = user_id);

-- 6. Table addons
CREATE TABLE addons (
  id text PRIMARY KEY,
  name text NOT NULL,
  price integer NOT NULL,        -- En centimes
  type text NOT NULL,            -- 'consumable' (ex: AI calls) ou 'feature' (ex: PDF)
  value jsonb NOT NULL,          -- {"ai_calls": 50}
  validity_days integer,         -- NULL = illimité
  stripe_price_id text
);

-- 7. Table user_addons
CREATE TABLE user_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  addon_id text REFERENCES addons,
  remaining_value jsonb,         -- Pour les consommables
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read plans" ON plans FOR SELECT USING (true);
CREATE POLICY "Public read addons" ON addons FOR SELECT USING (true);
CREATE POLICY "Users can view own purchased addons" ON user_addons 
  FOR SELECT USING (auth.uid() = user_id);
