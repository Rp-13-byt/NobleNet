import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FileText, PlusCircle } from 'lucide-react';

interface PostImpactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ngoId?: string;
  defaultCampaignId?: string;
}

export function PostImpactModal({ open, onOpenChange, ngoId, defaultCampaignId }: PostImpactModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [campaignId, setCampaignId] = useState(defaultCampaignId || 'none');
  const [fundsUsed, setFundsUsed] = useState('');
  const [beneficiariesReached, setBeneficiariesReached] = useState('');
  const [milestones, setMilestones] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');

  // Fetch campaigns by this NGO to link to
  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/campaigns?limit=50');
      return (res.data || []) as any[];
    },
    enabled: open,
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error('Impact report title is required');
      if (!description.trim()) throw new Error('Detailed impact summary is required');

      const funds = fundsUsed ? Number(fundsUsed) : 0;
      const beneficiaries = beneficiariesReached ? Number(beneficiariesReached) : 0;

      const milestonesArray = milestones
        .split('\n')
        .map((m) => m.trim())
        .filter(Boolean);

      const imagesArray = imageUrl.trim() ? [imageUrl.trim()] : [];

      return apiClient.post('/impact', {
        title: title.trim(),
        description: description.trim(),
        fundsUsed: funds,
        beneficiariesReached: beneficiaries,
        milestones: milestonesArray.length > 0 ? milestonesArray : ['Community drive conducted'],
        images: imagesArray,
        campaignId: campaignId && campaignId !== 'none' ? campaignId : undefined,
        published: true,
      });
    },
    onSuccess: () => {
      toast.success('Impact report published! Donors can now review transparent utilization.');
      if (ngoId) {
        queryClient.invalidateQueries({ queryKey: ['ngo-impact', ngoId] });
      }
      queryClient.invalidateQueries({ queryKey: ['impact-reports'] });
      onOpenChange(false);
      setTitle('');
      setCampaignId('none');
      setFundsUsed('');
      setBeneficiariesReached('');
      setMilestones('');
      setImageUrl('');
      setDescription('');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to publish impact update');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <FileText className="w-5 h-5" />
            </div>
            <DialogTitle>Publish Transparent Impact Report</DialogTitle>
          </div>
          <DialogDescription>
            Share audited fund utilization, milestone proof, and beneficiaries supported with your community of donors.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            postMutation.mutate();
          }}
          className="space-y-4 py-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="impact-title">Report Title *</Label>
            <Input
              id="impact-title"
              placeholder="e.g. 500 Ration Kits Distributed in North Delhi Relief Drive"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="campaign-select">Linked Campaign (Optional)</Label>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger id="campaign-select">
                <SelectValue placeholder="Select Campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General NGO Impact (No Specific Campaign)</SelectItem>
                {(campaigns || []).map((c: any) => (
                  <SelectItem key={c._id || c.id} value={c._id || c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="funds-used">Funds Utilized (₹)</Label>
              <Input
                id="funds-used"
                type="number"
                min="0"
                placeholder="e.g. 125000"
                value={fundsUsed}
                onChange={(e) => setFundsUsed(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="beneficiaries">Beneficiaries Reached</Label>
              <Input
                id="beneficiaries"
                type="number"
                min="0"
                placeholder="e.g. 450"
                value={beneficiariesReached}
                onChange={(e) => setBeneficiariesReached(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="impact-image">Photo Proof URL</Label>
            <Input
              id="impact-image"
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="milestones">Milestones Achieved (One per line)</Label>
            <Textarea
              id="milestones"
              rows={2}
              placeholder="Procured medical inventory from verified vendor&#10;Completed doorstep distribution to 150 families"
              value={milestones}
              onChange={(e) => setMilestones(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="impact-desc">Summary & Expense Narrative *</Label>
            <Textarea
              id="impact-desc"
              rows={3}
              placeholder="Describe the outcomes achieved, difficulties overcome, and how donor contributions were directly deployed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={postMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={postMutation.isPending}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <PlusCircle className="w-4 h-4" />
              {postMutation.isPending ? 'Publishing...' : 'Publish Verified Impact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
