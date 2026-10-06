import { env } from './env';
import { PaymentProvider } from '../modules/payments/providers/PaymentProvider';
import { MockPaymentProvider } from '../modules/payments/providers/MockPaymentProvider';
import { RazorpayPaymentProvider } from '../modules/payments/providers/RazorpayPaymentProvider';

let instance: PaymentProvider;

export function getPaymentProvider(): PaymentProvider {
  if (!instance) {
    if (env.PAYMENT_PROVIDER === 'razorpay' && env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
      instance = new RazorpayPaymentProvider();
    } else {
      instance = new MockPaymentProvider();
    }
  }
  return instance;
}

export function setPaymentProvider(provider: PaymentProvider) {
  instance = provider;
}
