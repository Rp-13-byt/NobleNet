import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paymentApi, CreateOrderResponse } from '@/services/api/payment.api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { PageMeta } from '@/components/common/PageMeta';
import { toast } from 'sonner';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  XCircle,
  HelpCircle,
} from 'lucide-react';

export function PaymentPage() {
  const { donationId } = useParams<{ donationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [orderData, setOrderData] = useState<CreateOrderResponse | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const campaignTitle = location.state?.campaignTitle || 'Noble Cause';

  // Load Razorpay checkout.js dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setRazorpayLoaded(true);
      script.onerror = () => console.warn('Could not load Razorpay checkout.js (normal in offline/mock mode)');
      document.body.appendChild(script);
    } else {
      setRazorpayLoaded(true);
    }
  }, []);

  // Fetch trusted server-side order creation
  const fetchOrder = useCallback(async () => {
    if (!donationId) return;
    setIsProcessing(true);
    setOrderError(null);
    try {
      const idempotencyKey = `ord_${donationId}_${Date.now()}`;
      const res = await paymentApi.createOrder({ donationId }, idempotencyKey);
      setOrderData(res);
    } catch (err: any) {
      const msg = err.message || 'Unable to create payment order';
      setOrderError(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  }, [donationId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Standard Razorpay Checkout Launcher
  const handleRazorpayPay = () => {
    if (!orderData) return;

    if (!(window as any).Razorpay) {
      toast.error('Razorpay SDK is not ready yet. Please check your internet connection or use mock simulation.');
      return;
    }

    setIsProcessing(true);
    const options = {
      key: orderData.keyId,
      amount: orderData.amountInPaise,
      currency: orderData.currency || 'INR',
      name: 'NobleNet Foundation',
      description: campaignTitle,
      image: '/logo.png',
      order_id: orderData.orderId,
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          toast.loading('Cryptographically verifying payment with bank...');
          await paymentApi.verify({
            donationId,
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            amountInPaise: orderData.amountInPaise,
          });
          toast.dismiss();
          toast.success('Payment verified successfully!');
          navigate(`/donations/${donationId}/status`);
        } catch (err: any) {
          toast.dismiss();
          toast.error(err.message || 'Signature verification failed');
          navigate(`/donations/${donationId}/status`);
        }
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
      },
      theme: {
        color: '#059669', // NobleNet primary emerald
      },
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
          toast.info('Checkout window closed. Checking donation status...');
          navigate(`/donations/${donationId}/status`);
        },
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', function (response: any) {
      toast.error(response.error?.description || 'Payment was declined by the bank.');
      navigate(`/donations/${donationId}/status`);
    });
    rzp.open();
  };

  // Deterministic Mock Testing Actions
  const handleMockPay = async (simulate: 'SUCCESS' | 'FAILURE' | 'RECOVERY') => {
    if (!orderData) return;
    setIsProcessing(true);

    if (simulate === 'RECOVERY') {
      // Simulates lost callback / closed tab: navigate directly to status page
      toast.info('Simulating browser crash / lost callback... Checking status recovery.');
      setTimeout(() => {
        navigate(`/donations/${donationId}/status`);
      }, 500);
      return;
    }

    try {
      const mockPaymentId = `pay_mock_${Date.now()}`;
      const signature = simulate === 'SUCCESS' ? `sig_valid_${orderData.orderId}` : 'invalid_signature_test';

      await paymentApi.verify({
        donationId,
        orderId: orderData.orderId,
        paymentId: mockPaymentId,
        signature,
        amountInPaise: orderData.amountInPaise,
      });

      toast.success('Payment verified & captured successfully!');
      navigate(`/donations/${donationId}/status`);
    } catch (err: any) {
      toast.error(err.message || 'Payment verification failed');
      navigate(`/donations/${donationId}/status`);
    } finally {
      setIsProcessing(false);
    }
  };

  const isMockMode = orderData?.gateway === 'mock' || !orderData?.keyId || orderData?.keyId.startsWith('mock_');

  return (
    <div className="container mx-auto px-4 pb-20 max-w-xl">
      <PageMeta
        title="Secure Checkout | NobleNet"
        description="Encrypted 256-bit checkout for charitable contributions with automatic 80G tax receipt generation."
      />

      <Breadcrumbs
        items={[
          { label: 'Campaigns', path: '/campaigns' },
          { label: 'Donate', path: `/campaigns` },
          { label: 'Secure Checkout' },
        ]}
      />

      <div className="mt-6 space-y-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b pb-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">Checkout Confirmation</CardTitle>
                <CardDescription className="text-sm mt-0.5">{campaignTitle}</CardDescription>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> 256-Bit SSL
              </Badge>
            </div>
            {orderData && (
              <div className="mt-4 pt-4 border-t flex items-baseline justify-between">
                <span className="text-sm font-medium text-muted-foreground">Authorized Amount:</span>
                <span className="text-3xl font-extrabold text-foreground">
                  ₹{orderData.amount.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {orderError ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3 text-sm text-rose-800">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Could Not Initialize Order
                </div>
                <p>{orderError}</p>
                <Button size="sm" variant="outline" onClick={fetchOrder} className="gap-1.5 text-xs">
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Order Creation
                </Button>
              </div>
            ) : !orderData ? (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                <p className="text-sm">Contacting payment gateway to register order...</p>
              </div>
            ) : (
              <>
                {/* Gateway Metadata Banner */}
                <div className="p-3.5 rounded-xl bg-neutral-50 border text-xs space-y-1 text-neutral-600">
                  <div className="flex justify-between">
                    <span className="font-semibold text-neutral-800">Gateway Order ID:</span>
                    <span className="font-mono text-neutral-900">{orderData.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-neutral-800">Payment Engine:</span>
                    <span className="uppercase font-semibold text-primary">{orderData.gateway}</span>
                  </div>
                </div>

                {/* Primary Action Button */}
                {!isMockMode ? (
                  <Button
                    size="lg"
                    className="w-full h-14 font-bold text-base gap-2 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                    disabled={isProcessing}
                    onClick={handleRazorpayPay}
                  >
                    <Lock className="w-4 h-4" />
                    {isProcessing ? 'Connecting to Bank...' : `Pay ₹${orderData.amount.toLocaleString('en-IN')} via Razorpay`}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Deterministic Mock Gateway Active:</strong>
                        <p className="mt-0.5 text-amber-700/90">
                          Automated local environment. Simulate different bank outcomes or test status recovery without moving real money.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 pt-1">
                      <Button
                        size="lg"
                        className="w-full h-12 font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                        disabled={isProcessing}
                        onClick={() => handleMockPay('SUCCESS')}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Simulate Successful Payment (₹{orderData.amount})
                      </Button>

                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full h-11 text-xs border-rose-200 text-rose-700 hover:bg-rose-50 gap-2"
                        disabled={isProcessing}
                        onClick={() => handleMockPay('FAILURE')}
                      >
                        <XCircle className="w-4 h-4" />
                        Simulate Declined Payment (Invalid Signature)
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground hover:text-foreground gap-1.5"
                        disabled={isProcessing}
                        onClick={() => handleMockPay('RECOVERY')}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Simulate Closed Window / Status Recovery Check
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Security Guarantee List */}
            <div className="pt-4 border-t space-y-2 text-xs text-neutral-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Section 80G compliant receipt issued immediately upon capture</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Zero platform commission; 100% transferred to verified NGO bank escrow</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Server-enforced amount integrity prevents client-side tampering</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
