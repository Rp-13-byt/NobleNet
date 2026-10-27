import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminService, PendingNgo } from "@/services/adminService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ShieldCheck, Users, Target, Activity, CheckCircle, XCircle, Clock } from "lucide-react"
import { toast } from "sonner"

export function AdminDashboard() {
  const queryClient = useQueryClient()
  const [selectedNgo, setSelectedNgo] = useState<PendingNgo | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getStats(),
  })

  const { data: pendingNgos, isLoading: ngosLoading } = useQuery({
    queryKey: ['admin-pending-ngos'],
    queryFn: () => adminService.getPendingNgos(),
  })

  const { data: auditLogs } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => adminService.getAuditLogs(),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: 'APPROVED' | 'REJECTED'; notes: string }) =>
      adminService.reviewNgo(id, status, notes),
    onSuccess: (_, variables) => {
      toast.success(`NGO ${variables.status === 'APPROVED' ? 'approved' : 'rejected'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-pending-ngos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      setSelectedNgo(null);
      setReviewNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update NGO status");
    }
  })

  const handleReview = (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedNgo) return
    reviewMutation.mutate({
      id: selectedNgo._id,
      status,
      notes: reviewNotes,
    })
  }

  const formatCurrency = (val: number = 0) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
    return `₹${val.toLocaleString()}`
  }

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-3xl font-bold mb-2">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Live platform overview, verification center, and audit trails.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats?.users?.total ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified NGOs</CardTitle>
            <ShieldCheck className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats?.ngos?.approved ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Donations</CardTitle>
            <Target className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : formatCurrency(stats?.donations?.totalAmount)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Pending Verification</CardTitle>
            <Activity className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              {statsLoading ? "..." : stats?.ngos?.pending ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>NGO Verification Queue</CardTitle>
              <Badge variant="outline">
                {pendingNgos?.length || 0} Awaiting Action
              </Badge>
            </CardHeader>
            <CardContent>
              {ngosLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading queue...</div>
              ) : !pendingNgos || pendingNgos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  All NGO submissions are verified! No pending reviews.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingNgos.map((ngo) => (
                    <div key={ngo._id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg gap-4 bg-white">
                      <div>
                        <div className="font-bold text-base">{ngo.organizationName}</div>
                        <div className="text-sm text-muted-foreground">
                          {ngo.registrationNumber} • {ngo.address}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Contact: {ngo.contactEmail} • {ngo.contactPhone}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Pending Review
                        </Badge>
                        <Button size="sm" onClick={() => setSelectedNgo(ngo)}>
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Live Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!auditLogs || auditLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No audit logs yet.</p>
              ) : (
                auditLogs.slice(0, 6).map((log) => (
                  <div key={log._id} className="p-3 bg-neutral-50 rounded-lg border text-xs space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-primary">{log.action}</span>
                      <span className="text-muted-foreground text-[10px]">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-neutral-700">Resource: {log.resource}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
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
                onClick={() => handleReview('REJECTED')}
                disabled={reviewMutation.isPending}
              >
                <XCircle className="w-4 h-4 mr-1" /> Reject
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleReview('APPROVED')}
                disabled={reviewMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-1" /> Approve NGO
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
