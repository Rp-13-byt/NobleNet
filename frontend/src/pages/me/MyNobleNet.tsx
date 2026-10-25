import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { donationService } from '@/services/donationService';
import { volunteerService } from '@/services/volunteerService';
import { wishlistService } from '@/services/wishlistService';
import { campaignService } from '@/services/campaignService';
import { adminService, PendingNgo } from '@/services/adminService';
import { ngoService } from '@/services/ngoService';
import { PageMeta } from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Heart,
  Package,
  Clock,
  ShieldCheck,
  Building2,
  Users,
  Target,
  Megaphone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  ArrowRight,
  ExternalLink,
  PlusCircle,
  FileCheck2,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react';

export function MyNobleNet() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(tabParam);

  // Sync tab with search params
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setSearchParams({ tab: val });
  };

  // Revalidate profile in background on mount
  useEffect(() => {
    authService.getMe().catch(() => {});
  }, []);

  // ─── Donor / Volunteer Data Queries ───
  const { data: myDonations, isLoading: donationsLoading } = useQuery({
    queryKey: ['my-donations'],
    queryFn: () => donationService.getMyDonations(),
    enabled: user?.role === 'USER',
  });

  const { data: myVolunteerApps, isLoading: appsLoading } = useQuery({
    queryKey: ['my-volunteer-apps'],
    queryFn: () => volunteerService.getMyApplications(),
    enabled: user?.role === 'USER',
  });

  const { data: myItemDonations, isLoading: itemsLoading } = useQuery({
    queryKey: ['my-item-donations'],
    queryFn: () => wishlistService.getMyItemDonations(),
    enabled: user?.role === 'USER',
  });

  // ─── NGO Data Queries ───
  const { data: myNgoProfile } = useQuery({
    queryKey: ['my-ngo-profile'],
    queryFn: () => ngoService.getMyNgoProfile(),
    enabled: user?.role === 'NGO',
  });

  const { data: allCampaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignService.getCampaigns(),
    enabled: user?.role === 'NGO',
  });

  const { data: ngoVolunteerApps } = useQuery({
    queryKey: ['ngo-volunteer-apps'],
    queryFn: () => volunteerService.getNgoApplications(),
    enabled: user?.role === 'NGO',
  });

  // ─── Super Admin Queries ───
  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getStats(),
    enabled: user?.role === 'SUPER_ADMIN',
  });

  const { data: pendingNgos, isLoading: pendingNgosLoading } = useQuery({
    queryKey: ['admin-pending-ngos'],
    queryFn: () => adminService.getPendingNgos(),
    enabled: user?.role === 'SUPER_ADMIN',
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => adminService.getAuditLogs(),
    enabled: user?.role === 'SUPER_ADMIN',
  });

  // ─── Admin Review Modal State ───
  const [selectedNgo, setSelectedNgo] = useState<PendingNgo | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: 'APPROVED' | 'REJECTED'; notes: string }) =>
      adminService.reviewNgo(id, status, notes),
    onSuccess: (_, variables) => {
      toast.success(`NGO ${variables.status === 'APPROVED' ? 'approved' : 'rejected'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-pending-ngos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      setSelectedNgo(null);
      setReviewNotes('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update NGO status');
    },
  });

  // ─── Volunteer Application Mutations (for NGO) ───
  const approveAppMutation = useMutation({
    mutationFn: (appId: string) => volunteerService.approveApplication(appId),
    onSuccess: () => {
      toast.success('Volunteer application approved!');
      queryClient.invalidateQueries({ queryKey: ['ngo-volunteer-apps'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to approve application');
    },
  });

  const rejectAppMutation = useMutation({
    mutationFn: (appId: string) => volunteerService.rejectApplication(appId),
    onSuccess: () => {
      toast.success('Volunteer application rejected');
      queryClient.invalidateQueries({ queryKey: ['ngo-volunteer-apps'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reject application');
    },
  });

  // Calculated stats for User
  const totalDonated = (myDonations || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalItemsPledged = (myItemDonations || []).length;
  const totalVolunteering = (myVolunteerApps || []).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      <PageMeta title="My NobleNet | Activity & Impact Hub" description="Track your contributions, receipts, and verified social impact." />

      {/* ─── Profile Header Strip ─── */}
      <div className="bg-white border rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-2xl shrink-0 shadow-inner">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{user?.name}</h1>
              {user?.role === 'SUPER_ADMIN' && (
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">Super Admin</Badge>
              )}
              {user?.role === 'NGO' && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">NGO Representative</Badge>
              )}
              {user?.role === 'USER' && (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Verified Citizen</Badge>
              )}
            </div>
            <p className="text-sm text-neutral-500 mt-1">{user?.email}</p>
          </div>
        </div>

        {/* Quick Context Action Button */}
        <div className="flex items-center gap-3">
          {user?.role === 'USER' && (
            <Link to="/campaigns">
              <Button className="gap-2 rounded-xl cursor-pointer">
                <Heart className="w-4 h-4" /> Explore Causes
              </Button>
            </Link>
          )}
          {user?.role === 'NGO' && (
            <Link to="/organization">
              <Button className="gap-2 rounded-xl cursor-pointer">
                <Building2 className="w-4 h-4" /> Organization Hub <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
          {user?.role === 'SUPER_ADMIN' && (
            <Link to="/admin">
              <Button className="gap-2 rounded-xl cursor-pointer">
                <ShieldCheck className="w-4 h-4" /> Administration Hub <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* ─── ROLE: USER (DONOR & VOLUNTEER) ─── */}
      {user?.role === 'USER' && (
        <div className="space-y-8">
          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-neutral-200/80 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Total Donated
                </CardTitle>
                <Heart className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-neutral-900">₹{totalDonated.toLocaleString('en-IN')}</div>
                <p className="text-[11px] text-neutral-500 mt-1 font-medium">80G tax deductible</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-neutral-200/80 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Items Pledged
                </CardTitle>
                <Package className="w-4 h-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-neutral-900">{totalItemsPledged}</div>
                <p className="text-[11px] text-neutral-500 mt-1 font-medium">Essential supplies</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-neutral-200/80 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Volunteer Work
                </CardTitle>
                <Clock className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-neutral-900">{totalVolunteering}</div>
                <p className="text-[11px] text-neutral-500 mt-1 font-medium">Active applications</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-neutral-200/80 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Causes Supported
                </CardTitle>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-neutral-900">{(myDonations || []).length}</div>
                <p className="text-[11px] text-neutral-500 mt-1 font-medium">Verified NGO projects</p>
              </CardContent>
            </Card>
          </div>

          {/* Contextual Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="bg-white border rounded-xl p-1 h-auto flex flex-wrap gap-1">
              <TabsTrigger value="overview" className="rounded-lg text-xs font-semibold">
                Overview
              </TabsTrigger>
              <TabsTrigger value="donations" className="rounded-lg text-xs font-semibold">
                Donations & Receipts
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="rounded-lg text-xs font-semibold">
                Wishlist Pledges
              </TabsTrigger>
              <TabsTrigger value="volunteering" className="rounded-lg text-xs font-semibold">
                Volunteering
              </TabsTrigger>
            </TabsList>

            {/* Overview / Combined Stream */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* Recent Donations summary card */}
                  <Card className="rounded-2xl shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold">Recent Contributions</CardTitle>
                        <CardDescription>Direct support to verified beneficiaries</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleTabChange('donations')}>
                        View all
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {donationsLoading ? (
                        <div className="py-8 text-center text-sm text-neutral-500">Loading donation history...</div>
                      ) : !myDonations || myDonations.length === 0 ? (
                        <div className="py-8 text-center text-sm text-neutral-500 space-y-3">
                          <Heart className="w-8 h-8 text-neutral-300 mx-auto" />
                          <p>You haven't made any donations yet.</p>
                          <Link to="/campaigns">
                            <Button size="sm" variant="outline">
                              Browse Urgent Causes
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {myDonations.slice(0, 3).map((d) => (
                            <div
                              key={d._id}
                              className="p-4 border rounded-xl flex items-center justify-between gap-4 hover:border-neutral-300 transition-colors"
                            >
                              <div>
                                <div className="font-bold text-sm text-neutral-900">{d.campaignId?.title || 'NobleNet Cause'}</div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                  {new Date(d.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-extrabold text-base text-neutral-900">
                                  ₹{d.amount.toLocaleString('en-IN')}
                                </span>
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                  {d.paymentStatus}
                                </Badge>
                                <Link to={`/donations/${d._id}/receipt`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-600">
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Impact Certificate & Tax note */}
                <div className="space-y-6">
                  <Card className="rounded-2xl bg-gradient-to-br from-primary/5 to-accent/10 border-primary/20 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
                        <ShieldCheck className="w-5 h-5 text-primary" /> Tax Exemption Certificate
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs text-neutral-700 leading-relaxed">
                      <p>
                        All donations on NobleNet are eligible for a 50% deduction under Section 80G of the Indian Income Tax Act.
                      </p>
                      <p className="font-semibold text-neutral-900">
                        Total eligible deduction: ₹{(totalDonated / 2).toLocaleString('en-IN')}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Full Donations List */}
            <TabsContent value="donations">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>My Monetary Donations</CardTitle>
                  <CardDescription>Track payment status and download 80G verified certificates</CardDescription>
                </CardHeader>
                <CardContent>
                  {!myDonations || myDonations.length === 0 ? (
                    <div className="py-12 text-center text-sm text-neutral-500">No donations yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {myDonations.map((d) => (
                        <div
                          key={d._id}
                          className="p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white"
                        >
                          <div>
                            <div className="font-bold text-base text-neutral-900">{d.campaignId?.title || 'NobleNet Cause'}</div>
                            <div className="text-xs text-neutral-500 mt-1">
                              Date: {new Date(d.createdAt).toLocaleDateString()} • Ref: {d.transactionReference || d._id}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <span className="font-black text-lg text-neutral-900">₹{d.amount.toLocaleString('en-IN')}</span>
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">{d.paymentStatus}</Badge>
                            <Link to={`/donations/${d._id}/receipt`}>
                              <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs">
                                <FileText className="w-3.5 h-3.5" /> Receipt
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Wishlist Pledges */}
            <TabsContent value="wishlist">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>My Item Pledges</CardTitle>
                  <CardDescription>Physical supplies pledged directly to verified grassroots centers</CardDescription>
                </CardHeader>
                <CardContent>
                  {!myItemDonations || myItemDonations.length === 0 ? (
                    <div className="py-12 text-center text-sm text-neutral-500 space-y-3">
                      <Package className="w-8 h-8 text-neutral-300 mx-auto" />
                      <p>You haven't pledged any wishlist items yet.</p>
                      <Link to="/wishlist">
                        <Button size="sm" variant="outline">
                          Browse NGO Wishlists
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myItemDonations.map((item: any) => (
                        <div key={item._id} className="p-4 border rounded-xl flex items-center justify-between gap-4">
                          <div>
                            <div className="font-bold text-sm text-neutral-900">
                              {item.wishlistItemId?.itemName || 'Essential Item'}
                            </div>
                            <div className="text-xs text-neutral-500 mt-0.5">
                              Quantity pledged: {item.quantity} • Delivery: {item.deliveryMode || 'Direct to Center'}
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {item.status || 'RESERVED'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Volunteering */}
            <TabsContent value="volunteering">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>My Volunteer Applications</CardTitle>
                  <CardDescription>On-ground events and programs you applied to support</CardDescription>
                </CardHeader>
                <CardContent>
                  {!myVolunteerApps || myVolunteerApps.length === 0 ? (
                    <div className="py-12 text-center text-sm text-neutral-500 space-y-3">
                      <Clock className="w-8 h-8 text-neutral-300 mx-auto" />
                      <p>No volunteer applications yet.</p>
                      <Link to="/volunteers">
                        <Button size="sm" variant="outline">
                          Find Volunteer Opportunities
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myVolunteerApps.map((app: any) => (
                        <div key={app._id} className="p-4 border rounded-xl flex items-center justify-between gap-4">
                          <div>
                            <div className="font-bold text-sm text-neutral-900">
                              {app.opportunityId?.title || 'Volunteer Activity'}
                            </div>
                            <div className="text-xs text-neutral-500 mt-0.5">
                              Applied on {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              app.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }
                          >
                            {app.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* ─── ROLE: NGO REPRESENTATIVE ─── */}
      {user?.role === 'NGO' && (
        <div className="space-y-8">
          {/* Check Verification Status */}
          {myNgoProfile && myNgoProfile.status !== 'APPROVED' ? (
            /* Organization Verification in Progress Panel */
            <Card className="rounded-2xl border-amber-200 bg-amber-50/40 p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Organization Verification in Progress</h2>
                  <p className="text-sm text-neutral-600 mt-1">
                    Your NGO application for <strong>{myNgoProfile.organizationName}</strong> is currently being reviewed
                    by our Trust & Safety compliance team.
                  </p>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" /> 1. Registration Submitted
                  </div>
                  <p className="text-xs text-neutral-500">Reg #: {myNgoProfile.registrationNumber}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-amber-300 shadow-sm space-y-1">
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin" /> 2. Document & FCRA Review
                  </div>
                  <p className="text-xs text-neutral-500">Under active administrative review</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-1 opacity-75">
                  <div className="flex items-center gap-2 text-neutral-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" /> 3. Verification & Live Campaigns
                  </div>
                  <p className="text-xs text-neutral-500">Granted upon approval</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs text-neutral-500 border-t border-amber-200">
                <span>Verification typically completes within 24-48 hours.</span>
                <a href="mailto:support@noblenet.org" className="text-primary font-semibold hover:underline">
                  Contact Support
                </a>
              </div>
            </Card>
          ) : (
            /* Fully Verified NGO View */
            <div className="space-y-8">
              {/* Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-2xl border-neutral-200/80 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Active Campaigns
                    </CardTitle>
                    <Megaphone className="w-4 h-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black text-neutral-900">{(allCampaigns || []).length}</div>
                    <p className="text-[11px] text-neutral-500 mt-1 font-medium">Publicly active</p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-neutral-200/80 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Volunteer Applicants
                    </CardTitle>
                    <Users className="w-4 h-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black text-neutral-900">{(ngoVolunteerApps || []).length}</div>
                    <p className="text-[11px] text-neutral-500 mt-1 font-medium">Community members</p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-neutral-200/80 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Verified Status
                    </CardTitle>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-base font-bold text-emerald-700 flex items-center gap-1.5 mt-1">
                      <CheckCircle2 className="w-4 h-4" /> Active & Verified
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1 font-medium">80G tax compliant</p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-neutral-200/80 shadow-sm flex flex-col justify-center items-center p-4 text-center">
                  <Link to="/organization" className="w-full">
                    <Button variant="outline" className="w-full font-bold text-xs gap-1.5 rounded-xl">
                      <Building2 className="w-4 h-4" /> Full Organization Workspace
                    </Button>
                  </Link>
                </Card>
              </div>

              {/* Summary Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Campaigns Summary */}
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold">Campaigns Overview</CardTitle>
                      <CardDescription>Live causes fundraising on NobleNet</CardDescription>
                    </div>
                    <Link to="/organization/campaigns">
                      <Button variant="ghost" size="sm" className="text-xs">
                        Manage
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {!allCampaigns || allCampaigns.length === 0 ? (
                      <p className="text-sm text-neutral-500 py-6 text-center">No active campaigns yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {allCampaigns.slice(0, 3).map((c) => (
                          <div key={c.id} className="p-3 border rounded-xl space-y-2">
                            <div className="flex justify-between font-bold text-sm">
                              <span>{c.title}</span>
                              <Badge variant="outline">{c.status}</Badge>
                            </div>
                            <div className="text-xs text-neutral-500">
                              ₹{c.raisedAmount.toLocaleString()} of ₹{c.targetAmount.toLocaleString()} raised
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Volunteer Applications Summary */}
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold">Incoming Volunteer Applicants</CardTitle>
                      <CardDescription>Review and accept volunteers</CardDescription>
                    </div>
                    <Link to="/organization/volunteers">
                      <Button variant="ghost" size="sm" className="text-xs">
                        Manage
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {!ngoVolunteerApps || ngoVolunteerApps.length === 0 ? (
                      <p className="text-sm text-neutral-500 py-6 text-center">No pending volunteer applications.</p>
                    ) : (
                      <div className="space-y-3">
                        {ngoVolunteerApps.slice(0, 3).map((app: any) => (
                          <div key={app._id} className="p-3 border rounded-xl flex items-center justify-between gap-3">
                            <div>
                              <div className="font-bold text-sm">{app.userId?.name || 'Applicant'}</div>
                              <div className="text-xs text-neutral-500">{app.opportunityId?.title || 'Volunteer Activity'}</div>
                            </div>
                            {app.status === 'PENDING' ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs text-red-600"
                                  onClick={() => rejectAppMutation.mutate(app._id)}
                                >
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => approveAppMutation.mutate(app._id)}
                                >
                                  Approve
                                </Button>
                              </div>
                            ) : (
                              <Badge variant="outline">{app.status}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── ROLE: SUPER ADMIN ─── */}
      {user?.role === 'SUPER_ADMIN' && (
        <div className="space-y-8">
          {/* Admin Platform Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-neutral-200/80 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Total Users
                </CardTitle>
                <Users className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-neutral-900">
                  {statsLoading ? '...' : adminStats?.users?.total ?? 0}
                </div>
                <p className="text-[11px] text-neutral-500 mt-1 font-medium">Active platform accounts</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-neutral-200/80 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Verified NGOs
                </CardTitle>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-neutral-900">
                  {statsLoading ? '...' : adminStats?.ngos?.approved ?? 0}
                </div>
                <p className="text-[11px] text-neutral-500 mt-1 font-medium">Verified organizations</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-neutral-200/80 shadow-sm bg-amber-50/50 border-amber-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                  Pending Review
                </CardTitle>
                <Clock className="w-4 h-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-amber-800">
                  {statsLoading ? '...' : adminStats?.ngos?.pending ?? 0}
                </div>
                <p className="text-[11px] text-amber-600 mt-1 font-medium">Awaiting compliance check</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-neutral-200/80 shadow-sm flex flex-col justify-center items-center p-4 text-center">
              <Link to="/admin" className="w-full">
                <Button variant="outline" className="w-full font-bold text-xs gap-1.5 rounded-xl">
                  <ShieldCheck className="w-4 h-4" /> Full Admin Workspace
                </Button>
              </Link>
            </Card>
          </div>

          {/* Pending NGO Verification Queue on My NobleNet */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Pending NGO Verification Queue</CardTitle>
                <CardDescription>Review credentials and approve fundraising privileges</CardDescription>
              </div>
              <Badge variant="outline">{pendingNgos?.length || 0} Pending</Badge>
            </CardHeader>
            <CardContent>
              {pendingNgosLoading ? (
                <div className="py-8 text-center text-sm text-neutral-500">Loading queue...</div>
              ) : !pendingNgos || pendingNgos.length === 0 ? (
                <div className="py-8 text-center text-sm text-neutral-500 flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  <span>All NGO applications are verified! No pending reviews.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingNgos.map((ngo) => (
                    <div
                      key={ngo._id}
                      className="p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white"
                    >
                      <div>
                        <div className="font-bold text-base text-neutral-900">{ngo.organizationName}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">
                          Reg #: {ngo.registrationNumber} • {ngo.address}
                        </div>
                        <div className="text-xs text-neutral-500">Contact: {ngo.contactEmail}</div>
                      </div>
                      <Button size="sm" onClick={() => setSelectedNgo(ngo)} className="rounded-xl self-end sm:self-auto">
                        Review Application
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Admin Review Modal ─── */}
      {selectedNgo && (
        <Dialog open={Boolean(selectedNgo)} onOpenChange={(open) => !open && setSelectedNgo(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Review NGO Registration</DialogTitle>
              <DialogDescription>
                Verify {selectedNgo.organizationName} credentials before granting fundraising access.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="bg-neutral-50 p-3 rounded-md text-xs space-y-1">
                <div><span className="font-semibold">Registration #:</span> {selectedNgo.registrationNumber}</div>
                <div><span className="font-semibold">Email:</span> {selectedNgo.contactEmail}</div>
                <div><span className="font-semibold">Phone:</span> {selectedNgo.contactPhone}</div>
                <div><span className="font-semibold">Address:</span> {selectedNgo.address}</div>
                <div className="pt-2"><span className="font-semibold">Description:</span> {selectedNgo.description}</div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Verification Notes / Reason</label>
                <Textarea
                  placeholder="e.g., FCRA verified or missing document explanation..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => reviewMutation.mutate({ id: selectedNgo._id, status: 'REJECTED', notes: reviewNotes })}
                disabled={reviewMutation.isPending}
              >
                <XCircle className="w-4 h-4 mr-1" /> Reject
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => reviewMutation.mutate({ id: selectedNgo._id, status: 'APPROVED', notes: reviewNotes })}
                disabled={reviewMutation.isPending}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" /> Approve NGO
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
