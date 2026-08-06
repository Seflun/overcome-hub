DELETE FROM public.subscriptions;

ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS polar_subscription_id,
  DROP COLUMN IF EXISTS polar_customer_id,
  DROP COLUMN IF EXISTS paddle_subscription_id,
  DROP COLUMN IF EXISTS paddle_customer_id;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS paypal_subscription_id text,
  ADD COLUMN IF NOT EXISTS paypal_payer_id text;

ALTER TABLE public.subscriptions ALTER COLUMN provider SET DEFAULT 'paypal';
ALTER TABLE public.subscriptions ALTER COLUMN environment SET DEFAULT 'live';

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_paypal_subscription_id_key
  ON public.subscriptions (paypal_subscription_id)
  WHERE paypal_subscription_id IS NOT NULL;