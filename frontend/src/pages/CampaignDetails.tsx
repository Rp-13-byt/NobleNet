import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ShieldCheck, Share2, Heart, Clock, Users, MapPin, 
  CheckCircle2, AlertCircle, ArrowLeft, Building2, ExternalLink
} from 'lucide-react';
import { campaignService } from '@/services/campaignService';
import { ngoService } from '@/services/ngoService';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: campaign, isLoading: isCampLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignService.getCampaignById(id as string),
    enabled: !!id,
  });

  const { data: ngo } = useQuery({
    queryKey: ['ngo', campaign?.ngoId],
    queryFn: () => ngoService.getNgoById(campaign!.ngoId),
    enabled: !!campaign?.ngoId,
  });

  const { data: donationsRes } = useQuery({
    queryKey: ['campaign-donations', id],
    queryFn: () => campaignService.getCampaignSupporters(id as string, 10),
    enabled: !!id,
  });
  const recentDonations = Array.isArray(donationsRes) ? donationsRes : [];

  if (isCampLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-neutral-500 text-sm">Loading campaign details...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Campaign Not Found</h2>
        <p className="text-neutral-500 text-sm mb-6">The campaign you are looking for may have concluded or the link is invalid.</p>
        <Link to="/explore">
          <Button className="rounded-xl">Browse Other Causes</Button>
        </Link>
      </div>
    );
  }

  const percentage = Math.min(Math.round((campaign.raisedAmount / campaign.targetAmount) * 100), 100);
  const supportersCount = campaign.supportersCount || Math.max(recentDonations.length, 1);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign.title,
          text: `Support ${campaign.title} on NobleNet!`,
          url: window.location.href,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Campaign link copied to clipboard!');
      } catch {
        toast.info(window.location.href);
      }
    } else {
      toast.info(window.location.href);
    }
  };

  return (
    <div className="pb-28 md:pb-16 bg-neutral-50/40 min-h-screen">
      {/* Top back navigation */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 max-w-7xl py-3 flex items-center justify-between">
          <Link to="/explore" className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Explore
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleShare} className="text-xs h-8 gap-1 text-neutral-600 cursor-pointer">
              <Share2 className="w-3.5 h-3.5" /> Share
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl pt-6">
        {/* Campaign Header & Category */}
        <div className="max-w-4xl mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-900 text-xs font-semibold border-0">
              {campaign.category}
            </Badge>
            <span className="text-xs text-neutral-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-neutral-400" /> {campaign.location || 'India'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-neutral-900 tracking-tight leading-tight mb-4">
            {campaign.title}
          </h1>
        </div>

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Story & Details Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Feature Image */}
            <div className="rounded-3xl overflow-hidden border border-neutral-200 shadow-xs bg-neutral-100 aspect-[16/10] sm:aspect-[16/9]">
              <img
                src={campaign.imageUrl || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200'}
                className="w-full h-full object-cover"
                alt={campaign.title}
              />
            </div>

            {/* Organizer Card */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-full border border-neutral-200 overflow-hidden shrink-0 bg-emerald-50 flex items-center justify-center">
                  {ngo?.logoUrl ? (
                    <img src={ngo.logoUrl} className="w-full h-full object-cover" alt="NGO Logo" />
                  ) : (
                    <Building2 className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-neutral-900 text-sm sm:text-base truncate">
                    {ngo?.name || 'Verified Non-Profit'}
                  </h3>
                  <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>80G Registered & Verified Organization</span>
                  </div>
                </div>
              </div>
              <Link to={`/ngos/${campaign.ngoId}`}>
                <Button variant="outline" size="sm" className="shrink-0 text-xs rounded-lg h-8 cursor-pointer">
                  View NGO <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>

            {/* Campaign Story */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/80 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">About this cause</h2>
              <div className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed space-y-4 text-sm sm:text-base">
                <p className="whitespace-pre-line">{campaign.description}</p>
                <p>
                  Every rupee collected goes directly to emergency relief operations, supplies, and field assistance. Donors receive an instant tax receipt (80G eligible) and transparent progress reports from the organizers.
                </p>
              </div>
            </div>

            {/* Transparency & Guarantee Box */}
            <div className="bg-emerald-50/60 rounded-2xl p-6 border border-emerald-200/80 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <span>NobleNet Verified Guarantee</span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                NobleNet conducts strict due diligence on all organizers. Bank accounts are verified directly in the NGO's registered legal name. Funds are disbursed with full audit logs and transparent reporting.
              </p>
            </div>
          </div>

          {/* Desktop Sticky Donation Sidebar */}
          <div className="hidden lg:block lg:col-span-4 sticky top-20">
            <div className="bg-white rounded-2xl shadow-md border border-neutral-200/90 p-6 space-y-6">
              {/* Progress Summary */}
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-black text-neutral-900">
                    ₹{campaign.raisedAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">raised</span>
                </div>
                <div className="text-xs text-neutral-500 mb-3">
                  of ₹{campaign.targetAmount.toLocaleString('en-IN')} goal
                </div>
                <Progress value={percentage} className="h-2.5 bg-neutral-100" />
                <div className="flex justify-between items-center text-xs font-medium text-neutral-500 mt-2">
                  <span>{percentage}% funded</span>
                  <span>{campaign.daysRemaining > 0 ? `${campaign.daysRemaining} days left` : 'Completed'}</span>
                </div>
              </div>

              {/* Supporter & Time Metrics */}
              <div className="grid grid-cols-2 gap-3 py-3 border-y border-neutral-100 text-xs">
                <div className="flex items-center gap-2 text-neutral-700 font-medium">
                  <Users className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span>{supportersCount} supporters</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-700 font-medium">
                  <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span>{campaign.daysRemaining > 0 ? `${campaign.daysRemaining} days left` : 'Finished'}</span>
                </div>
              </div>

              {/* Action CTAs */}
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full text-base h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl shadow-xs cursor-pointer"
                  onClick={() => navigate(`/campaigns/${id}/donate`)}
                >
                  Donate Now
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-11 gap-2 text-sm font-semibold rounded-xl border-neutral-300 hover:bg-neutral-50 cursor-pointer"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" /> Share Campaign
                </Button>
              </div>

              {/* Recent Supporters */}
              <div className="pt-4 border-t border-neutral-100">
                <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-700 mb-3">
                  Recent Supporters ({recentDonations.length})
                </h4>
                <div className="space-y-3">
                  {recentDonations.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-4 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                      Be the first supporter to donate to this cause!
                    </p>
                  ) : (
                    recentDonations.slice(0, 5).map((donation: any) => (
                      <div key={donation._id} className="flex gap-3 items-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-primary shrink-0">
                          <Heart className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-xs text-neutral-900 truncate">
                            {donation.donorName || 'Generous Supporter'}
                          </div>
                          <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                            <span className="font-bold text-emerald-700">₹{donation.amount.toLocaleString('en-IN')}</span>
                            <span>• Verified</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3.5 bg-white/95 backdrop-blur-md border-t border-neutral-200 z-50 lg:hidden shadow-lg">
        <div className="container mx-auto px-2 flex items-center justify-between gap-4 max-w-lg">
          <div className="min-w-0">
            <div className="text-base font-black text-neutral-900 truncate">
              ₹{campaign.raisedAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-neutral-500 font-medium truncate">
              {percentage}% of ₹{campaign.targetAmount.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-3 rounded-xl border-neutral-300"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              size="default"
              className="h-10 px-6 font-bold text-sm rounded-xl cursor-pointer shadow-xs"
              onClick={() => navigate(`/campaigns/${id}/donate`)}
            >
              Donate Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
