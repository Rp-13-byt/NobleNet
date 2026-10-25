import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Package, AlertCircle, Sparkles, Building2 } from "lucide-react"
import { wishlistService } from "@/services/wishlistService"
import { ngoService } from "@/services/ngoService"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"
import { AuthModal } from "@/features/auth/AuthModal"

export function Wishlist() {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const [pledgeModalOpen, setPledgeModalOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)

  const { data: allItems, isLoading } = useQuery({
    queryKey: ['all-wishlist'],
    queryFn: () => wishlistService.getAllWishlistItems(),
  })

  const { data: ngos } = useQuery({
    queryKey: ['ngos'],
    queryFn: () => ngoService.getNgos(),
  })

  const pledgeMutation = useMutation({
    mutationFn: () => wishlistService.pledgeItem(selectedItem.id, quantity),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message)
        queryClient.invalidateQueries({ queryKey: ['all-wishlist'] })
        setPledgeModalOpen(false)
      } else {
        toast.error(data.message)
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to pledge item");
    }
  })

  const handlePledgeClick = (item: any) => {
    if (!isAuthenticated) {
      toast.info("Please log in before pledging items for donation.");
      setAuthModalOpen(true);
      return;
    }
    setSelectedItem(item)
    setQuantity(1)
    setPledgeModalOpen(true)
  }

  const handleConfirmPledge = () => {
    if (quantity < 1) return toast.error("Quantity must be at least 1")
    pledgeMutation.mutate()
  }

  return (
    <div className="pb-20 bg-neutral-50/40 min-h-screen">
      {/* Header Banner */}
      <section className="bg-white border-b border-neutral-200/80 pt-12 pb-14">
        <div className="container mx-auto px-4 max-w-5xl text-center space-y-3">
          <Badge variant="secondary" className="bg-amber-100 text-amber-900 border-0 text-xs font-semibold px-3 py-1">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Tangible Impact
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 tracking-tight">
            Give what they need.
          </h1>
          <p className="text-neutral-500 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Sometimes NGOs need resources more than money. Browse verified wishlists and pledge to donate physical items (books, rations, medical kits) directly to the cause.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-7xl pt-10">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-neutral-500 text-sm">Loading verified wishlist items...</p>
          </div>
        ) : !allItems || allItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200 shadow-xs max-w-3xl mx-auto">
            <p className="text-neutral-500">No active wishlist items found at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allItems.map(item => {
              const ngo = ngos?.find(n => n.id === item.ngoId || (n.raw && (n.raw._id === item.ngoId || n.raw.id === item.ngoId)))
              const remaining = Math.max(0, item.requiredQuantity - item.pledgedQuantity)
              const percent = Math.min(100, Math.round((item.pledgedQuantity / item.requiredQuantity) * 100))
              const isHighPriority = item.priority === 'High'
              
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col hover:-translate-y-0.5 overflow-hidden">
                  <div className="p-5 flex gap-4 border-b border-neutral-100">
                    <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-neutral-100 border border-neutral-200/60 relative">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {isHighPriority && (
                        <div className="absolute top-0 left-0 w-full bg-red-600/90 backdrop-blur-xs text-[10px] font-bold text-white text-center py-0.5">
                          URGENT
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="font-bold text-lg leading-tight text-neutral-900 mb-1.5 truncate group-hover:text-amber-700 transition-colors">{item.name}</h3>
                      <div className="text-xs text-neutral-500 flex items-center gap-1.5 truncate">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{ngo?.name || 'Verified NGO Partner'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1 bg-neutral-50/30">
                    <div className="space-y-4 mt-auto">
                      <div>
                        <div className="flex justify-between items-baseline text-sm mb-2">
                          <span className="font-bold text-neutral-900">
                            {item.pledgedQuantity} <span className="text-xs font-normal text-neutral-500">pledged</span>
                          </span>
                          <span className="text-xs text-neutral-500 font-medium">
                            goal {item.requiredQuantity}
                          </span>
                        </div>
                        <Progress value={percent} className="h-2 bg-neutral-200" />
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-medium text-neutral-600 bg-white px-2 py-1 rounded-md border border-neutral-200 shadow-xs">
                          {remaining} left needed
                        </span>
                        <Button 
                          size="sm"
                          className={`font-semibold text-xs px-4 h-9 rounded-lg shadow-xs ${remaining === 0 ? 'bg-neutral-200 text-neutral-500' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
                          onClick={() => handlePledgeClick(item)}
                          disabled={remaining === 0}
                        >
                          {remaining === 0 ? "Goal Met" : "Pledge Item"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {selectedItem && (
          <Dialog open={pledgeModalOpen} onOpenChange={setPledgeModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Pledge {selectedItem.name}</DialogTitle>
                <DialogDescription className="text-neutral-500">
                  You are committing to physically donate or deliver this item to the NGO's registered center.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-2 space-y-5">
                <div className="flex gap-4 bg-amber-50/50 border border-amber-100 p-4 rounded-xl">
                  <div className="flex-1 text-center border-r border-amber-200/50">
                    <div className="text-xs font-semibold text-amber-700 mb-1 uppercase tracking-wider">Required</div>
                    <div className="font-black text-2xl text-neutral-900">{selectedItem.requiredQuantity}</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-xs font-semibold text-amber-700 mb-1 uppercase tracking-wider">Remaining</div>
                    <div className="font-black text-2xl text-amber-600">{Math.max(0, selectedItem.requiredQuantity - selectedItem.pledgedQuantity)}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-neutral-700">Quantity you want to pledge</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    max={selectedItem.requiredQuantity - selectedItem.pledgedQuantity} 
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="h-12 text-lg font-medium text-center rounded-xl"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200/60 p-3.5 rounded-xl flex gap-3 items-start text-sm text-amber-900">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                  <p className="leading-relaxed text-xs">By confirming, you agree to coordinate with the NGO to fulfill this pledge within 7 days. Your contact details will be shared securely with the verified organizer.</p>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t mt-4">
                <Button variant="outline" className="rounded-xl h-11" onClick={() => setPledgeModalOpen(false)}>Cancel</Button>
                <Button 
                  className="rounded-xl h-11 px-8 font-bold bg-amber-600 hover:bg-amber-700 shadow-xs"
                  onClick={handleConfirmPledge} 
                  disabled={pledgeMutation.isPending}
                >
                  {pledgeMutation.isPending ? "Confirming..." : "Confirm Pledge"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </div>
    </div>
  )
}
