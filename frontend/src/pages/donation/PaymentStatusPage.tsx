import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '@/services/api/payment.api';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, FileText, ArrowRight, Home } from 'lucide-react';

export function PaymentStatusPage() {
  const { donationId } = useParams<{ donationId: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['donationStatus', donationId],
    queryFn: () => paymentApi.getStatus(donationId as string),
    enabled: !!donationId,
    refetchInterval: (query) => {
      const data: any = query.state.data;
      const status = data?.donation?.status || data?.donationStatus;
      if (status === 'CONFIRMED' || status === 'SUCCESS' || status === 'FAILED' || status === 'CANCELLED' || status === 'REFUNDED') {
        return false;
      }
      return 2000;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold">Verifying Transaction...</h2>
        <p className="text-muted-foreground mt-2">Checking with payment gateway and confirming receipt generation.</p>
      </div>
    );
  }

  const rawData: any = data;
  const donationStatus = rawData?.donation?.status || rawData?.donationStatus;
  const isSuccess = donationStatus === 'CONFIRMED' || donationStatus === 'SUCCESS';
  const isFailed = donationStatus === 'FAILED' || donationStatus === 'CANCELLED';
  const isRefunded = donationStatus === 'REFUNDED';
  const amount = rawData?.donation?.amount || rawData?.amount || 0;
  const receiptNumber = rawData?.receipt?.receiptNumber || rawData?.receiptNumber;
  const failureReason = rawData?.payment?.failureReason;

  return (
    <div className="container mx-auto px-4 py-16 max-w-xl text-center">
      <div className="bg-white border rounded-2xl p-8 shadow-sm space-y-6">
        {isSuccess && (
          <>
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Payment Confirmed!</h1>
              <p className="text-muted-foreground mt-2">
                Your donation of <strong className="text-neutral-900">₹{amount.toLocaleString('en-IN')}</strong> has been confirmed and credited to the campaign.
              </p>
            </div>

            <div className="bg-neutral-50 rounded-xl p-4 text-left space-y-2 text-sm border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Donation ID:</span>
                <span className="font-mono text-xs">{donationId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Receipt Number:</span>
                <span className="font-semibold text-primary">{receiptNumber || 'RCP-VERIFIED'}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link to={`/donations/${donationId}/receipt`} className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <FileText className="w-4 h-4" /> View Receipt
                </Button>
              </Link>
              <Link to="/me" className="flex-1">
                <Button className="w-full gap-2">
                  My NobleNet <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </>
        )}

        {isFailed && (
          <>
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Payment Unsuccessful</h1>
              <p className="text-muted-foreground mt-2">The transaction was declined by the provider or timed out.</p>
            </div>
            <div className="flex gap-4 pt-4">
              <Link to="/campaigns" className="flex-1">
                <Button variant="outline" className="w-full">Back to Campaigns</Button>
              </Link>
            </div>
          </>
        )}

        {!isSuccess && !isFailed && (
          <>
            <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold">Payment Processing</h1>
            <p className="text-muted-foreground">Awaiting webhook confirmation from gateway. This page will update automatically.</p>
          </>
        )}
      </div>
    </div>
  );
}
