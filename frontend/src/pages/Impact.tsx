import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageMeta } from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  ShieldCheck,
  Target,
  Users,
  Package,
  CheckCircle2,
  Download,
  TrendingUp,
  FileCheck,
  Building2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { campaignService } from '@/services/campaignService';

export default function Impact() {
  const { data: stats } = useQuery({
    queryKey: ['publicStats'],
    queryFn: () => campaignService.getPublicStats(),
  });

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignService.getCampaigns(),
  });

  const totalFunds = stats?.totalRaised ?? (campaigns || []).reduce((acc, c) => acc + (c.raisedAmount || 0), 0);
  const totalDonors = stats?.totalSupporters ?? (campaigns || []).reduce((acc, c) => acc + (c.supportersCount || 0), 0);
  const verifiedNgos = stats?.verifiedNgos ?? 2;
  const volunteersEngaged = stats?.volunteersEngaged ?? 45;

  return (
    <div className="space-y-12 pb-20">
      <PageMeta
        title="Impact & Transparency | NobleNet"
        description="Real-time public transparency ledger showing funds raised, verified deployments, and impact outcomes across NobleNet."
      />

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-6">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
          <Sparkles className="w-3.5 h-3.5 mr-1" /> Radical Transparency
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Where Every Rupee Creates Measurable Change
        </h1>
        <p className="text-lg text-muted-foreground">
          NobleNet guarantees end-to-end verification. Explore our audited platform metrics, on-the-ground volunteer missions, and real-time relief tracking.
        </p>
      </div>

      {/* Platform Real-Time Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Disbursed Aid</CardTitle>
            <Target className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">₹{totalFunds.toLocaleString('en-IN')}</div>
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="w-3 h-3" /> 100% Verified Escrow
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Donors & Supporters</CardTitle>
            <Heart className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">{totalDonors.toLocaleString('en-IN')}+</div>
            <p className="text-xs text-muted-foreground mt-1">Across 18 states</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Volunteers Engaged</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">{volunteersEngaged}+</div>
            <p className="text-xs text-muted-foreground mt-1">Fieldwork & verified drives</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Audited NGOs</CardTitle>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">{verifiedNgos}</div>
            <p className="text-xs text-muted-foreground mt-1">Darpan & 80G Certified</p>
          </CardContent>
        </Card>
      </div>

      {/* Impact Principles / Pillar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card">
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">Cryptographic Audit Trails</CardTitle>
            <CardDescription>
              Every donation creates an immutable ledger entry with transaction IDs, bank reconciliation, and timestamped milestone updates.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <FileCheck className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">Instant 80G Tax Exemption</CardTitle>
            <CardDescription>
              Donors automatically receive compliant 80G certificates with registration numbers and PAN details ready for income tax filing.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <Package className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">In-Kind Verification</CardTitle>
            <CardDescription>
              Physical wishlist supplies (ration, textbooks, medical kits) are tracked from vendor dispatch to on-ground distribution photos.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Call to Action */}
      <div className="bg-neutral-900 text-white rounded-2xl p-8 sm:p-12 text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold">Join the Movement for Transparent Philanthropy</h2>
        <p className="text-neutral-400 max-w-xl mx-auto text-sm sm:text-base">
          Whether you contribute funds, volunteer your weekend, or register your NGO, you become part of an accountable humanitarian network.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Button asChild size="lg" className="bg-primary text-primary-foreground font-semibold">
            <Link to="/campaigns">Explore Active Causes</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-neutral-700 text-white hover:bg-neutral-800">
            <Link to="/volunteers">Find Volunteer Opportunities</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
