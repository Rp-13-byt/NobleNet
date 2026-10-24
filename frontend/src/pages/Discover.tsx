import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Search, SlidersHorizontal, ArrowUpDown, X, Sparkles, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CampaignCard } from "@/components/common/CampaignCard"
import { campaignService, Campaign } from "@/services/campaignService"
import { ngoService } from "@/services/ngoService"

const categories = [
  { id: "all", label: "All Causes" },
  { id: "education", label: "Education" },
  { id: "healthcare", label: "Healthcare" },
  { id: "hunger relief", label: "Hunger Relief" },
  { id: "environment", label: "Environment" },
  { id: "disaster relief", label: "Disaster Relief" },
  { id: "animal welfare", label: "Animal Welfare" },
  { id: "women & children", label: "Women & Children" },
]

export function Discover() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || "")
  const [category, setCategory] = useState(searchParams.get('category')?.toLowerCase() || "all")
  const [sort, setSort] = useState(searchParams.get('sort') || "recommended")

  useEffect(() => {
    const q = searchParams.get('search')
    const cat = searchParams.get('category')?.toLowerCase()
    const s = searchParams.get('sort')
    if (q !== null) setSearch(q)
    if (cat) setCategory(cat)
    if (s !== null) setSort(s)
  }, [searchParams])

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (!value || value === 'all' || (key === 'sort' && value === 'recommended')) {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    setSearchParams(next)
  }

  const handleCategoryChange = (val: string) => {
    setCategory(val)
    updateParam('category', val)
  }

  const handleSearchChange = (val: string) => {
    setSearch(val)
    updateParam('search', val.trim() ? val : null)
  }

  const handleSortChange = (val: string) => {
    setSort(val)
    updateParam('sort', val)
  }

  const handleClearFilters = () => {
    setSearch("")
    setCategory("all")
    setSort("recommended")
    setSearchParams(new URLSearchParams())
  }

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', category, search],
    queryFn: () => campaignService.getCampaigns(category === 'all' ? undefined : category, search || undefined)
  })

  const { data: ngos } = useQuery({
    queryKey: ['ngos'],
    queryFn: () => ngoService.getNgos()
  })

  const getNgoName = (ngoId: string) => {
    const ngo = ngos?.find(n => n.id === ngoId || (n.raw && (n.raw._id === ngoId || n.raw.id === ngoId)))
    return ngo?.name || 'Verified NGO'
  }

  // Sorted and filtered list
  const processedCampaigns = useMemo(() => {
    if (!campaigns) return []
    const list = [...campaigns]

    switch (sort) {
      case 'urgent':
        return list.sort((a, b) => a.daysRemaining - b.daysRemaining)
      case 'newest':
        return list.sort((a, b) => (b.raw?.createdAt || '').localeCompare(a.raw?.createdAt || ''))
      case 'most_supported':
        return list.sort((a, b) => (b.supportersCount || b.raisedAmount) - (a.supportersCount || a.raisedAmount))
      case 'closest_to_goal':
        return list.sort((a, b) => {
          const pctA = a.raisedAmount / a.targetAmount
          const pctB = b.raisedAmount / b.targetAmount
          return pctB - pctA
        })
      case 'recommended':
      default:
        return list
    }
  }, [campaigns, sort])

  const hasActiveFilters = category !== 'all' || search.trim() !== '' || sort !== 'recommended'

  return (
    <div className="pb-20 bg-neutral-50/40 min-h-screen">
      {/* Header Banner */}
      <section className="bg-white border-b border-neutral-200/80 pt-12 pb-14">
        <div className="container mx-auto px-4 max-w-5xl text-center space-y-3">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-900 border-0 text-xs font-semibold px-3 py-1">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Transparent Giving
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 tracking-tight">
            Explore Verified Causes
          </h1>
          <p className="text-neutral-500 text-sm sm:text-base max-w-xl mx-auto">
            Discover active campaigns organized by verified NGOs across India. Direct aid, zero hidden cuts, and instant 80G tax receipts.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-7xl pt-8 space-y-6">
        {/* Search, Filter & Sort Controls */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 h-4 w-4" />
              <Input 
                placeholder="Search causes, campaigns, or keywords..." 
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-9 h-11 text-sm bg-neutral-50/70 border-neutral-200 rounded-xl focus-visible:ring-primary"
              />
              {search && (
                <button 
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 hidden sm:flex">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
              </div>
              <Select value={sort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full sm:w-[190px] h-11 rounded-xl text-xs font-medium border-neutral-200">
                  <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="recommended" className="text-xs">Recommended</SelectItem>
                  <SelectItem value="urgent" className="text-xs">Most Urgent</SelectItem>
                  <SelectItem value="newest" className="text-xs">Newly Added</SelectItem>
                  <SelectItem value="most_supported" className="text-xs">Most Supported</SelectItem>
                  <SelectItem value="closest_to_goal" className="text-xs">Closest to Goal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
            {categories.map((c) => {
              const active = category === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => handleCategoryChange(c.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-primary text-white shadow-xs"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80"
                  }`}
                >
                  {c.label}
                </button>
              )
            })}
          </div>

          {/* Active Filter Indicators */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs text-neutral-500">
              <div className="flex items-center gap-2">
                <span>Active filters:</span>
                {category !== 'all' && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {category}
                  </Badge>
                )}
                {search && (
                  <Badge variant="outline" className="text-xs">
                    "{search}"
                  </Badge>
                )}
                {sort !== 'recommended' && (
                  <Badge variant="outline" className="text-xs">
                    {sort.replace('_', ' ')}
                  </Badge>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearFilters}
                className="text-xs h-7 text-neutral-500 hover:text-neutral-900 cursor-pointer"
              >
                Reset All
              </Button>
            </div>
          )}
        </div>

        {/* Results Header Count */}
        <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
          <span>
            {isLoading ? "Searching campaigns..." : `Showing ${processedCampaigns.length} verified ${processedCampaigns.length === 1 ? 'cause' : 'causes'}`}
          </span>
        </div>

        {/* Campaign Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-2xl border border-neutral-200 h-[440px] bg-white animate-pulse" />
            ))}
          </div>
        ) : processedCampaigns.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-neutral-200/80 shadow-xs max-w-md mx-auto px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">No campaigns found</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              We couldn't find any campaigns matching your current filter criteria.
            </p>
            <Button 
              variant="outline" 
              className="mt-2 rounded-xl text-xs h-9 cursor-pointer" 
              onClick={handleClearFilters}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {processedCampaigns.map(campaign => (
              <CampaignCard 
                key={campaign.id} 
                {...campaign} 
                ngoName={getNgoName(campaign.ngoId)} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
