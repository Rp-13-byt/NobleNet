import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { campaignService } from '@/services/campaignService';
import { donationApi } from '@/services/api/donation.api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { toast } from 'sonner';
import { Heart, ShieldCheck, ArrowRight } from 'lucide-react';

const PRESET_AMOUNTS = [250, 500, 1000, 2500, 5000];

export function DonatePage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignService.getCampaignById(campaignId as string),
    enabled: !!campaignId,
  });

  const initiateMutation = useMutation({
    mutationFn: async (amt: number) => {
      if (!isAuthenticated) throw new Error('Please log in before completing your donation.');
      const idempotencyKey = `donate_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return await donationApi.initiate({ campaignId: campaignId!, amount: amt }, idempotencyKey);
    },
    onSuccess: (data) => {
      navigate(`/donations/${data.donationId}/payment`, {
        state: { orderId: data.orderId, amount: data.amount, campaignTitle: campaign?.title },
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Could not initiate donation');
    },
  });

  const handleSelectAmount = (val: number) => {
    setAmount(val);
    setCustomAmount('');
  };

  const handleCustomAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    const num = parseInt(e.target.value);
    if (!isNaN(num) && num > 0) setAmount(num);
  };

  const handleProceed = () => {
    if (!amount || amount < 1) {
      toast.error('Minimum donation amount is ₹1');
      return;
    }
    initiateMutation.mutate(amount);
  };

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading campaign...</div>;
  if (!campaign) return <div className="p-12 text-center text-muted-foreground">Campaign not found</div>;

  return (
    <div className="container mx-auto px-4 pb-16 max-w-2xl">
      <Breadcrumbs items={[{ label: 'Campaigns', path: '/campaigns' }, { label: campaign.title, path: `/campaigns/${campaign.id}` }, { label: 'Donate' }]} />

      <div className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b pb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Donate to Campaign</h1>
            <p className="text-sm text-muted-foreground">{campaign.title}</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold mb-3 block">Select Donation Amount</label>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleSelectAmount(amt)}
                className={`py-3 px-4 rounded-xl border text-center font-bold transition-all ${
                  amount === amt && !customAmount
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-neutral-200 hover:border-primary/50'
                }`}
              >
                ₹{amt.toLocaleString('en-IN')}
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
            <Input
              type="number"
              placeholder="Or enter custom amount in INR"
              value={customAmount}
              onChange={handleCustomAmount}
              className="pl-8 h-12 text-base font-semibold"
            />
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-neutral-700 leading-relaxed">
            <strong>100% Verified Contribution:</strong> Your donation directly supports verified NGO activities. An official 80G tax exemption receipt will be issued immediately upon payment confirmation.
          </div>
        </div>

        <Button
          size="lg"
          className="w-full h-14 text-base font-bold gap-2 cursor-pointer"
          disabled={initiateMutation.isPending}
          onClick={handleProceed}
        >
          {initiateMutation.isPending ? 'Initiating Transaction...' : `Proceed to Pay ₹${amount.toLocaleString('en-IN')}`}
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
