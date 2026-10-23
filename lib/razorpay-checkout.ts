import { apiUrl } from '@/lib/api-url';

// Razorpay Checkout (TEST mode). The key id comes from the server with each
// payment order; no key or secret is bundled into the frontend.

const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: { name?: string; contact?: string; email?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: 'payment.failed', cb: (response: any) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export type PaymentResult =
  | { status: 'paid'; orderNumber: string }
  | { status: 'dismissed' }
  | { status: 'failed'; message: string };

function getToken(): string {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('ardenby_token') : null;
  if (!token) throw new Error('AUTH_REQUIRED');
  return token;
}

async function paymentRequest(path: string, body: unknown) {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Payment request failed.');
  }

  return data;
}

let scriptPromise: Promise<void> | null = null;

function loadCheckoutScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      script.remove();
      reject(new Error('Could not load the payment window. Check your connection.'));
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}

// Opens Razorpay for an existing unpaid online order and resolves once the
// customer has paid (server-verified), dismissed the window, or the payment failed.
export async function startRazorpayPayment(
  orderId: string,
  prefill?: { name?: string; contact?: string; email?: string },
  onPhase?: (phase: 'opened' | 'verifying') => void
): Promise<PaymentResult> {
  await loadCheckoutScript();

  const { payment } = await paymentRequest('/api/payments/razorpay/order', {
    orderId,
  });

  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error('Payment window is unavailable.');

  return new Promise<PaymentResult>((resolve) => {
    let settled = false;
    const settle = (result: PaymentResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const reportFailure = () =>
      paymentRequest('/api/payments/razorpay/failed', { orderId }).catch(
        () => undefined
      );

    const instance = new Razorpay({
      key: payment.keyId,
      amount: payment.amount,
      currency: payment.currency,
      order_id: payment.razorpayOrderId,
      name: 'KÖVENIK',
      description: `Order ${payment.orderNumber}`,
      prefill,
      theme: { color: '#4d7cff' },
      handler: (response) => {
        onPhase?.('verifying');
        // The server re-computes the signature; the browser result alone is never trusted.
        paymentRequest('/api/payments/razorpay/verify', {
          orderId,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        })
          .then((data) =>
            settle({ status: 'paid', orderNumber: data.orderNumber ?? payment.orderNumber })
          )
          .catch((error: Error) =>
            settle({
              status: 'failed',
              message: error.message || 'Payment could not be verified.',
            })
          );
      },
      modal: {
        ondismiss: () => {
          void reportFailure();
          settle({ status: 'dismissed' });
        },
      },
    });

    // A failed attempt keeps the Razorpay window open so the customer can retry
    // inside it; the order is only marked Failed until a retry succeeds or the
    // window is closed.
    instance.on('payment.failed', () => {
      void reportFailure();
    });

    instance.open();
    onPhase?.('opened');
  });
}

// Used when a customer returns to an unpaid order: asks the server to check with
// Razorpay in case the payment actually went through.
export async function syncOrderPayment(orderId: string): Promise<boolean> {
  const data = await paymentRequest('/api/payments/razorpay/sync', { orderId });
  return Boolean(data.paid);
}
