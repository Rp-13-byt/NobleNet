import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Clock, MapPin, Search, ShieldCheck, HeartHandshake, ArrowRight } from "lucide-react"
import { volunteerService } from "@/services/volunteerService"
import { ngoService } from "@/services/ngoService"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function Volunteer() {
  const [search, setSearch] = useState("")

  const { data: opps, isLoading } = useQuery({
    queryKey: ['volunteer-opps'],
    queryFn: () => volunteerService.getOpportunities()
  })

  const { data: ngos } = useQuery({
    queryKey: ['ngos'],
    queryFn: () => ngoService.getNgos()
  })

  const filteredOpps = opps?.filter(o => 
    o.title.toLowerCase().includes(search.toLowerCase()) || 
    o.location.toLowerCase().includes(search.toLowerCase())
  )

  const getNgo = (ngoId: string) => {
    return ngos?.find(n => n.id === ngoId || (n.raw && (n.raw._id === ngoId || n.raw.id === ngoId)))
  }

  return (
    <div className="pb-20 bg-neutral-50/40 min-h-screen">
      {/* Header Banner */}
      <section className="bg-white border-b border-neutral-200/80 pt-12 pb-14">
        <div className="container mx-auto px-4 max-w-5xl text-center space-y-3">
          <Badge variant="secondary" className="bg-blue-100 text-blue-900 border-0 text-xs font-semibold px-3 py-1">
            <HeartHandshake className="w-3.5 h-3.5 mr-1" /> Active Volunteer Drives
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 tracking-tight">
            Give your time. Make a difference.
          </h1>
          <p className="text-neutral-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Connect with verified NGOs and volunteer your skills to create real, lasting impact in your community.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-7xl pt-8 space-y-8">
        {/* Search */}
        <div className="max-w-3xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 h-5 w-5" />
          <Input 
            placeholder="Search by activity, skill, or location..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-14 text-base bg-white border-neutral-200 shadow-sm rounded-xl focus-visible:ring-blue-600 transition-shadow"
          />
        </div>

        {/* Opportunities Grid */}
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-neutral-500 text-sm">Loading volunteer opportunities...</p>
          </div>
        ) : !filteredOpps || filteredOpps.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200 shadow-xs max-w-3xl mx-auto">
            <p className="text-neutral-500">No opportunities matching your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpps.map(opp => {
              const ngo = getNgo(opp.ngoId)
              
              return (
                <div key={opp.id} className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col hover:-translate-y-0.5">
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4 gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-xs font-semibold text-neutral-500 truncate">{ngo?.name || 'Verified NGO'}</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 leading-tight line-clamp-2 group-hover:text-blue-700 transition-colors">{opp.title}</h3>
                      </div>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-800 border border-blue-100 shrink-0 text-xs">
                        {opp.seatsAvailable} seats
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-neutral-600">
                        <Clock className="w-4 h-4 text-neutral-400" /> {opp.date}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-neutral-600">
                        <MapPin className="w-4 h-4 text-neutral-400" /> <span className="truncate">{opp.location}</span>
                      </div>
                    </div>

                    <p className="text-sm text-neutral-500 line-clamp-3 mb-5 leading-relaxed">
                      {opp.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {opp.requiredSkills.map(skill => (
                        <Badge key={skill} variant="outline" className="font-medium text-[11px] border-neutral-200 text-neutral-600 bg-neutral-50">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    <Link to={`/volunteer/${opp.id}`} className="mt-auto pt-4 border-t border-neutral-100">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold gap-1.5 shadow-xs">
                        View Details <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
