import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminService,
  PendingNgo,
  AdminUser,
  AdminCampaign,
  AdminDonation,
  AuditLog,
} from '@/services/adminService';
import { PageMeta } from '@/components/common/PageMeta';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Users,
  Target,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Lock,
  Search,
  RotateCcw,
  PauseCircle,
  PlayCircle,
  Ban,
  DollarSign,
  Building2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function AdminWorkspace() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'verifications';

  // State for Review NGO modal
  const [selectedNgo, setSelectedNgo] = useState<PendingNgo | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // State for User Status Modal
  const [selectedUserForStatus, setSelectedUserForStatus] = useState<AdminUser | null>(null);
  const [targetUserStatus, setTargetUserStatus] = useState<'ACTIVE' | 'SUSPENDED'>('SUSPENDED');

  // State for Campaign Moderation Modal
  const [selectedCampaignForMod, setSelectedCampaignForMod] = useState<AdminCampaign | null>(null);
  const [targetCampaignStatus, setTargetCampaignStatus] = useState<string>('PAUSED');
  const [moderationReason, setModerationReason] = useState('');

  // State for Refund Modal
  const [selectedDonationForRefund, setSelectedDonationForRefund] = useState<AdminDonation | null>(null);
  const [refundReason, setRefundReason] = useState('');

  // Filter States
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [campaignStatusFilter, setCampaignStatusFilter] = useState('ALL');
  const [campaignSearch, setCampaignSearch] = useState('');
  const [donationStatusFilter, setDonationStatusFilter] = useState('ALL');
  const [ngoDirectoryFilter, setNgoDirectoryFilter] = useState('ALL');
  const [ngoSearch, setNgoSearch] = useState('');

  // Data Queries
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getStats(),
  });

  const { data: pendingNgos, isLoading: ngosLoading } = useQuery({
    queryKey: ['admin-pending-ngos'],
    queryFn: () => adminService.getPendingNgos(),
  });

  const { data: usersRes, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', userRoleFilter, userStatusFilter],
    queryFn: () => adminService.getUsers(1, 50, userRoleFilter, userStatusFilter),
  });
  const users = usersRes?.data || [];

  const { data: campaignsRes, isLoading: campaignsLoading } = useQuery({
    queryKey: ['admin-campaigns', campaignStatusFilter, campaignSearch],
    queryFn: () => adminService.getCampaigns(1, 50, campaignStatusFilter, campaignSearch),
  });
  const campaigns = campaignsRes?.data || [];

  const { data: donationsRes, isLoading: donationsLoading } = useQuery({
    queryKey: ['admin-donations', donationStatusFilter],
    queryFn: () => adminService.getDonations(1, 50, donationStatusFilter),
  });
  const donations = donationsRes?.data || [];

  const { data: allNgosRes, isLoading: allNgosLoading } = useQuery({
    queryKey: ['admin-all-ngos', ngoDirectoryFilter, ngoSearch],
    queryFn: () => adminService.getAllNgos(1, 50, ngoDirectoryFilter, ngoSearch),
  });
  const allNgos = allNgosRes?.data || [];

  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => adminService.getAuditLogs(1, 50),
  });

  // Mutations
  const reviewMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: 'APPROVED' | 'REJECTED'; notes: string }) =>
      adminService.reviewNgo(id, status, notes),
    onSuccess: (_, variables) => {
      toast.success(`NGO ${variables.status === 'APPROVED' ? 'approved' : 'rejected'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-pending-ngos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-ngos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      setSelectedNgo(null);
      setReviewNotes('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update NGO status');
    },
  });

  const userStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'ACTIVE' | 'SUSPENDED' }) =>
      adminService.updateUserStatus(userId, status),
    onSuccess: (_, variables) => {
      toast.success(`User status updated to ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      setSelectedUserForStatus(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update user status');
    },
  });

  const campaignModMutation = useMutation({
    mutationFn: ({ campaignId, status, reason }: { campaignId: string; status: string; reason?: string }) =>
      adminService.moderateCampaign(campaignId, status, reason),
    onSuccess: (_, variables) => {
      toast.success(`Campaign status updated to ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      setSelectedCampaignForMod(null);
      setModerationReason('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to moderate campaign');
    },
  });

  const refundMutation = useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) =>
      adminService.refundPayment(paymentId, reason),
    onSuccess: () => {
      toast.success('Donation refunded successfully! Balance restored.');
      queryClient.invalidateQueries({ queryKey: ['admin-donations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      setSelectedDonationForRefund(null);
      setRefundReason('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Refund processing failed');
    },
  });

  const handleReview = (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedNgo) return;
    reviewMutation.mutate({
      id: selectedNgo._id,
      status,
      notes: reviewNotes,
    });
  };

  const formatCurrency = (val: number = 0) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString()}`;
  };

  const handleTabChange = (val: string) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', val);
      return p;
    });
  };

  return (
    <div className="space-y-8 pb-16">
      <PageMeta
        title="Platform Administration | NobleNet"
        description="NobleNet Super Admin governance console: KYC verification, trust & safety audit trails, and financial compliance."
      />

      {/* Header Banner */}
      <div className="bg-white border-b border-neutral-200/80 -mx-4 px-4 sm:-mx-8 sm:px-8 pt-8 pb-6 mb-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-4xl font-black text-neutral-900 tracking-tight">Platform Administration</h1>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200/60 shadow-xs px-2.5 py-0.5">
                <Lock className="w-3.5 h-3.5 mr-1.5" /> Super Admin Access
              </Badge>
            </div>
            <p className="text-neutral-500 text-sm sm:text-base max-w-2xl">
              Platform governance, KYC verification queue, user management, and immutable audit logs.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              className="gap-2 bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 rounded-xl h-11 px-5 shadow-xs font-semibold"
              onClick={() => {
                refetchStats();
                queryClient.invalidateQueries();
                toast.info('Refreshed admin operational telemetry.');
              }}
            >
              <RefreshCw className="w-4 h-4" /> Refresh Telemetry
            </Button>
            <Button asChild variant="outline" className="gap-2 bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 rounded-xl h-11 px-5 shadow-xs font-semibold">
              <Link to="/me">Back to My NobleNet</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
{/* Platform KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Registered Users</div>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Users className="w-4 h-4" /></div>
          </div>
          <div className="text-3xl font-black text-neutral-900 tracking-tight">{statsLoading ? '...' : stats?.users?.total ?? 0}</div>
          <div className="text-xs font-medium text-neutral-500 mt-1.5">Donors, volunteers & organizations</div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Verified NGOs</div>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><ShieldCheck className="w-4 h-4" /></div>
          </div>
          <div className="text-3xl font-black text-neutral-900 tracking-tight">{statsLoading ? '...' : stats?.ngos?.approved ?? 0}</div>
          <div className="text-xs font-medium text-neutral-500 mt-1.5">Active verified partners</div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Gross Donations</div>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><Target className="w-4 h-4" /></div>
          </div>
          <div className="text-3xl font-black text-neutral-900 tracking-tight">{statsLoading ? '...' : formatCurrency(stats?.donations?.totalAmount)}</div>
          <div className="text-xs font-medium text-neutral-500 mt-1.5">Confirmed platform volume</div>
        </div>
        
        <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-200/70 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending Review</div>
            <div className="p-2 bg-amber-100/80 rounded-xl text-amber-600"><Activity className="w-4 h-4" /></div>
          </div>
          <div className="text-3xl font-black text-amber-900 tracking-tight">{statsLoading ? '...' : stats?.ngos?.pending ?? 0}</div>
          <div className="text-xs font-bold text-amber-700/80 mt-1.5 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Awaiting decision</div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-8">
        <div className="flex justify-start overflow-x-auto pb-1 mb-6 border-b border-neutral-200/80 hide-scrollbar">
          <TabsList className="bg-transparent h-12 p-0 space-x-8">
            <TabsTrigger value="verifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm text-neutral-500 data-[state=active]:text-neutral-900 px-1 py-3 relative">
              Verification Queue ({pendingNgos?.length || 0})
              {(pendingNgos?.length || 0) > 0 && (
                <span className="absolute -top-1 -right-4 w-5 h-5 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {pendingNgos?.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm text-neutral-500 data-[state=active]:text-neutral-900 px-1 py-3">
              User Accounts ({users?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm text-neutral-500 data-[state=active]:text-neutral-900 px-1 py-3">
              Campaign Moderation
            </TabsTrigger>
            <TabsTrigger value="donations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm text-neutral-500 data-[state=active]:text-neutral-900 px-1 py-3">
              Financial Ledger
            </TabsTrigger>
            <TabsTrigger value="ngos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm text-neutral-500 data-[state=active]:text-neutral-900 px-1 py-3">
              NGO Directory
            </TabsTrigger>
            <TabsTrigger value="audit" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm text-neutral-500 data-[state=active]:text-neutral-900 px-1 py-3">
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="compliance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm text-neutral-500 data-[state=active]:text-neutral-900 px-1 py-3">
              Compliance Policy
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 1. Verifications Tab */}
        <TabsContent value="verifications" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>NGO Verification Queue</CardTitle>
                <CardDescription>
                  Verify legal registration, Darpan IDs, and 12A/80G tax exemptions before enabling fundraising.
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {pendingNgos?.length || 0} Pending Actions
              </Badge>
            </CardHeader>
            <CardContent>
              {ngosLoading ? (
                <div className="text-center py-10 text-muted-foreground">Loading queue...</div>
              ) : !pendingNgos || pendingNgos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="w-10 h-10 mx-auto text-emerald-600 mb-3" />
                  <p className="font-semibold text-foreground">All Submissions Reviewed</p>
                  <p className="text-sm mt-1">Zero pending NGO applications currently in queue.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingNgos.map((ngo) => (
                    <div
                      key={ngo._id}
                      className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-xl gap-4 bg-card hover:bg-neutral-50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-base">{ngo.organizationName}</div>
                        <div className="text-sm text-muted-foreground">
                          Reg #{ngo.registrationNumber} • {ngo.address}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Contact: <span className="font-medium text-foreground">{ngo.contactEmail}</span> • {ngo.contactPhone}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Pending Review
                        </Badge>
                        <Button size="sm" onClick={() => setSelectedNgo(ngo)}>
                          Review Credentials
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. User Accounts Tab */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Platform User Accounts</CardTitle>
                <CardDescription>Manage user roles, monitor access status, and enforce security policies.</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                  <SelectTrigger className="w-[130px] h-9 text-xs">
                    <SelectValue placeholder="Filter Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value="USER">User (Donor)</SelectItem>
                    <SelectItem value="NGO">NGO Partner</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                  <SelectTrigger className="w-[130px] h-9 text-xs">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-10 text-muted-foreground">Loading accounts...</div>
              ) : !users || users.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No accounts found matching filters.</div>
              ) : (
                <div className="divide-y border rounded-xl overflow-hidden">
                  {users.map((u) => (
                    <div key={u._id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card hover:bg-neutral-50/70 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{u.name}</span>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold">
                            {u.role}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]'
                                : 'bg-rose-50 text-rose-700 border-rose-200 text-[10px]'
                            }
                          >
                            {u.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {u.email} • Joined {new Date(u.createdAt).toLocaleDateString()}
                          {u.lastLoginAt && ` • Last active ${new Date(u.lastLoginAt).toLocaleDateString()}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {u.status === 'ACTIVE' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
                            onClick={() => {
                              setSelectedUserForStatus(u);
                              setTargetUserStatus('SUSPENDED');
                            }}
                          >
                            <Ban className="w-3.5 h-3.5 mr-1" /> Suspend
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => {
                              setSelectedUserForStatus(u);
                              setTargetUserStatus('ACTIVE');
                            }}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Reactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Campaign Moderation Tab */}
        <TabsContent value="campaigns" className="mt-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Campaign Moderation</CardTitle>
                <CardDescription>Pause or terminate fundraisers for compliance investigations or goal completion.</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Select value={campaignStatusFilter} onValueChange={setCampaignStatusFilter}>
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <SelectValue placeholder="Status Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Campaigns</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Paused">Paused</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <div className="text-center py-10 text-muted-foreground">Loading fundraisers...</div>
              ) : !campaigns || campaigns.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No campaigns found.</div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((c) => {
                    const percent = Math.min(100, Math.round(((c.raisedAmount || 0) / (c.targetAmount || 1)) * 100));
                    const statusUpper = (c.status || '').toUpperCase();
                    return (
                      <div key={c._id} className="p-4 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{c.title}</span>
                            <Badge variant={statusUpper === 'ACTIVE' ? 'default' : 'secondary'}>{c.status}</Badge>
                            <span className="text-xs text-muted-foreground">({c.category})</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {c.ngoId?.organizationName && <span className="font-medium text-foreground">{c.ngoId.organizationName} • </span>}
                            ₹{(c.raisedAmount || 0).toLocaleString()} raised of ₹{(c.targetAmount || 0).toLocaleString()} ({percent}%)
                          </div>
                          <div className="w-full max-w-sm bg-neutral-100 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button asChild variant="outline" size="sm" className="text-xs">
                            <Link to={`/campaigns/${c._id}`} target="_blank">
                              <ExternalLink className="w-3.5 h-3.5 mr-1" /> View
                            </Link>
                          </Button>
                          {statusUpper === 'ACTIVE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                              onClick={() => {
                                setSelectedCampaignForMod(c);
                                setTargetCampaignStatus('PAUSED');
                              }}
                            >
                              <PauseCircle className="w-3.5 h-3.5 mr-1" /> Pause
                            </Button>
                          )}
                          {statusUpper === 'PAUSED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                              onClick={() => {
                                setSelectedCampaignForMod(c);
                                setTargetCampaignStatus('ACTIVE');
                              }}
                            >
                              <PlayCircle className="w-3.5 h-3.5 mr-1" /> Resume
                            </Button>
                          )}
                          {statusUpper !== 'CANCELLED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                              onClick={() => {
                                setSelectedCampaignForMod(c);
                                setTargetCampaignStatus('CANCELLED');
                              }}
                            >
                              <Ban className="w-3.5 h-3.5 mr-1" /> Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Financial & Donations Ledger Tab */}
        <TabsContent value="donations" className="mt-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Financial Donations Ledger</CardTitle>
                <CardDescription>Audited transaction log with real payment provider IDs and refund execution.</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Select value={donationStatusFilter} onValueChange={setDonationStatusFilter}>
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <SelectValue placeholder="Status Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {donationsLoading ? (
                <div className="text-center py-10 text-muted-foreground">Loading financial records...</div>
              ) : !donations || donations.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No transactions found matching criteria.</div>
              ) : (
                <div className="divide-y border rounded-xl overflow-hidden">
                  {donations.map((d) => (
                    <div key={d._id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card hover:bg-neutral-50/70 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-foreground">₹{d.amount.toLocaleString()}</span>
                          <Badge
                            variant="outline"
                            className={
                              d.status === 'CONFIRMED' || d.status === 'SUCCESS'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]'
                                : d.status === 'REFUNDED'
                                ? 'bg-purple-50 text-purple-700 border-purple-200 text-[10px]'
                                : 'bg-amber-50 text-amber-700 border-amber-200 text-[10px]'
                            }
                          >
                            {d.status}
                          </Badge>
                          {d.paymentId?.provider && (
                            <span className="text-[10px] text-muted-foreground uppercase bg-neutral-100 px-1.5 py-0.5 rounded">
                              {d.paymentId.provider}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Donor: <span className="font-medium text-foreground">{d.donorName || d.userId?.name || 'Anonymous Donor'}</span>
                          {d.campaignId?.title && ` • For: ${d.campaignId.title}`}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {new Date(d.createdAt).toLocaleString()} {d.paymentId?.providerPaymentId && `• Txn: ${d.paymentId.providerPaymentId}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {(d.status === 'CONFIRMED' || d.status === 'SUCCESS') && d.paymentId?._id && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                            onClick={() => setSelectedDonationForRefund(d)}
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refund
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. NGO Directory Tab */}
        <TabsContent value="ngos" className="mt-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>NGO Partner Directory</CardTitle>
                <CardDescription>Comprehensive registry of verified, pending, and suspended non-profit organizations.</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Select value={ngoDirectoryFilter} onValueChange={setNgoDirectoryFilter}>
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <SelectValue placeholder="Status Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All NGOs</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {allNgosLoading ? (
                <div className="text-center py-10 text-muted-foreground">Loading NGO registry...</div>
              ) : !allNgos || allNgos.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No NGOs found.</div>
              ) : (
                <div className="space-y-3">
                  {allNgos.map((ngo) => (
                    <div key={ngo._id} className="p-4 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{ngo.organizationName}</span>
                          <Badge
                            variant="outline"
                            className={
                              ngo.status === 'VERIFIED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]'
                                : ngo.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 text-[10px]'
                                : 'bg-rose-50 text-rose-700 border-rose-200 text-[10px]'
                            }
                          >
                            {ngo.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Reg #{ngo.registrationNumber} • {ngo.contactEmail} • {ngo.contactPhone}
                        </div>
                        <p className="text-xs text-neutral-600 line-clamp-1">{ngo.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {ngo.status === 'PENDING' && (
                          <Button size="sm" onClick={() => setSelectedNgo(ngo)} className="text-xs">
                            Review Credentials
                          </Button>
                        )}
                        {ngo.status === 'VERIFIED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
                            onClick={() => {
                              reviewMutation.mutate({
                                id: ngo._id,
                                status: 'REJECTED',
                                notes: 'Suspended by Super Admin for administrative review',
                              });
                            }}
                          >
                            Suspend Access
                          </Button>
                        )}
                        {ngo.status === 'REJECTED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => {
                              reviewMutation.mutate({
                                id: ngo._id,
                                status: 'APPROVED',
                                notes: 'Reinstated by Super Admin',
                              });
                            }}
                          >
                            Reinstate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. Audit Logs Tab */}
        <TabsContent value="audit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Immutable Audit Trail
              </CardTitle>
              <CardDescription>
                Cryptographic security log documenting verification events, role elevation, and donation transfers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-10 text-muted-foreground">Loading audit records...</div>
              ) : !auditLogs || auditLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No audit records logged yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {auditLogs.map((log: any) => (
                    <div key={log._id} className="p-3 bg-neutral-50 rounded-lg border text-xs flex justify-between items-center">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-primary">{log.action}</div>
                        <div className="text-muted-foreground">
                          Resource: {log.resource} {log.resourceId && `(${log.resourceId})`}
                        </div>
                      </div>
                      <div className="text-right text-muted-foreground text-[11px]">
                        <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                        <div>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 7. Compliance Tab */}
        <TabsContent value="compliance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Statutory & Tax Exemption Compliance</CardTitle>
              <CardDescription>Automated 80G receipt issuance and FCRA foreign-contribution validation policy.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="p-4 bg-neutral-50 rounded-lg border space-y-2">
                <div className="font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Section 80G Tax Exemption Certificates
                </div>
                <p>
                  Every Indian domestic donation generated through NobleNet triggers an automated Form 10BE compliant receipt containing the donor's PAN and NGO 80G registration credentials.
                </p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg border space-y-2">
                <div className="font-semibold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Deterministic Payment Verification
                </div>
                <p>
                  Webhook transactions are signed with SHA256 HMAC and verified against idempotency locks in Redis before ledger commits.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      </div>
      {/* NGO Review Modal */}
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
                <label className="text-xs font-semibold block mb-1">Verification Notes / Justification</label>
                <Textarea
                  placeholder="e.g., Verified Darpan registration and valid 80G certification..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                className="border-rose-200 text-rose-600 hover:bg-rose-50"
                onClick={() => handleReview('REJECTED')}
                disabled={reviewMutation.isPending}
              >
                <XCircle className="w-4 h-4 mr-1" /> Reject
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleReview('APPROVED')}
                disabled={reviewMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-1" /> Approve Partner
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* User Status Modal */}
      {selectedUserForStatus && (
        <Dialog open={Boolean(selectedUserForStatus)} onOpenChange={(open) => !open && setSelectedUserForStatus(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {targetUserStatus === 'SUSPENDED' ? 'Suspend User Account' : 'Reactivate User Account'}
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to {targetUserStatus === 'SUSPENDED' ? 'suspend' : 'reactivate'}{' '}
                <span className="font-semibold text-foreground">{selectedUserForStatus.name}</span> ({selectedUserForStatus.email})?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setSelectedUserForStatus(null)}>
                Cancel
              </Button>
              <Button
                className={targetUserStatus === 'SUSPENDED' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
                onClick={() =>
                  userStatusMutation.mutate({
                    userId: selectedUserForStatus._id,
                    status: targetUserStatus,
                  })
                }
                disabled={userStatusMutation.isPending}
              >
                Confirm {targetUserStatus === 'SUSPENDED' ? 'Suspension' : 'Reactivation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Campaign Moderation Modal */}
      {selectedCampaignForMod && (
        <Dialog open={Boolean(selectedCampaignForMod)} onOpenChange={(open) => !open && setSelectedCampaignForMod(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Moderate Campaign: {selectedCampaignForMod.title}</DialogTitle>
              <DialogDescription>
                Set new status to <span className="font-semibold text-foreground">{targetCampaignStatus}</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <label className="text-xs font-semibold block">Moderation Justification</label>
              <Textarea
                placeholder="Reason for pausing, resuming, or cancelling this campaign..."
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setSelectedCampaignForMod(null)}>
                Cancel
              </Button>
              <Button
                className="bg-primary text-primary-foreground"
                onClick={() =>
                  campaignModMutation.mutate({
                    campaignId: selectedCampaignForMod._id,
                    status: targetCampaignStatus,
                    reason: moderationReason,
                  })
                }
                disabled={campaignModMutation.isPending}
              >
                Apply Moderation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Refund Confirmation Modal */}
      {selectedDonationForRefund && (
        <Dialog open={Boolean(selectedDonationForRefund)} onOpenChange={(open) => !open && setSelectedDonationForRefund(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Issue Donor Refund</DialogTitle>
              <DialogDescription>
                Process a full refund of <span className="font-bold text-foreground">₹{selectedDonationForRefund.amount.toLocaleString()}</span> to the original payment instrument.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <label className="text-xs font-semibold block">Reason for Refund *</label>
              <Input
                placeholder="e.g. Donor requested cancellation, Campaign target exceeded"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setSelectedDonationForRefund(null)}>
                Cancel
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => {
                  if (!selectedDonationForRefund.paymentId?._id) {
                    toast.error('No payment record found to refund');
                    return;
                  }
                  refundMutation.mutate({
                    paymentId: selectedDonationForRefund.paymentId._id,
                    reason: refundReason || 'Admin issued refund',
                  });
                }}
                disabled={refundMutation.isPending}
              >
                {refundMutation.isPending ? 'Processing Refund...' : 'Confirm Refund'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
