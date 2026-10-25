import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { volunteerService } from '@/services/volunteerService';
import { campaignService } from '@/services/campaignService';
import { apiClient } from '@/services/apiClient';
import { PageMeta } from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CreateCampaignModal } from './CreateCampaignModal';
import { CreateWishlistItemModal } from './CreateWishlistItemModal';
import { CreateVolunteerOppModal } from './CreateVolunteerOppModal';
import { PostImpactModal } from './PostImpactModal';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle,
  Target,
  Megaphone,
  Package,
  Users,
  ExternalLink,
  ShieldCheck,
  FileText,
  HelpCircle,
  RefreshCw,
  Sparkles,
  HeartHandshake,
  Calendar,
  MapPin,
} from 'lucide-react';

export default function OrganizationWorkspace() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  // Modals state
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);
  const [selectedCampaignForImpact, setSelectedCampaignForImpact] = useState<string | undefined>(undefined);

  // Background revalidation of NGO status on mount
  const { data: currentUserProfile, refetch: refetchProfile, isFetching: isRefreshingUser } = useQuery({
    queryKey: ['currentUserProfile'],
    queryFn: () => authService.getMe(),
    staleTime: 30000,
  });

  // NGO profile lookup
  const { data: ngoProfileRes } = useQuery({
    queryKey: ['ngo-my-profile'],
    queryFn: () => apiClient.get<any>('/ngos/profile'),
  });
  const ngo = ngoProfileRes?.data;
  const ngoId = ngo?._id;

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignService.getCampaigns(),
  });

  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ['ngo-volunteer-apps'],
    queryFn: () => volunteerService.getNgoApplications(),
  });

  // NGO Wishlists & Items
  const { data: ngoWishlistsRes } = useQuery({
    queryKey: ['ngo-wishlists', ngoId],
    queryFn: () => apiClient.get<any>(`/wishlists${ngoId ? `?ngoId=${ngoId}` : ''}`),
  });
  const defaultWishlistId = ngoWishlistsRes?.data?.[0]?._id;

  const { data: wishlistItemRes, isLoading: itemsLoading } = useQuery({
    queryKey: ['ngo-wishlist-items', defaultWishlistId],
    queryFn: () => defaultWishlistId ? apiClient.get<any>(`/wishlists/${defaultWishlistId}/items`) : Promise.resolve({ data: [] }),
    enabled: !!defaultWishlistId,
  });
  const wishlistItems = wishlistItemRes?.data || [];

  // NGO Impact Reports
  const { data: impactRes, isLoading: impactLoading } = useQuery({
    queryKey: ['ngo-impact', ngoId],
    queryFn: () => ngoId ? apiClient.get<any>(`/impact/ngo/${ngoId}`) : Promise.resolve({ data: [] }),
    enabled: !!ngoId,
  });
  const impactReports = impactRes?.data || [];

  const approveMutation = useMutation({
    mutationFn: (appId: string) => volunteerService.approveApplication(appId),
    onSuccess: () => {
      toast.success('Volunteer application approved!');
      queryClient.invalidateQueries({ queryKey: ['ngo-volunteer-apps'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to approve application');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (appId: string) => volunteerService.rejectApplication(appId),
    onSuccess: () => {
      toast.success('Volunteer application rejected');
      queryClient.invalidateQueries({ queryKey: ['ngo-volunteer-apps'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reject application');
    },
  });

  // Authoritative NGO Dashboard aggregation
  const { data: dashboardData } = useQuery({
    queryKey: ['ngo-dashboard'],
    queryFn: () => apiClient.get<any>('/ngo/dashboard').catch(() => null),
  });

  const isVerified = Boolean(
    currentUserProfile?.user?.isVerified ||
    user?.isVerified ||
    ngo?.status === 'VERIFIED' ||
    dashboardData?.summary?.isVerified
  );

  const handleTabChange = (val: string) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', val);
      return p;
    });
  };

  const totalFundsRaised = dashboardData?.summary?.totalRaised ?? (campaigns || []).reduce((acc, c) => acc + (c.raisedAmount || 0), 0);
  const pendingApps = dashboardData?.summary?.pendingVolunteerApplications ?? (applications || []).filter((a: any) => a.status === 'PENDING').length;

  return (
    <div className="space-y-8 pb-16">
      <PageMeta
        title="Organization Workspace | NobleNet"
        description="Comprehensive NGO management console for fundraising campaigns, volunteer deployment, and donor updates."
      />

      {/* Header Banner */}
      <div className="bg-white border-b border-neutral-200/80 -mx-4 px-4 sm:-mx-8 sm:px-8 pt-8 pb-6 mb-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-4xl font-black text-neutral-900 tracking-tight">{user?.name || 'Organization'} Workspace</h1>
              {isVerified ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200/60 shadow-xs px-2.5 py-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Verified NGO
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200/60 shadow-xs px-2.5 py-0.5">
                  <Clock className="w-3.5 h-3.5 mr-1.5" /> Verification Pending
                </Badge>
              )}
            </div>
            <p className="text-neutral-500 text-sm sm:text-base max-w-2xl">
              Manage your public listings, respond to volunteer applicants, and publish impact reports to your donors.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              className="gap-2 bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 rounded-xl h-11 px-5 shadow-xs font-semibold"
              onClick={() => {
                toast.success('Syncing with platform...');
                refetchProfile();
                queryClient.invalidateQueries();
              }}
              disabled={isRefreshingUser}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingUser ? 'animate-spin' : ''}`} />
              Sync Status
            </Button>
            <Button variant="outline" className="gap-2 bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 rounded-xl h-11 px-5 shadow-xs font-semibold" asChild>
              <Link to="/me">Back to My NobleNet</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
{/* Unverified / Pending Notice */}
      {!isVerified && (
        <div className="mb-10 bg-amber-50/50 border border-amber-200/70 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0 border border-amber-200/50 shadow-sm">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 mb-1">Application Under Review</h3>
                <p className="text-sm text-amber-900/80 leading-relaxed max-w-3xl">
                  Your NGO verification documents are currently being reviewed by our Trust & Safety team. 
                  To protect platform donors, campaigns and volunteer positions can only receive public contributions after credential verification (usually 24–48 hours).
                </p>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-4 pt-4">
                <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-xs space-y-1">
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">1. Documents Submitted</div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" /> Received
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-xs space-y-1 ring-1 ring-amber-400/20">
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">2. Super Admin Audit</div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-600">
                    <Clock className="w-4 h-4" /> In Progress
                  </div>
                </div>
                <div className="bg-white/60 rounded-xl p-4 border border-neutral-100 space-y-1">
                  <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">3. Live Fundraising</div>
                  <div className="text-sm text-neutral-400 font-medium">Pending approval</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-amber-700/80 pt-2 font-medium">
                <HelpCircle className="w-4 h-4" />
                Need urgent assistance? Reach our compliance desk at <a href="mailto:support@noblenet.org" className="underline hover:text-amber-900">support@noblenet.org</a>.
              </div>
            </div>
          </div>
        </div>
      )}

{/* KPI Overview Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Raised</div>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><Target className="w-4 h-4" /></div>
          </div>
          <div className="text-3xl font-black text-neutral-900 tracking-tight">₹{totalFundsRaised.toLocaleString()}</div>
          <div className="text-xs font-medium text-neutral-500 mt-1.5">Across all public drives</div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Active Campaigns</div>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600"><Megaphone className="w-4 h-4" /></div>
          </div>
          <div className="text-3xl font-black text-neutral-900 tracking-tight">{campaigns?.filter(c => c.status === 'Active').length || 0}</div>
          <div className="text-xs font-medium text-neutral-500 mt-1.5">Currently listed</div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Volunteer Inquiries</div>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Users className="w-4 h-4" /></div>
          </div>
          <div className="text-3xl font-black text-neutral-900 tracking-tight">{applications?.length || 0}</div>
          <div className={`text-xs font-bold mt-1.5 ${pendingApps > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {pendingApps} pending action
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Verification Trust</div>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><ShieldCheck className="w-4 h-4" /></div>
          </div>
          <div className={`text-2xl font-black tracking-tight ${isVerified ? 'text-emerald-600' : 'text-neutral-900'}`}>
            {isVerified ? 'Verified' : 'Pending'}
          </div>
          <div className="text-xs font-medium text-neutral-500 mt-2">Bank & 80G Certified</div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-8">
        <div className="flex justify-start overflow-x-auto pb-1 mb-6 border-b border-neutral-200/80 hide-scrollbar">
          <div className="flex justify-start overflow-x-auto pb-1 mb-6 border-b border-neutral-200/80 hide-scrollbar">
          <TabsList className="bg-transparent h-12 p-0 space-x-8">
            <TabsTrigger 
              value="overview" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm text-neutral-500 data-[state=active]:text-neutral-900 px-1 py-3"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="campaigns" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm text-neutral-500 data-[state=active]:text-neutral-900 px-1 py-3"
            >
              Campaigns ({campaigns?.length || 0})
            </TabsTrigger>
            <TabsTrigger 
              value="volunteers" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm text-neutral-500 data-[state=active]:text-neutral-900 px-1 py-3 relative"
            >
              Volunteers ({applications?.length || 0})
              {pendingApps > 0 && (
                <span className="absolute -top-1 -right-4 w-5 h-5 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {pendingApps}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="impact" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm text-neutral-500 data-[state=active]:text-neutral-900 px-1 py-3"
            >
              Impact Reports
            </TabsTrigger>
            <TabsTrigger 
              value="wishlists" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm text-neutral-500 data-[state=active]:text-neutral-900 px-1 py-3"
            >
              Wishlist Items
            </TabsTrigger>
          </TabsList>
        </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Active Fundraisers</CardTitle>
                <CardDescription>Top campaigns driving recent community donations.</CardDescription>
              </CardHeader>
              <CardContent>
                {campaignsLoading ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Loading campaigns...</p>
                ) : !campaigns || campaigns.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-3">No active campaigns yet.</p>
                    <Button size="sm" onClick={() => handleTabChange('campaigns')}>Create Your First Campaign</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {campaigns.slice(0, 3).map((c) => (
                      <div key={c.id} className="p-3 border rounded-lg flex justify-between items-center bg-card hover:bg-neutral-50">
                        <div className="space-y-1">
                          <div className="font-semibold text-sm line-clamp-1">{c.title}</div>
                          <div className="text-xs text-muted-foreground">
                            ₹{c.raisedAmount.toLocaleString()} raised of ₹{c.targetAmount.toLocaleString()}
                          </div>
                        </div>
                        <Badge variant="outline">{c.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Recent Volunteer Applications</CardTitle>
                <CardDescription>Applicants seeking to support your local fieldwork.</CardDescription>
              </CardHeader>
              <CardContent>
                {appsLoading ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Loading applicants...</p>
                ) : !applications || applications.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    No applicants waiting. New applicants will appear here immediately.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.slice(0, 3).map((app: any) => (
                      <div key={app._id} className="p-3 border rounded-lg flex justify-between items-center bg-card hover:bg-neutral-50">
                        <div className="space-y-1">
                          <div className="font-semibold text-sm">{app.userId?.name || 'Applicant'}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {app.opportunityId?.title || 'Volunteer drive'}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            app.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : app.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
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
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="mt-6 focus-visible:ring-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">Active Fundraisers</h2>
                <p className="text-sm text-neutral-500 mt-1.5">Manage your ongoing campaigns, post updates, and track donations.</p>
              </div>
              <Button
                size="lg"
                className="gap-2 font-bold cursor-pointer shadow-xs rounded-xl h-11 px-6 w-full sm:w-auto"
                disabled={!isVerified}
                onClick={() => setIsCampaignModalOpen(true)}
              >
                <PlusCircle className="w-5 h-5" /> Launch New Campaign
              </Button>
            </div>

            {!campaigns || campaigns.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-neutral-200/80 shadow-xs">
                <div className="w-20 h-20 bg-neutral-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-neutral-100 shadow-sm">
                  <Target className="w-10 h-10 text-neutral-400" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">No campaigns yet</h3>
                <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto leading-relaxed">
                  Start your first fundraiser to mobilize resources for medical aid, education, or disaster relief. Share your story with the world.
                </p>
                <Button
                  className="mt-8 font-bold rounded-xl shadow-xs h-11 px-8 text-base"
                  disabled={!isVerified}
                  onClick={() => setIsCampaignModalOpen(true)}
                >
                  <PlusCircle className="w-5 h-5 mr-2" /> Create First Campaign
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((c) => {
                  const percent = Math.min(100, Math.round((c.raisedAmount / c.targetAmount) * 100));
                  const isActive = c.status === 'Active';
                  return (
                    <div
                      key={c.id}
                      className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1.5"
                    >
                      <div className="aspect-[16/10] bg-neutral-100 relative overflow-hidden border-b border-neutral-100">
                        {c.imageUrl ? (
                          <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-50">
                            <Target className="w-12 h-12 text-neutral-300" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <Badge variant={isActive ? 'default' : 'secondary'} className={`font-semibold border-0 shadow-xs ${isActive ? 'bg-emerald-500 text-white' : 'bg-neutral-800 text-white'}`}>
                            {c.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-lg text-neutral-900 leading-snug mb-5 line-clamp-2">{c.title}</h3>
                        
                        <div className="mt-auto space-y-4">
                          <div>
                            <div className="flex justify-between items-baseline text-sm mb-2.5">
                              <span className="font-black text-neutral-900 text-xl tracking-tight">
                                ₹{c.raisedAmount.toLocaleString()}
                              </span>
                              <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
                                goal ₹{c.targetAmount.toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
                              <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%` }} />
                            </div>
                            <div className="text-xs font-bold text-neutral-500 mt-2">{percent}% funded</div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-5 border-t border-neutral-100">
                            <Button asChild variant="outline" size="sm" className="w-full text-xs h-10 rounded-xl border-neutral-200 hover:bg-neutral-50 font-semibold text-neutral-600">
                              <Link to={`/campaigns/${c.id}`} target="_blank">
                                <ExternalLink className="w-4 h-4 mr-1.5" /> Public Page
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              className="w-full text-xs h-10 rounded-xl shadow-xs font-bold bg-neutral-900 text-white hover:bg-neutral-800"
                              onClick={() => {
                                setSelectedCampaignForImpact(c.id);
                                setIsImpactModalOpen(true);
                              }}
                            >
                              <FileText className="w-4 h-4 mr-1.5" /> Post Update
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
  
          {/* Volunteers Tab */}
        <TabsContent value="volunteers" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Incoming Volunteer Applications</CardTitle>
                <CardDescription>Review community members who applied to join your on-ground relief operations.</CardDescription>
              </div>
              <Button
                size="sm"
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                disabled={!isVerified}
                onClick={() => setIsVolunteerModalOpen(true)}
              >
                <PlusCircle className="w-4 h-4" /> Post Volunteer Role
              </Button>
            </CardHeader>
            <CardContent>
              {appsLoading ? (
                <div className="text-center py-10 text-muted-foreground">Loading applications...</div>
              ) : !applications || applications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="font-medium text-foreground">No applications right now</p>
                  <p className="text-sm mt-1">Volunteer applications submitted by donors and citizens will arrive here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app: any) => (
                    <div
                      key={app._id}
                      className="p-4 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-base">{app.userId?.name || 'Applicant'}</div>
                          <Badge
                            variant="outline"
                            className={
                              app.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : app.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }
                          >
                            {app.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Applied for: <span className="font-medium text-foreground">{app.opportunityId?.title || 'Volunteer Event'}</span>
                        </div>
                        {app.message && (
                          <div className="text-xs text-muted-foreground italic bg-neutral-50 p-2 rounded mt-1 border">
                            "{app.message}"
                          </div>
                        )}
                      </div>

                      {app.status === 'PENDING' && (
                        <div className="flex gap-2 w-full md:w-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50"
                            onClick={() => rejectMutation.mutate(app._id)}
                            disabled={rejectMutation.isPending}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => approveMutation.mutate(app._id)}
                            disabled={approveMutation.isPending}
                          >
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Impact Reports Tab */}
        <TabsContent value="impact" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Milestones & Impact Proof</CardTitle>
                <CardDescription>Publish verified photos, purchase receipts, and stories to show donors how funds were utilized.</CardDescription>
              </div>
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                disabled={!isVerified}
                onClick={() => {
                  setSelectedCampaignForImpact(undefined);
                  setIsImpactModalOpen(true);
                }}
              >
                <PlusCircle className="w-4 h-4" /> Post Impact Update
              </Button>
            </CardHeader>
            <CardContent>
              {impactLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading impact reports...</div>
              ) : !impactReports || impactReports.length === 0 ? (
                <div className="p-8 border-2 border-dashed rounded-xl text-center">
                  <FileText className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                  <h4 className="font-semibold text-foreground">Transparent Accountability</h4>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                    Upload audited expense sheets, photos of delivered ration kits, or medical invoices to earn higher Trust scores on NobleNet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {impactReports.map((report: any) => (
                    <div key={report._id} className="p-5 border rounded-xl bg-card space-y-3 shadow-xs">
                      {report.images && report.images.length > 0 && (
                        <div className="h-40 rounded-lg overflow-hidden bg-neutral-100 mb-2">
                          <img
                            src={report.images[0]}
                            alt={report.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-base text-foreground">{report.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Published {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-neutral-600 line-clamp-3">{report.description}</p>
                      <div className="flex items-center gap-4 pt-2 border-t text-xs text-neutral-500">
                        {report.fundsUsed > 0 && (
                          <div>
                            <span className="font-semibold text-foreground">₹{report.fundsUsed.toLocaleString()}</span> utilized
                          </div>
                        )}
                        {report.beneficiariesReached > 0 && (
                          <div>
                            <span className="font-semibold text-foreground">{report.beneficiariesReached.toLocaleString()}</span> lives helped
                          </div>
                        )}
                      </div>
                      {report.milestones && report.milestones.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {report.milestones.slice(0, 2).map((m: string, idx: number) => (
                            <div key={idx} className="text-xs text-emerald-700 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="line-clamp-1">{m}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wishlist Tab */}
        <TabsContent value="wishlist" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Direct In-Kind Wishlist</CardTitle>
                <CardDescription>Request physical goods (blankets, stationery, wheelchairs) for direct donor shipment.</CardDescription>
              </div>
              <Button
                size="sm"
                className="gap-1.5 cursor-pointer"
                disabled={!isVerified}
                onClick={() => setIsWishlistModalOpen(true)}
              >
                <Package className="w-4 h-4" /> Add Required Item
              </Button>
            </CardHeader>
            <CardContent>
              {itemsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading requested items...</div>
              ) : !wishlistItems || wishlistItems.length === 0 ? (
                <div className="p-8 border-2 border-dashed rounded-xl text-center">
                  <Package className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                  <h4 className="font-semibold text-foreground">Physical Item Drive</h4>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                    Direct item donations are synced with verified delivery addresses. Donors purchase directly through our verified logistics partners.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlistItems.map((item: any) => {
                    const fulfilled = (item.fulfilledQuantity || 0) + (item.pledgedQuantity || 0);
                    const pct = Math.min(100, Math.round((fulfilled / item.requiredQuantity) * 100));
                    return (
                      <div key={item._id} className="p-4 border rounded-xl bg-card space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm leading-tight text-foreground">{item.itemName}</h4>
                          <Badge
                            variant="outline"
                            className={
                              item.priority === 'HIGH'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 text-[10px]'
                                : 'bg-neutral-100 text-neutral-700 text-[10px]'
                            }
                          >
                            {item.priority}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{item.category}</div>
                        {item.description && (
                          <p className="text-xs text-neutral-500 line-clamp-2">{item.description}</p>
                        )}
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{fulfilled} pledged/received</span>
                            <span className="font-medium text-foreground">{item.requiredQuantity} needed</span>
                          </div>
                          <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* Interactive Modals */}
      <CreateCampaignModal open={isCampaignModalOpen} onOpenChange={setIsCampaignModalOpen} />
      <CreateWishlistItemModal open={isWishlistModalOpen} onOpenChange={setIsWishlistModalOpen} ngoId={ngoId} />
      <CreateVolunteerOppModal open={isVolunteerModalOpen} onOpenChange={setIsVolunteerModalOpen} />
      <PostImpactModal
        open={isImpactModalOpen}
        onOpenChange={setIsImpactModalOpen}
        ngoId={ngoId}
        defaultCampaignId={selectedCampaignForImpact}
      />
    </div>
  );
}
