import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/store/authStore"
import { volunteerService } from "@/services/volunteerService"
import { campaignService } from "@/services/campaignService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Target, Users, Package, Megaphone, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export function NGODashboard() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignService.getCampaigns(),
  })

  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ['ngo-volunteer-apps'],
    queryFn: () => volunteerService.getNgoApplications(),
  })

  const approveMutation = useMutation({
    mutationFn: (appId: string) => volunteerService.approveApplication(appId),
    onSuccess: () => {
      toast.success("Volunteer application approved!");
      queryClient.invalidateQueries({ queryKey: ['ngo-volunteer-apps'] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to approve application");
    }
  })

  const rejectMutation = useMutation({
    mutationFn: (appId: string) => volunteerService.rejectApplication(appId),
    onSuccess: () => {
      toast.success("Volunteer application rejected");
      queryClient.invalidateQueries({ queryKey: ['ngo-volunteer-apps'] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reject application");
    }
  })

  const totalFundsRaised = (campaigns || []).reduce((acc, c) => acc + (c.raisedAmount || 0), 0)

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{user?.name || 'NGO'} Dashboard</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-primary" /> Verified Organization Account
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2"><PlusCircle className="w-4 h-4" /> Create Campaign</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Funds Raised</CardTitle>
            <Target className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalFundsRaised.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Campaigns</CardTitle>
            <Megaphone className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(campaigns || []).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Items Pledged</CardTitle>
            <Package className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">93</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Volunteer Applications</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(applications || []).length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="mt-8">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="volunteers">Volunteer Applications</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist Items</TabsTrigger>
        </TabsList>
        
        <TabsContent value="campaigns" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Manage Campaigns</CardTitle>
              <Button variant="outline" size="sm">Create New</Button>
            </CardHeader>
            <CardContent>
              {!campaigns || campaigns.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No campaigns created yet.</div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((c) => (
                    <div key={c.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg hover:bg-neutral-50 transition-colors gap-4">
                      <div className="flex-1">
                        <div className="font-bold">{c.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          ₹{c.raisedAmount.toLocaleString()} raised of ₹{c.targetAmount.toLocaleString()} ({Math.min(100, Math.round((c.raisedAmount / c.targetAmount) * 100))}%)
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={c.status === 'Active' ? 'default' : 'secondary'}>{c.status}</Badge>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volunteers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Incoming Volunteer Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {appsLoading ? (
                <div className="text-center py-6 text-muted-foreground">Loading applications...</div>
              ) : !applications || applications.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No pending volunteer applications.</div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app: any) => (
                    <div key={app._id} className="p-4 border rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="font-bold text-base">{app.userId?.name || 'Applicant'}</div>
                        <div className="text-sm text-muted-foreground">Applied for: {app.opportunityId?.title || 'Volunteer Activity'}</div>
                        {app.message && <div className="text-sm text-muted-foreground mt-1 italic">"{app.message}"</div>}
                        <div className="text-xs text-muted-foreground mt-1">Status: <span className="font-semibold">{app.status}</span></div>
                      </div>
                      {app.status === 'PENDING' && (
                        <div className="flex gap-2 w-full md:w-auto">
                          <Button 
                            variant="outline" 
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => rejectMutation.mutate(app._id)}
                            disabled={rejectMutation.isPending}
                          >
                            Reject
                          </Button>
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700"
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
        
        <TabsContent value="wishlist" className="mt-6">
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Wishlist physical items are active and managed via the Wishlist center.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
