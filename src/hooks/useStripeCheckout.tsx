import { useCallback, useState } from "react";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";

interface CheckoutOptions {
  priceId: string;
  quantity?: number;
  customerEmail: string;
  userId?: string;
  returnUrl?: string;
}

export function useStripeCheckout() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<CheckoutOptions | null>(null);

  const openCheckout = useCallback((opts: CheckoutOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeCheckout = useCallback(() => {
    setIsOpen(false);
    setOptions(null);
  }, []);

  // Keyed by the plan so switching plans mounts a brand-new Stripe provider
  // instead of reusing the previous plan's client secret.
  const checkoutElement =
    isOpen && options ? (
      <StripeEmbeddedCheckout key={options.priceId} {...options} />
    ) : null;

  return { openCheckout, closeCheckout, isOpen, checkoutElement };
}
