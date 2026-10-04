import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle2, Users, MapPin } from "lucide-react"

export interface CampaignCardProps {
  id: string
  title: string
  description: string
  ngoName: string
  imageUrl: string
  category: string
  targetAmount: number
  raisedAmount: number
  daysRemaining: number
  isVerified: boolean
  supportersCount?: number
  location?: string
}

export function CampaignCard({
  id,
  title,
  description,
  ngoName,
  imageUrl,
  category,
  targetAmount,
  raisedAmount,
  daysRemaining,
  isVerified,
  supportersCount,
  location
}: CampaignCardProps) {
  const percentage = Math.min(Math.round((raisedAmount / targetAmount) * 100), 100)
  const supporters = supportersCount ?? Math.max(1, Math.floor(raisedAmount / 1500))

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-neutral-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <Badge variant="secondary" className="bg-white/95 text-neutral-800 text-xs font-semibold backdrop-blur-md shadow-xs border-0">
            {category}
          </Badge>
          {location && (
            <Badge variant="secondary" className="hidden sm:inline-flex bg-black/60 text-white text-[11px] font-medium backdrop-blur-md border-0 items-center gap-1">
              <MapPin className="w-3 h-3" /> {location}
            </Badge>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-xs">
            {percentage}%
          </span>
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="text-xs font-medium text-neutral-600 truncate">{ngoName}</span>
          {isVerified && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-help">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Verified 80G Registered NGO</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        <Link to={`/campaigns/${id}`} className="block group-hover:text-primary transition-colors">
          <h3 className="text-base sm:text-lg font-bold line-clamp-2 mb-2 leading-snug tracking-tight text-neutral-900">
            {title}
          </h3>
        </Link>
        <p className="text-sm text-neutral-500 line-clamp-2 mb-5 leading-relaxed">
          {description}
        </p>
        
        <div className="mt-auto space-y-4 pt-2 border-t border-neutral-100">
          <div>
            <div className="flex justify-between items-baseline text-sm mb-2">
              <span className="font-bold text-neutral-900">
                ₹{raisedAmount.toLocaleString('en-IN')}{" "}
                <span className="text-xs font-normal text-neutral-500">raised</span>
              </span>
              <span className="text-xs text-neutral-500 font-medium">
                goal ₹{targetAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <Progress value={percentage} className="h-2 bg-neutral-100" />
          </div>
          
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              <span className="flex items-center gap-1 font-medium">
                <Users className="w-3.5 h-3.5 text-neutral-400" />
                {supporters}
              </span>
              <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md font-medium">
                {daysRemaining > 0 ? `${daysRemaining}d left` : 'Completed'}
              </span>
            </div>
            <Link to={`/campaigns/${id}`}>
              <Button size="sm" className="font-medium text-xs px-3.5 h-8 cursor-pointer rounded-lg">
                Donate Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
