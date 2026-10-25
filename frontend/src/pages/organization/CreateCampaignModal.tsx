import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Megaphone, PlusCircle } from 'lucide-react';

interface CreateCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCampaignModal({ open, onOpenChange }: CreateCampaignModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [category, setCategory] = useState('Education');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [location, setLocation] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      const amt = Number(targetAmount);
      if (!title.trim()) throw new Error('Campaign title is required');
      if (!amt || amt <= 0) throw new Error('Please enter a valid target fundraising goal');
      if (!description.trim()) throw new Error('Campaign story and description is required');

      const img = imageUrl.trim() || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800';
      return apiClient.post('/campaigns', {
        title: title.trim(),
        goalAmount: amt,
        targetAmount: amt,
        category,
        description: description.trim(),
        location: location.trim() || 'Pan-India',
        images: [img],
        imageUrl: img,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      });
    },
    onSuccess: () => {
      toast.success('Campaign launched successfully! It is now open to community donors.');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['ngo-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      onOpenChange(false);
      setTitle('');
      setTargetAmount('');
      setDescription('');
      setImageUrl('');
      setLocation('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create campaign');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            Launch New Fundraising Campaign
          </DialogTitle>
          <DialogDescription>
            Create a verified fundraiser with clear goals, timelines, and impact metrics.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold">Campaign Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Winter Warmth Blanket Distribution Drive"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="targetAmount" className="text-xs font-semibold">Target Goal (₹) *</Label>
              <Input
                id="targetAmount"
                type="number"
                min="100"
                step="100"
                placeholder="50000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Disaster Relief">Disaster Relief</SelectItem>
                  <SelectItem value="Child Welfare">Child Welfare</SelectItem>
                  <SelectItem value="Animal Care">Animal Care</SelectItem>
                  <SelectItem value="Environment">Environment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location" className="text-xs font-semibold">Beneficiary Location</Label>
            <Input
              id="location"
              placeholder="e.g., Delhi NCR, Bihar, Rural Maharashtra"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="imageUrl" className="text-xs font-semibold">Cover Image URL (Optional)</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold">Campaign Story & Fund Utilization *</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Explain why this cause needs immediate support, how funds will be spent, and transparency guarantees..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="gap-1.5">
              <PlusCircle className="w-4 h-4" />
              {createMutation.isPending ? 'Publishing...' : 'Publish Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
