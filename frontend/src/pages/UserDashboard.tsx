import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/store/authStore"
import { donationService } from "@/services/donationService"
import { volunteerService } from "@/services/volunteerService"
import { wishlistService } from "@/services/wishlistService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Package, Clock, ShieldCheck, Trophy, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export function UserDashboard() {
  const { user } = useAuthStore()

  const { data: donations, isLoading: donationsLoading } = useQuery({
    queryKey: ['my-donations'],
    queryFn: () => donationService.getMyDonations(),
  })

  const { data: volunteerApps } = useQuery({
    queryKey: ['my-volunteer-apps'],
    queryFn: () => volunteerService.getMyApplications(),
  })

  const { data: itemDonations } = useQuery({
    queryKey: ['my-item-donations'],
    queryFn: () => wishlistService.getMyItemDonations(),
  })

  const totalDonated = (donations || []).reduce((acc, curr) => acc + (curr.amount || 0), 0)
  const totalItemsPledged = (itemDonations || []).length
  const totalVolunteeringCount = (volunteerApps || []).length

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}</h1>
        <p className="text-muted-foreground">Track your contributions and see your verified impact.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Donated</CardTitle>
            <Heart className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalDonated.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Items Pledged</CardTitle>
            <Package className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItemsPledged}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Volunteer Activities</CardTitle>
            <Clock className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVolunteeringCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Campaigns Supported</CardTitle>
            <ShieldCheck className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(donations || []).length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Donations</CardTitle>
            </CardHeader>
            <CardContent>
              {donationsLoading ? (
                <div className="text-center py-6 text-muted-foreground">Loading history...</div>
              ) : !donations || donations.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No donations yet. Explore campaigns to make your first contribution!
                </div>
              ) : (
                <div className="space-y-4">
                  {donations.map((d) => (
                    <div key={d._id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg hover:bg-neutral-50 transition-colors gap-4">
                      <div>
                        <div className="font-bold">{d.campaignId?.title || 'NobleNet Campaign'}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(d.createdAt).toLocaleDateString()} • Ref: {d.transactionReference?.slice(0, 12)}...
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full md:w-auto justify-between">
                        <div className="font-bold text-lg">₹{d.amount.toLocaleString()}</div>
                        <Badge className="bg-green-100 text-green-800">{d.paymentStatus}</Badge>
                        <Button variant="ghost" size="icon"><Download className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Volunteer Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {!volunteerApps || volunteerApps.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No volunteer applications yet. Find open opportunities in the Volunteer section!
                </div>
              ) : (
                <div className="space-y-4">
                  {volunteerApps.map((app: any) => (
                    <div key={app._id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg gap-4">
                      <div>
                        <div className="font-bold">{app.opportunityId?.title || 'Volunteer Activity'}</div>
                        <div className="text-sm text-muted-foreground">
                          Applied on {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="outline" className={app.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                        {app.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Trophy className="w-5 h-5" /> Your Impact Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white px-3 py-1.5 border-primary/30 text-primary font-medium">First Donation</Badge>
                <Badge variant="outline" className="bg-white px-3 py-1.5 border-primary/30 text-primary font-medium">Verified Citizen</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Impact Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Thank you for contributing to verified social impact projects. Every pledge and donation directly reaches the community.
              </p>
              <div className="bg-neutral-50 p-4 rounded-lg border">
                <div className="text-sm font-semibold mb-2">Verified Receipts</div>
                <div className="text-xs text-muted-foreground">
                  All monetary donations qualify for 80G tax exemption certificates issued through NobleNet.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
