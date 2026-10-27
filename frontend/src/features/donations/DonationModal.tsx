import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ShieldCheck, ArrowRight, CreditCard, CheckCircle2, Download } from "lucide-react"
import { Campaign } from "@/services/campaignService"
import { donationService } from "@/services/donationService"
import { useAuthStore } from "@/store/authStore"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"

interface DonationModalProps {
  campaign: Campaign
  isOpen: boolean
  onClose: () => void
}

type Step = 'amount' | 'payment' | 'success'

const PRESET_AMOUNTS = [100, 500, 1000, 2500]

export function DonationModal({ campaign, isOpen, onClose }: DonationModalProps) {
  const [step, setStep] = useState<Step>('amount')
  const [amount, setAmount] = useState<number>(500)
  const [customAmount, setCustomAmount] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState("upi")
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()

  const calculateImpact = (amt: number) => {
    if (campaign.category === 'Education') {
      const kits = Math.floor(amt / 250)
      return kits > 0 ? `Your ₹${amt} can help provide ${kits} school kits.` : ''
    }
    if (campaign.category === 'Healthcare') {
      const checkups = Math.floor(amt / 100)
      return checkups > 0 ? `Your ₹${amt} can fund ${checkups} medical checkups.` : ''
    }
    return `Your ₹${amt} makes a meaningful difference.`
  }

  const donateMutation = useMutation({
    mutationFn: async (amt: number) => {
      if (!isAuthenticated) {
        throw new Error("Please log in to complete your donation.");
      }
      // The browser only initiates checkout. The API owns the order and determines final status.
      const order = await donationService.initiate(campaign.id, amt);
      // Demo provider only. Razorpay Checkout must provide its real payment ID/signature in production.
      return await donationService.verify(order.orderId || order.donationId, `mock_payment_${Date.now()}`, 'mock_sig_success');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaign.id] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      setStep('success')
    },
    onError: (err: any) => {
      toast.error(err.message || "Payment failed. Please try again.");
    }
  })

  const handleContinue = () => {
    if (step === 'amount') {
      if (!isAuthenticated) {
        toast.error("Please log in or select a demo role to donate");
        return;
      }
      setStep('payment')
    } else if (step === 'payment') {
      donateMutation.mutate(amount)
    }
  }

  const handleAmountSelect = (val: number) => {
    setAmount(val)
    setCustomAmount("")
  }

  const renderAmountStep = () => (
    <div className="space-y-6">
      <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-primary">You're making a secure donation</h4>
          <p className="text-sm text-neutral-600">Your contribution goes directly to the verified NGO account.</p>
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold mb-3 block">Choose Donation Amount</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {PRESET_AMOUNTS.map(preset => (
            <Button 
              key={preset}
              variant={amount === preset ? 'default' : 'outline'}
              className="h-14 text-lg font-bold"
              onClick={() => handleAmountSelect(preset)}
            >
              ₹{preset}
            </Button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">₹</span>
          <Input 
            type="number" 
            placeholder="Custom Amount"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value)
              setAmount(Number(e.target.value))
            }}
            className="pl-8 h-14 text-lg font-bold"
          />
        </div>
      </div>

      {amount > 0 && (
        <div className="bg-neutral-50 p-4 rounded-lg text-center animate-in fade-in zoom-in duration-300">
          <p className="font-medium text-neutral-700">{calculateImpact(amount)}</p>
        </div>
      )}

      <Button size="lg" className="w-full h-14 text-lg mt-4" onClick={handleContinue} disabled={amount <= 0}>
        Continue to Payment <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  )

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-neutral-50 p-4 rounded-lg">
        <span className="text-muted-foreground">Donation Amount</span>
        <span className="text-xl font-bold">₹{amount.toLocaleString()}</span>
      </div>

      <div>
        <Label className="text-base font-semibold mb-4 block">Select Payment Method</Label>
        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
          <div className="flex items-center space-x-3 border p-4 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => setPaymentMethod('upi')}>
            <RadioGroupItem value="upi" id="upi" />
            <Label htmlFor="upi" className="flex-1 cursor-pointer font-medium">UPI (GPay, PhonePe, Paytm)</Label>
            <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded">Recommended</span>
          </div>
          <div className="flex items-center space-x-3 border p-4 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => setPaymentMethod('card')}>
            <RadioGroupItem value="card" id="card" />
            <Label htmlFor="card" className="flex-1 cursor-pointer font-medium">Credit / Debit Card</Label>
            <CreditCard className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex items-center space-x-3 border p-4 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => setPaymentMethod('netbanking')}>
            <RadioGroupItem value="netbanking" id="netbanking" />
            <Label htmlFor="netbanking" className="flex-1 cursor-pointer font-medium">Net Banking</Label>
          </div>
        </RadioGroup>
      </div>

      {paymentMethod === 'upi' && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <Label className="mb-2 block">Enter UPI ID</Label>
          <Input placeholder="example@upi" className="h-12" defaultValue="user@okaxis" />
        </div>
      )}

      <div className="text-xs text-muted-foreground text-center">
        In demo mode, payment confirmation is verified by the NobleNet API. Live checkout never exposes gateway secrets to this page.
      </div>

      <Button 
        size="lg" 
        className="w-full h-14 text-lg" 
        onClick={handleContinue} 
        disabled={donateMutation.isPending}
      >
        {donateMutation.isPending ? "Processing Payment..." : `Pay ₹${amount.toLocaleString()}`}
      </Button>
      
      <Button variant="ghost" className="w-full" onClick={() => setStep('amount')} disabled={donateMutation.isPending}>
        Back
      </Button>
    </div>
  )

  const renderSuccessStep = () => (
    <div className="text-center space-y-6 py-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>
      
      <h3 className="text-3xl font-bold">Thank you!</h3>
      <p className="text-lg text-muted-foreground max-w-sm mx-auto">
        Your donation of <span className="font-bold text-foreground">₹{amount.toLocaleString()}</span> was verified and credited successfully.
      </p>
      
      <div className="bg-neutral-50 p-4 rounded-lg text-sm mb-6 max-w-sm mx-auto">
        <p className="font-medium text-neutral-800">{calculateImpact(amount)}</p>
        <p className="text-muted-foreground mt-2">A verified digital receipt has been generated in your account.</p>
      </div>

      <div className="flex flex-col gap-3 max-w-sm mx-auto">
        <Button variant="outline" className="w-full h-12 gap-2" onClick={() => toast.success("Receipt downloaded")}>
          <Download className="w-4 h-4" /> Download Receipt
        </Button>
        <Button className="w-full h-12" onClick={onClose}>
          Return to Campaign
        </Button>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if(!open && !donateMutation.isPending) onClose()
    }}>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader className={step === 'success' ? 'hidden' : ''}>
          <DialogTitle className="text-2xl font-bold">Make a Donation</DialogTitle>
          <DialogDescription>
            Supporting: <span className="font-semibold text-foreground">{campaign.title}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {step === 'amount' && renderAmountStep()}
          {step === 'payment' && renderPaymentStep()}
          {step === 'success' && renderSuccessStep()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
