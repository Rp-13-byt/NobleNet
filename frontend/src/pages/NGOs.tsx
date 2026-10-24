import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NGOCard } from "@/components/common/NGOCard"
import { ngoService } from "@/services/ngoService"

export function NGOs() {
  const [search, setSearch] = useState("")

  const { data: ngos, isLoading } = useQuery({
    queryKey: ['ngos'],
    queryFn: () => ngoService.getNgos()
  })

  const filteredNgos = ngos?.filter(n => 
    n.name.toLowerCase().includes(search.toLowerCase()) || 
    n.categories.some(c => c.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center text-center mb-12 pt-8">
        <ShieldCheck className="w-12 h-12 text-primary mb-4" />
        <h1 className="text-4xl font-bold mb-4">Verified NGOs you can trust</h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          We rigorously verify every organization on NobleNet. Review their impact reports, registration details, and user reviews before you contribute.
        </p>
      </div>

      <div className="max-w-2xl mx-auto relative mb-12">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input 
          placeholder="Search by NGO name or cause (e.g., Education, Health)..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 h-14 text-base rounded-xl shadow-sm border"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-xl border h-[380px] bg-neutral-100 animate-pulse"></div>
          ))}
        </div>
      ) : filteredNgos?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border">
          <h3 className="text-xl font-bold mb-2">No NGOs found</h3>
          <p className="text-muted-foreground">No organizations match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNgos?.map(ngo => (
            <NGOCard key={ngo.id} ngo={ngo} />
          ))}
        </div>
      )}
    </div>
  )
}
