ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'polar',
  ADD COLUMN IF NOT EXISTS polar_subscription_id text,
  ADD COLUMN IF NOT EXISTS polar_customer_id text;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_polar_subscription_id_key
  ON public.subscriptions (polar_subscription_id)
  WHERE polar_subscription_id IS NOT NULL;

UPDATE public.subscriptions SET provider = 'stripe' WHERE stripe_subscription_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'live'::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.subscriptions
    where user_id = user_uuid
      and (
        (status in ('active', 'trialing') and (current_period_end is null or current_period_end > now()))
        or (status = 'canceled' and current_period_end > now())
      )
  );
$function$;