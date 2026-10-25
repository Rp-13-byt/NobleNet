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
import { Package, PlusCircle } from 'lucide-react';

interface CreateWishlistItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ngoId?: string;
}

export function CreateWishlistItemModal({ open, onOpenChange, ngoId }: CreateWishlistItemModalProps) {
  const queryClient = useQueryClient();
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Medical');
  const [description, setDescription] = useState('');
  const [requiredQuantity, setRequiredQuantity] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [imageUrl, setImageUrl] = useState('');

  // Fetch wishlists for this NGO to attach to
  const { data: wishlists } = useQuery({
    queryKey: ['ngo-wishlists', ngoId],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/wishlists${ngoId ? `?ngoId=${ngoId}` : ''}`);
      return (res.data || []) as any[];
    },
    enabled: open,
  });

  const addItemMutation = useMutation({
    mutationFn: async () => {
      if (!itemName.trim()) throw new Error('Item name is required');
      const qty = parseInt(requiredQuantity, 10);
      if (!qty || qty <= 0) throw new Error('Quantity must be at least 1');

      let targetWishlistId = wishlists && wishlists.length > 0 ? wishlists[0]._id : null;

      // If no wishlist exists for this NGO, create one first
      if (!targetWishlistId) {
        const createWishlistRes = await apiClient.post<any>('/wishlists', {
          title: 'Organization Needs & Material Drives',
          description: 'Essential supplies and items needed for our ongoing ground relief operations.',
        });
        targetWishlistId = createWishlistRes.data?._id;
      }

      if (!targetWishlistId) {
        throw new Error('Failed to resolve wishlist. Please try again.');
      }

      return apiClient.post(`/wishlists/${targetWishlistId}/items`, {
        itemName: itemName.trim(),
        category,
        description: description.trim(),
        requiredQuantity: qty,
        priority,
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?q=80&w=600',
      });
    },
    onSuccess: () => {
      toast.success('Wishlist item added successfully! Donors can now pledge physical contributions.');
      queryClient.invalidateQueries({ queryKey: ['wishlists'] });
      queryClient.invalidateQueries({ queryKey: ['ngo-wishlists'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-items'] });
      onOpenChange(false);
      setItemName('');
      setDescription('');
      setRequiredQuantity('');
      setImageUrl('');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to add item to wishlist');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Package className="w-5 h-5" />
            </div>
            <DialogTitle>Request Required Supplies</DialogTitle>
          </div>
          <DialogDescription>
            List physical supplies (medical kits, blankets, ration packs) that community members can buy or donate.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            addItemMutation.mutate();
          }}
          className="space-y-4 py-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="item-name">Item Name *</Label>
            <Input
              id="item-name"
              placeholder="e.g. Thermal Blankets, Student Geometry Boxes, Wheelchair"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Medical">Medical Supplies</SelectItem>
                  <SelectItem value="Education">Education & Stationery</SelectItem>
                  <SelectItem value="Disaster Relief">Disaster Relief</SelectItem>
                  <SelectItem value="Rations">Food & Rations</SelectItem>
                  <SelectItem value="Clothing">Clothing & Winter Wear</SelectItem>
                  <SelectItem value="Shelter">Shelter Essentials</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priority">Urgency Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High (Urgent Need)</SelectItem>
                  <SelectItem value="MEDIUM">Medium (Normal)</SelectItem>
                  <SelectItem value="LOW">Low (Ongoing)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="required-quantity">Required Quantity *</Label>
              <Input
                id="required-quantity"
                type="number"
                min="1"
                placeholder="e.g. 50"
                value={requiredQuantity}
                onChange={(e) => setRequiredQuantity(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="image-url">Image URL (Optional)</Label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Item Specifications & Logistics Note</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Specify size, preferred brands, drop-off timing, or packaging guidelines for donors..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addItemMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addItemMutation.isPending}
              className="gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              {addItemMutation.isPending ? 'Adding Item...' : 'Publish Item Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
