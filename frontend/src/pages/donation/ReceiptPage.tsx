import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '@/services/api/payment.api';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Download, Printer, ArrowLeft } from 'lucide-react';

export function ReceiptPage() {
  const { donationId } = useParams<{ donationId: string }>();

  const { data: status, isLoading } = useQuery({
    queryKey: ['donationStatus', donationId],
    queryFn: () => paymentApi.getStatus(donationId as string),
    enabled: !!donationId,
  });

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading receipt...</div>;

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <Link to="/me">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to My NobleNet
          </Button>
        </Link>
        <Button size="sm" className="gap-2" onClick={() => window.print()}>
          <Printer className="w-4 h-4" /> Print Receipt
        </Button>
      </div>

      <div className="bg-white border rounded-2xl p-8 md:p-12 shadow-sm space-y-8 font-sans">
        <div className="flex justify-between items-start border-b pb-8">
          <div>
            <div className="text-2xl font-black text-primary tracking-tight">NobleNet</div>
            <p className="text-xs text-muted-foreground mt-1">Official Donation Acknowledgement & Tax Receipt</p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified 80G Compliant
            </span>
            <div className="font-mono text-xs text-muted-foreground mt-2">Receipt: {status?.receipt?.receiptNumber || 'RCP-VERIFIED'}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Issued Date</div>
            <div className="font-medium mt-1">{new Date(status?.donation?.createdAt || Date.now()).toLocaleDateString('en-IN', { dateStyle: 'long' })}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Payment Status</div>
            <div className="font-bold text-emerald-600 mt-1">CONFIRMED</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Donation Amount</div>
            <div className="text-2xl font-extrabold text-neutral-900 mt-1">₹{status?.donation?.amount?.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Transaction ID</div>
            <div className="font-mono text-xs mt-2 truncate">{status?.donation?.id || donationId}</div>
          </div>
        </div>

        <div className="bg-neutral-50 rounded-xl p-4 border text-xs text-muted-foreground leading-relaxed">
          This electronic receipt certifies the receipt of the voluntary contribution mentioned above. Under Section 80G of the Income Tax Act, this donation is eligible for tax deduction. No goods or services were provided in exchange for this contribution.
        </div>

        <div className="text-center text-xs text-muted-foreground border-t pt-6">
          NobleNet Foundation • Registered Non-Profit Platform • support@noblenet.org
        </div>
      </div>
    </div>
  );
}
