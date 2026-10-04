import { Link } from "react-router-dom"
import { NGO } from "@/services/ngoService"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Star, CheckCircle2, ShieldCheck } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function NGOCard({ ngo }: { ngo: NGO }) {
  return (
    <div className="flex flex-col bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all group">
      <div className="h-24 bg-muted relative">
        <img src={ngo.coverUrl} className="w-full h-full object-cover opacity-80" alt="Cover" />
        <div className="absolute -bottom-10 left-4">
          <div className="w-20 h-20 rounded-full border-4 border-white bg-white overflow-hidden shadow-sm">
            <img src={ngo.logoUrl} alt={ngo.name} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
      
      <div className="pt-12 p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-1.5">
              {ngo.name}
              {ngo.isVerified && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Verified NGO</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </h3>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              {ngo.location}
            </div>
          </div>
          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded text-sm font-medium">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            {ngo.rating.toFixed(1)}
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 my-3">
          {ngo.mission}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {ngo.categories.map(c => (
            <Badge key={c} variant="secondary" className="font-normal">{c}</Badge>
          ))}
        </div>

        {/* Trust Info Snippet */}
        <div className="bg-primary/5 rounded-lg p-3 flex items-start gap-2 mb-4 mt-auto">
          <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="text-xs text-neutral-600">
            <span className="font-semibold text-primary block mb-0.5">Verified Trust</span>
            Registration & documents verified. {ngo.stats.totalImpact} impacted so far.
          </div>
        </div>

        <Link to={`/ngo/${ngo.id}`} className="mt-auto block">
          <Button variant="outline" className="w-full">View Profile</Button>
        </Link>
      </div>
    </div>
  )
}
