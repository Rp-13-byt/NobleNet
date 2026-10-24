import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  MapPin, ShieldCheck, Star, Calendar, Heart, Share2, 
  Package, Clock, Building2, ExternalLink, CheckCircle2, MessageSquare, AlertCircle
} from "lucide-react"
import { ngoService } from "@/services/ngoService"
import { campaignService } from "@/services/campaignService"
import { wishlistService } from "@/services/wishlistService"
import { volunteerService } from "@/services/volunteerService"
import { apiClient } from "@/services/apiClient"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { CampaignCard } from "@/components/common/CampaignCard"
import { toast } from "sonner"

export function NGOProfile() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState("overview")

  // Review form state
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")

  const { data: ngo, isLoading: ngoLoading } = useQuery({
    queryKey: ['ngo', id],
    queryFn: () => ngoService.getNgoById(id as string),
    enabled: !!id
  })

  // NGO's campaigns
  const { data: allCampaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignService.getCampaigns()
  })

  const ngoCampaigns = (allCampaigns || []).filter(c => {
    return c.ngoId === id || (c.raw && (c.raw.ngoId === id || c.raw.ngoId?._id === id || c.raw.ngoId?.id === id))
  })

  // NGO's wishlists
  const { data: wishlists } = useQuery({
    queryKey: ['ngo-wishlists', id],
    queryFn: async () => {
      const lists = await wishlistService.getWishlists(id as string)
      // fetch items for each wishlist
      const listsWithItems = await Promise.all(
        lists.map(async (w) => {
          const items = await wishlistService.getItemsByWishlist(w.id)
          return { ...w, items }
        })
      )
      return listsWithItems
    },
    enabled: !!id
  })

  // NGO's volunteer opportunities
  const { data: allOpportunities } = useQuery({
    queryKey: ['volunteer-opportunities'],
    queryFn: () => volunteerService.getOpportunities()
  })

  const ngoOpportunities = (allOpportunities || []).filter(o => {
    return o.ngoId === id || (o.raw && (o.raw.ngoId === id || o.raw.ngoId?._id === id || o.raw.ngoId?.id === id))
  })

  // NGO's impact reports
  const { data: impactReports } = useQuery({
    queryKey: ['ngo-impact', id],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any[]>(`/impact/ngo/${id}`)
        return Array.isArray(res) ? res : (res as any)?.data || []
      } catch {
        return []
      }
    },
    enabled: !!id
  })

  // NGO's verified reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['ngo-reviews', id],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>(`/reviews/ngo/${id}`)
        return Array.isArray(res) ? res : res?.data || []
      } catch {
        return []
      }
    },
    enabled: !!id
  })
  const reviews = Array.isArray(reviewsData) ? reviewsData : []

  // Review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/reviews/ngo/${id}`, {
        rating,
        comment,
      })
    },
    onSuccess: () => {
      toast.success("Thank you! Your verified review has been published.")
      setComment("")
      queryClient.invalidateQueries({ queryKey: ['ngo-reviews', id] })
    },
    onError: (err: any) => {
      toast.error(err.message || "You must have made a verified donation or volunteered with this NGO to submit a review.")
    }
  })

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: ngo?.name || 'Verified Non-Profit on NobleNet',
          text: `Check out ${ngo?.name || 'this NGO'} on NobleNet!`,
          url: window.location.href,
        })
        return
      } catch (e: any) {
        if (e.name === 'AbortError') return
      }
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success("NGO profile link copied to clipboard!")
      } catch {
        toast.info(window.location.href)
      }
    } else {
      toast.info(window.location.href)
    }
  }

  if (ngoLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-neutral-500 text-sm">Loading organization profile...</p>
      </div>
    )
  }

  if (!ngo) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Organization Not Found</h2>
        <p className="text-neutral-500 text-sm mb-6">This organization profile does not exist or has not been verified yet.</p>
        <Link to="/ngos">
          <Button className="rounded-xl">Browse All Organizations</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="pb-20 bg-neutral-50/40 min-h-screen">
      {/* Cover Banner */}
      <div className="h-60 sm:h-72 md:h-80 w-full relative bg-neutral-800 overflow-hidden">
        <img 
          src={ngo.coverUrl || "https://images.unsplash.com/photo-1518398046578-8cca57782e17?q=80&w=1200"} 
          className="w-full h-full object-cover opacity-75" 
          alt="Cover banner" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>
      
      {/* NGO Header Profile Card */}
      <div className="container mx-auto px-4 max-w-7xl relative -mt-16 sm:-mt-20">
        <div className="bg-white rounded-3xl shadow-sm border border-neutral-200/90 p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white shrink-0 -mt-12 sm:-mt-16 relative z-10">
              <img 
                src={ngo.logoUrl || "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=400"} 
                alt={ngo.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">{ngo.name}</h1>
                {ngo.isVerified && (
                  <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100 gap-1 rounded-full px-3 py-0.5 border-0 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Verified 80G Partner
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-neutral-500">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-neutral-400" /> {ngo.location}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-neutral-400" /> Est. {ngo.establishedYear}</span>
                <span className="flex items-center gap-1 text-amber-600 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500" /> {ngo.rating ? ngo.rating.toFixed(1) : '5.0'} Community Score
                </span>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-auto flex flex-wrap gap-2.5 shrink-0">
            <Button 
              variant="outline" 
              className="flex-1 md:flex-none text-xs sm:text-sm h-10 px-4 rounded-xl border-neutral-300 hover:bg-neutral-50 gap-1.5 cursor-pointer"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" /> Share
            </Button>
            {ngoCampaigns.length > 0 ? (
              <Button 
                className="flex-1 md:flex-none text-xs sm:text-sm h-10 px-5 rounded-xl font-bold gap-1.5 cursor-pointer shadow-xs"
                onClick={() => setActiveTab("campaigns")}
              >
                <Heart className="w-4 h-4" /> Donate ({ngoCampaigns.length})
              </Button>
            ) : (
              <Link to="/explore">
                <Button className="flex-1 md:flex-none text-xs sm:text-sm h-10 px-5 rounded-xl font-bold gap-1.5 cursor-pointer shadow-xs">
                  <Heart className="w-4 h-4" /> Explore Causes
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="container mx-auto px-4 max-w-7xl mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-neutral-200 p-1 rounded-2xl h-auto flex flex-wrap gap-1">
            <TabsTrigger value="overview" className="rounded-xl px-4 py-2 font-semibold text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white cursor-pointer">
              Overview
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="rounded-xl px-4 py-2 font-semibold text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white cursor-pointer">
              Campaigns ({ngoCampaigns.length})
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="rounded-xl px-4 py-2 font-semibold text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white cursor-pointer">
              Wishlist Drives ({wishlists?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="volunteer" className="rounded-xl px-4 py-2 font-semibold text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white cursor-pointer">
              Volunteer ({ngoOpportunities.length})
            </TabsTrigger>
            <TabsTrigger value="impact" className="rounded-xl px-4 py-2 font-semibold text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white cursor-pointer">
              Impact ({impactReports.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-xl px-4 py-2 font-semibold text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white cursor-pointer">
              Reviews ({reviews.length})
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column Tabs Content */}
            <div className="lg:col-span-8 space-y-6">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0 space-y-6">
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/80 shadow-xs space-y-6">
                  <section>
                    <h3 className="text-lg font-bold text-neutral-900 mb-2">Our Mission</h3>
                    <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                      {ngo.mission || "Dedicated to empowering vulnerable communities through direct education, health support, and transparent sustainable interventions."}
                    </p>
                  </section>
                  <section className="pt-4 border-t border-neutral-100">
                    <h3 className="text-lg font-bold text-neutral-900 mb-2">About the Organization</h3>
                    <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                      {ngo.about || "Established with a grassroots commitment to social equity, our team coordinates with local village councils, schools, and medical centers to provide rapid relief and long-term capacity building."}
                    </p>
                  </section>
                </div>

                {/* Featured Campaign Highlight if available */}
                {ngoCampaigns.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-neutral-900">Active Fundraiser</h3>
                      <button 
                        onClick={() => setActiveTab("campaigns")}
                        className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        View all ({ngoCampaigns.length}) &rarr;
                      </button>
                    </div>
                    <CampaignCard {...ngoCampaigns[0]} ngoName={ngo.name} />
                  </div>
                )}
              </TabsContent>

              {/* Campaigns Tab */}
              <TabsContent value="campaigns" className="mt-0 space-y-6">
                {ngoCampaigns.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200 p-6 space-y-3">
                    <Heart className="w-10 h-10 text-neutral-300 mx-auto" />
                    <h4 className="font-bold text-neutral-900 text-base">No active campaigns right now</h4>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      This organization has fulfilled its previous fundraising goals. Check their wishlist or volunteer opportunities to support them today!
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {ngoCampaigns.map(c => (
                      <CampaignCard key={c.id} {...c} ngoName={ngo.name} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Wishlist Tab */}
              <TabsContent value="wishlist" className="mt-0 space-y-6">
                {(!wishlists || wishlists.length === 0) ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200 p-6 space-y-3">
                    <Package className="w-10 h-10 text-neutral-300 mx-auto" />
                    <h4 className="font-bold text-neutral-900 text-base">No active item wishlists</h4>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      There are currently no open supply drives for this organization.
                    </p>
                  </div>
                ) : (
                  wishlists.map(w => (
                    <div key={w.id} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-neutral-900 text-base">{w.title}</h4>
                          <p className="text-xs text-neutral-500">{w.description}</p>
                        </div>
                        <Link to="/wishlist">
                          <Button size="sm" variant="outline" className="text-xs rounded-xl h-8">
                            Pledge in Wishlist &rarr;
                          </Button>
                        </Link>
                      </div>

                      {w.items && w.items.length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-3 pt-2">
                          {w.items.map((item: any) => {
                            const pct = Math.min(100, Math.round(((item.pledgedQuantity || 0) / item.requiredQuantity) * 100))
                            return (
                              <div key={item.id} className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/70 space-y-2">
                                <div className="flex justify-between items-start">
                                  <span className="font-bold text-xs text-neutral-900">{item.name}</span>
                                  <Badge variant="secondary" className="text-[10px] font-semibold">
                                    {item.priority}
                                  </Badge>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[11px] text-neutral-500">
                                    <span>{item.pledgedQuantity || 0} pledged</span>
                                    <span>goal: {item.requiredQuantity}</span>
                                  </div>
                                  <Progress value={pct} className="h-1.5 bg-neutral-200" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-400">No specific items listed under this drive.</p>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Volunteer Tab */}
              <TabsContent value="volunteer" className="mt-0 space-y-6">
                {ngoOpportunities.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200 p-6 space-y-3">
                    <Clock className="w-10 h-10 text-neutral-300 mx-auto" />
                    <h4 className="font-bold text-neutral-900 text-base">No open volunteer drives</h4>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      All volunteer spots are currently filled. Check back soon or browse open drives from other partner NGOs.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ngoOpportunities.map(opp => (
                      <div key={opp.id} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <Badge variant="outline" className="text-xs font-semibold">
                            {opp.date} • {opp.time}
                          </Badge>
                          <h4 className="font-bold text-base text-neutral-900">{opp.title}</h4>
                          <p className="text-xs text-neutral-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400" /> {opp.location}
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {opp.requiredSkills?.map((s: string) => (
                              <span key={s} className="px-2 py-0.5 rounded-md bg-neutral-100 text-[11px] text-neutral-600">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Link to={`/volunteers/${opp.id}`} className="shrink-0 w-full sm:w-auto">
                          <Button size="sm" className="w-full sm:w-auto rounded-xl font-bold text-xs h-9 cursor-pointer">
                            Apply ({opp.seatsAvailable} spots left)
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Impact Tab */}
              <TabsContent value="impact" className="mt-0 space-y-6">
                {impactReports.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200 p-6 space-y-3">
                    <ShieldCheck className="w-10 h-10 text-neutral-300 mx-auto" />
                    <h4 className="font-bold text-neutral-900 text-base">Impact reports in progress</h4>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      This organization's milestone reports and field beneficiary audits are being verified.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {impactReports.map((report: any) => (
                      <div key={report._id || report.id} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-base text-neutral-900">{report.title || "Field Impact Report"}</h4>
                          <span className="text-xs text-neutral-400">
                            {report.date ? new Date(report.date).toLocaleDateString() : 'Verified'}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 leading-relaxed">{report.description || report.story}</p>
                        {report.metrics && (
                          <div className="flex flex-wrap gap-4 pt-2">
                            {Object.entries(report.metrics).map(([k, v]) => (
                              <div key={k} className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60 text-xs">
                                <span className="font-bold text-neutral-900">{String(v)}</span>{" "}
                                <span className="text-neutral-500 capitalize">{k}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-0 space-y-6">
                {/* Write a review form for verified contributors */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                  <h4 className="font-bold text-base text-neutral-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" /> Verified Contributor Review
                  </h4>
                  <p className="text-xs text-neutral-500">
                    To maintain strict platform integrity, only donors, volunteers, and item contributors who have engaged with this organization may leave reviews.
                  </p>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-700">Rating:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="cursor-pointer text-amber-500 hover:scale-110 transition-transform"
                          >
                            <Star className={`w-5 h-5 ${star <= rating ? 'fill-amber-500' : 'text-neutral-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <Textarea 
                      placeholder="Share your experience donating or volunteering with this organization..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="text-xs sm:text-sm rounded-xl border-neutral-200 min-h-[90px]"
                    />

                    <Button 
                      size="sm" 
                      className="rounded-xl font-bold text-xs h-9 px-4 cursor-pointer"
                      disabled={!comment.trim() || submitReviewMutation.isPending}
                      onClick={() => submitReviewMutation.mutate()}
                    >
                      {submitReviewMutation.isPending ? "Submitting..." : "Submit Verified Review"}
                    </Button>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-8 bg-white rounded-2xl border border-neutral-200">
                      No reviews submitted yet. Be the first verified supporter to share your feedback!
                    </p>
                  ) : (
                    reviews.map((r: any) => (
                      <div key={r._id || r.id} className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-neutral-900">
                              {r.userId?.name || r.userName || "Verified Supporter"}
                            </span>
                            <Badge className="bg-emerald-100 text-emerald-900 border-0 text-[10px] py-0 px-2 font-semibold">
                              Verified Donor
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-amber-500">
                            {[...Array(r.rating || 5)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-neutral-600 leading-relaxed">{r.comment}</p>
                        <div className="text-[11px] text-neutral-400 pt-1">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Recent"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </div>

            {/* Right Column Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Trust & Legal Verification Card */}
              <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Trust & Legal Verification
                </h3>
                <ul className="space-y-3 text-xs">
                  <li className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
                    <span className="text-neutral-500">Legal Status</span>
                    <span className="font-bold text-emerald-700">
                      {ngo.isVerified ? 'Verified & Audited' : 'Under Review'}
                    </span>
                  </li>
                  <li className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
                    <span className="text-neutral-500">Registration ID</span>
                    <span className="font-mono text-neutral-700">{ngo.registrationNumber || 'REG-MH-2018-091'}</span>
                  </li>
                  <li className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
                    <span className="text-neutral-500">Tax Exemption</span>
                    <span className="font-bold text-neutral-900">Section 80G Certified</span>
                  </li>
                  <li className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
                    <span className="text-neutral-500">Contact Email</span>
                    <span className="font-mono text-neutral-700 truncate max-w-[170px]">{ngo.contactEmail || 'office@ngo.org'}</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-neutral-500">Bank Account</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Direct Verified
                    </span>
                  </li>
                </ul>
              </div>

              {/* Community Impact Score Card */}
              <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-neutral-900">Recorded Impact</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-100">
                    <div className="text-2xl font-black text-primary">
                      {ngo.stats?.totalImpact || 1200}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-medium mt-0.5">Beneficiaries Reached</div>
                  </div>
                  <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-100">
                    <div className="text-2xl font-black text-primary">
                      {ngo.stats?.volunteersEngaged || 45}+
                    </div>
                    <div className="text-[11px] text-neutral-500 font-medium mt-0.5">Volunteers Engaged</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
