export {};

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      order_id: string;
      name: string;
      description: string;
      prefill?: { name?: string; contact?: string };
      theme?: { color?: string };
      config?: {
        display?: {
          blocks?: Record<
            string,
            { name: string; instruments: { method: string; flows?: string[]; apps?: string[] }[] }
          >;
          hide?: { method: string; flows?: string[] }[];
          sequence?: string[];
          preferences?: { show_default_blocks?: boolean };
        };
      };
      handler: (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => void;
    }) => {
      open: () => void;
      on: (event: string, handler: () => void) => void;
    };
  }
}
