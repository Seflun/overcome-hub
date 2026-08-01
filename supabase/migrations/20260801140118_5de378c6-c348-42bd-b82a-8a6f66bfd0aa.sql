DROP INDEX IF EXISTS public.subscriptions_stripe_subscription_id_key;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_stripe_subscription_id_uniq UNIQUE (stripe_subscription_id);