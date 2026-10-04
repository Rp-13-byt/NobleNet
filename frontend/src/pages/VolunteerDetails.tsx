import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Clock, MapPin, ShieldCheck, CheckCircle2 } from "lucide-react"
import { volunteerService } from "@/services/volunteerService"
import { ngoService } from "@/services/ngoService"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"
import { AuthModal } from "@/features/auth/AuthModal"

export function VolunteerDetails() {
  const { id } = useParams()
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState("")
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const { data: opp, isLoading } = useQuery({
    queryKey: ['volunteer-opp', id],
    queryFn: () => volunteerService.getOpportunityById(id as string),
    enabled: !!id
  })

  const { data: ngo } = useQuery({
    queryKey: ['ngo', opp?.ngoId],
    queryFn: () => ngoService.getNgoById(opp!.ngoId),
    enabled: !!opp?.ngoId
  })

  const applyMutation = useMutation({
    mutationFn: () => volunteerService.applyToVolunteer(id as string, message),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message)
        queryClient.invalidateQueries({ queryKey: ['volunteer-opp', id] })
        setMessage("")
      } else {
        toast.error(data.message)
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit application");
    }
  })

  if (isLoading) return <div className="p-8 text-center">Loading details...</div>
  if (!opp) return <div className="p-8 text-center">Opportunity not found</div>

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link to="/volunteers" className="text-sm text-primary font-medium hover:underline mb-6 block">
        &larr; Back to opportunities
      </Link>

      <div className="bg-white rounded-xl border p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-8">
          
          <div className="flex-1 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Link to={`/ngo/${ngo?.id}`} className="text-muted-foreground hover:text-primary font-medium flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full overflow-hidden border">
                    <img src={ngo?.logoUrl} alt="" className="w-full h-full object-cover"/>
                  </div>
                  {ngo?.name || 'Verified NGO'}
                </Link>
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-4">{opp.title}</h1>
              
              <div className="flex flex-wrap gap-4 text-sm font-medium bg-neutral-50 p-4 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  {opp.date} • {opp.time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {opp.location}
                </div>
              </div>
            </div>

            <section>
              <h3 className="text-xl font-bold mb-3">About this opportunity</h3>
              <p className="text-neutral-700 leading-relaxed">{opp.description}</p>
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">Responsibilities</h3>
              <ul className="space-y-2">
                {opp.responsibilities.map((r, i) => (
                  <li key={i} className="flex gap-2 text-neutral-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" /> {r}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">Requirements</h3>
              <ul className="list-disc pl-5 space-y-1 text-neutral-700">
                {opp.requirements.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {opp.requiredSkills.map(skill => (
                  <Badge key={skill} variant="secondary" className="px-3 py-1">{skill}</Badge>
                ))}
              </div>
            </section>
          </div>

          {/* Application Form Widget */}
          <div className="w-full md:w-80 shrink-0">
            <div className="bg-neutral-50 rounded-xl border p-6 sticky top-24">
              <h3 className="font-bold text-lg mb-2">Apply to Volunteer</h3>
              <div className="text-sm text-muted-foreground mb-6">
                {opp.seatsAvailable > 0 ? (
                  <span className="text-green-600 font-medium">{opp.seatsAvailable} seats available</span>
                ) : (
                  <span className="text-red-600 font-medium">Fully booked</span>
                )}
              </div>

              {!isAuthenticated ? (
                <div className="text-center">
                  <p className="text-sm mb-4">Please log in to apply for this opportunity.</p>
                  <Button className="w-full" variant="outline" onClick={() => setAuthModalOpen(true)}>
                    Log In / Sign Up
                  </Button>
                </div>
              ) : opp.seatsAvailable <= 0 ? (
                <Button className="w-full" disabled>No seats left</Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Message to NGO (Optional)</label>
                    <Textarea 
                      placeholder="Why do you want to volunteer? Mention any relevant experience."
                      className="min-h-[120px] resize-none"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => applyMutation.mutate()}
                    disabled={applyMutation.isPending}
                  >
                    {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    By applying, you commit to attending if approved.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  )
}
