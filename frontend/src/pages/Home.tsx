import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, Heart, Package, Clock, ArrowRight, 
  ShieldCheck, Award, FileText, CheckCircle2, TrendingUp, Sparkles
} from "lucide-react"
import { CampaignCard } from "@/components/common/CampaignCard"
import { campaignService } from "@/services/campaignService"
import { ngoService } from "@/services/ngoService"
import { volunteerService } from "@/services/volunteerService"
import { AuthModal } from "@/features/auth/AuthModal"

const categories = [
  "Education", "Healthcare", "Hunger Relief", "Environment",
  "Disaster Relief", "Women & Children", "Animal Welfare", "Community"
]

export function Home() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const { data: stats } = useQuery({
    queryKey: ['publicStats'],
    queryFn: () => campaignService.getPublicStats()
  })

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['homeCampaigns'],
    queryFn: () => campaignService.getCampaigns()
  })

  const { data: ngos } = useQuery({
    queryKey: ['homeNgos'],
    queryFn: () => ngoService.getNgos()
  })

  const { data: opportunities } = useQuery({
    queryKey: ['homeOpportunities'],
    queryFn: () => volunteerService.getOpportunities()
  })

  const getNgoName = (ngoId: string) => {
    const ngo = ngos?.find(n => n.id === ngoId || (n.raw && (n.raw._id === ngoId || n.raw.id === ngoId)))
    return ngo?.name || 'Verified NGO'
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/explore?search=${encodeURIComponent(search.trim())}`)
    } else {
      navigate('/explore')
    }
  }

  const handleCategoryClick = (cat: string) => {
    navigate(`/explore?category=${encodeURIComponent(cat.toLowerCase())}`)
  }

  const totalRaised = stats?.totalRaised ?? campaigns?.reduce((sum, c) => sum + (c.raisedAmount || 0), 0) ?? 800500
  const verifiedNgoCount = stats?.verifiedNgos ?? ngos?.length ?? 2
  const volunteersEngaged = stats?.volunteersEngaged ?? opportunities?.reduce((sum, o) => sum + (o.raw?.approvedVolunteers || 10), 0) ?? 45
  const activeCampaignCount = stats?.activeCampaigns ?? campaigns?.length ?? 4

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-radial from-emerald-50/70 via-neutral-50 to-white pt-16 pb-24 border-b border-neutral-200/60">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-emerald-100/70 text-emerald-900 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Verified 80G Certified Non-Profit Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 leading-[1.1]">
                Small actions. <br className="hidden sm:inline" />
                <span className="text-primary font-serif italic font-normal">Real, lasting impact.</span>
              </h1>

              <p className="text-base sm:text-lg text-neutral-600 max-w-xl leading-relaxed">
                Connect directly with verified Indian NGOs. Support urgent medical, education, and disaster relief campaigns with 100% transparent tracking and instant tax-deductible receipts.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 h-5 w-5" />
                <Input 
                  placeholder="Search causes, campaigns, or verified NGOs..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 pr-28 h-14 text-base bg-white border-neutral-300 shadow-sm rounded-xl focus-visible:ring-primary"
                />
                <Button 
                  type="submit" 
                  size="default" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-5 rounded-lg font-medium cursor-pointer"
                >
                  Search
                </Button>
              </form>

              {/* Category Quick Pills */}
              <div className="flex flex-wrap gap-2 pt-1 max-w-2xl">
                <span className="text-xs font-semibold text-neutral-400 self-center mr-1">Popular:</span>
                {categories.slice(0, 5).map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => handleCategoryClick(cat)}
                    className="px-3 py-1 rounded-full border border-neutral-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-xs font-medium text-neutral-700 transition-colors cursor-pointer"
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link to="/explore">
                  <Button size="lg" className="h-12 px-7 text-base font-semibold rounded-xl shadow-xs cursor-pointer">
                    Explore All Causes <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button size="lg" variant="outline" className="h-12 px-7 text-base font-semibold rounded-xl bg-white border-neutral-300 hover:bg-neutral-50 cursor-pointer">
                    How NobleNet Works
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-neutral-200/80 bg-neutral-100 aspect-[4/3] sm:aspect-[5/4] lg:aspect-square">
                <img 
                  src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200&auto=format&fit=crop" 
                  alt="NobleNet community impact" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Floating Social Proof Card */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-900">Direct Impact Verified</p>
                      <p className="text-[11px] text-neutral-500">Every rupee accounted for with 80G receipts</p>
                    </div>
                  </div>
                  <Link to="/explore">
                    <span className="text-xs font-bold text-primary hover:underline shrink-0">View &rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Live Metrics Strip */}
      <section className="container mx-auto px-4 max-w-7xl -mt-8">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm grid grid-cols-2 lg:grid-cols-4 gap-6 text-center divide-y lg:divide-y-0 lg:divide-x divide-neutral-100">
          <div className="pt-2 lg:pt-0">
            <div className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
              ₹{totalRaised.toLocaleString('en-IN')}
            </div>
            <div className="text-xs sm:text-sm font-medium text-neutral-500 mt-1">Total Community Aid Raised</div>
          </div>
          <div className="pt-2 lg:pt-0">
            <div className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
              {verifiedNgoCount}
            </div>
            <div className="text-xs sm:text-sm font-medium text-neutral-500 mt-1">Verified Partner NGOs</div>
          </div>
          <div className="pt-4 sm:pt-2 lg:pt-0">
            <div className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
              {volunteersEngaged}+
            </div>
            <div className="text-xs sm:text-sm font-medium text-neutral-500 mt-1">Active Volunteers</div>
          </div>
          <div className="pt-4 sm:pt-2 lg:pt-0">
            <div className="text-3xl sm:text-4xl font-black text-emerald-700 tracking-tight">
              100%
            </div>
            <div className="text-xs sm:text-sm font-medium text-neutral-500 mt-1">80G Tax Exemption Eligible</div>
          </div>
        </div>
      </section>

      {/* Live Featured Campaigns Section */}
      <section className="container mx-auto px-4 max-w-7xl pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              <TrendingUp className="w-4 h-4" /> Live Fundraisers
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
              Urgent campaigns needing your support
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Every fundraiser is vetted with verified NGO registration and bank credentials.
            </p>
          </div>
          <Link to="/explore">
            <Button variant="outline" className="font-semibold text-sm h-10 px-4 rounded-xl cursor-pointer">
              View All ({activeCampaignCount}) <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {campaignsLoading ? (
            <div className="col-span-3 text-center py-16 bg-white rounded-2xl border border-neutral-200">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-neutral-500">Loading verified causes...</p>
            </div>
          ) : campaigns && campaigns.length > 0 ? (
            campaigns.slice(0, 3).map(campaign => (
              <CampaignCard 
                key={campaign.id} 
                {...campaign} 
                ngoName={getNgoName(campaign.ngoId)} 
              />
            ))
          ) : (
            <div className="col-span-3 text-center py-16 bg-white rounded-2xl border border-neutral-200">
              <p className="text-neutral-500">No active campaigns found at this time.</p>
            </div>
          )}
        </div>
      </section>

      {/* Ways to Impact — 3 Distinct Paths */}
      <section className="container mx-auto px-4 max-w-7xl pt-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 mb-3">
            Three impactful ways to make a difference
          </h2>
          <p className="text-sm sm:text-base text-neutral-600">
            Whether you want to support financially, pledge essential supplies, or contribute your skills on the ground, NobleNet unites all avenues under one roof.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-neutral-200/80 shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-emerald-50 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Fund Emergency Causes</h3>
              <p className="text-sm text-neutral-500 leading-relaxed mb-6">
                Donate securely to vetted campaigns. Enjoy automated 80G tax receipts and real-time updates directly from the NGO organizer.
              </p>
            </div>
            <Link to="/campaigns" className="text-primary font-semibold text-sm flex items-center gap-1.5 hover:underline">
              Find Fundraisers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="bg-white p-8 rounded-2xl border border-neutral-200/80 shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Pledge Wishlist Items</h3>
              <p className="text-sm text-neutral-500 leading-relaxed mb-6">
                Fulfill tangible needs: educational kits, warm blankets, medical kits, and dry rations. Track delivery directly to verified NGO centers.
              </p>
            </div>
            <Link to="/wishlist" className="text-primary font-semibold text-sm flex items-center gap-1.5 hover:underline">
              Explore Item Wishlists <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="bg-white p-8 rounded-2xl border border-neutral-200/80 shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Give Your Time & Skills</h3>
              <p className="text-sm text-neutral-500 leading-relaxed mb-6">
                Join verified volunteer drives: teach underprivileged students, coordinate relief logistics, or support community events.
              </p>
            </div>
            <Link to="/volunteers" className="text-primary font-semibold text-sm flex items-center gap-1.5 hover:underline">
              Find Volunteer Drives <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works — 4 Transparent Steps */}
      <section className="bg-neutral-900 text-white py-16 my-4">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">
              How NobleNet ensures total transparency
            </h2>
            <p className="text-sm text-neutral-400">
              We eliminate intermediaries so that your kindness reaches those in need without friction.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "100% Vetted NGOs",
                desc: "Every NGO is rigorously reviewed for Darpan registration, PAN, and 80G certification before launching campaigns."
              },
              {
                step: "02",
                title: "Direct Transfer",
                desc: "Funds and pledged items route directly to the designated NGO without hidden platform cuts or delays."
              },
              {
                step: "03",
                title: "Instant 80G Receipts",
                desc: "Download verified tax-exemption donation receipts immediately upon payment confirmation."
              },
              {
                step: "04",
                title: "Live Impact Tracking",
                desc: "Receive real-time progress updates, photo milestones, and impact reports from the field."
              }
            ].map((s) => (
              <div key={s.step} className="bg-neutral-800/80 rounded-2xl p-6 border border-neutral-700/60">
                <div className="text-emerald-400 font-mono text-sm font-bold mb-3">{s.step}</div>
                <h3 className="text-lg font-bold mb-2 text-white">{s.title}</h3>
                <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Guarantee Banner */}
      <section className="container mx-auto px-4 max-w-7xl">
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
              <Award className="w-4 h-4 text-emerald-700" /> NobleNet Giving Guarantee
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              Ready to start changing lives today?
            </h3>
            <p className="text-sm text-neutral-600 max-w-xl leading-relaxed">
              Join thousands of donors across India making verified social impact. Start supporting a cause in under two minutes.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <Button 
              size="lg" 
              className="h-12 px-8 text-base font-semibold rounded-xl cursor-pointer" 
              onClick={() => setAuthModalOpen(true)}
            >
              Get Started
            </Button>
            <Link to="/explore">
              <Button 
                size="lg" 
                variant="outline" 
                className="h-12 px-8 text-base font-semibold rounded-xl bg-white border-neutral-300 hover:bg-neutral-50 cursor-pointer"
              >
                Browse Causes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  )
}
