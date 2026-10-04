import { getDb, setDb, delay } from './mockDb'

export interface WishlistItem {
  id: string
  ngoId: string
  name: string
  category: string
  requiredQuantity: number
  pledgedQuantity: number
  priority: 'High' | 'Medium' | 'Low'
  imageUrl: string
}

const initialItems: WishlistItem[] = [
  {
    id: 'item-1',
    ngoId: 'ngo-1',
    name: 'School Bags',
    category: 'Education',
    requiredQuantity: 100,
    pledgedQuantity: 68,
    priority: 'High',
    imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'item-2',
    ngoId: 'ngo-1',
    name: 'Geometry Boxes',
    category: 'Education',
    requiredQuantity: 200,
    pledgedQuantity: 150,
    priority: 'Medium',
    imageUrl: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'item-3',
    ngoId: 'ngo-2',
    name: 'First Aid Kits',
    category: 'Healthcare',
    requiredQuantity: 50,
    pledgedQuantity: 49, // Only 1 left! Good for concurrency demo
    priority: 'High',
    imageUrl: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?q=80&w=400&auto=format&fit=crop'
  }
]

export const wishlistService = {
  async getItemsByNgo(ngoId: string): Promise<WishlistItem[]> {
    await delay()
    const items = getDb<WishlistItem[]>('wishlist', initialItems)
    return items.filter(i => i.ngoId === ngoId)
  },

  async pledgeItem(itemId: string, quantity: number): Promise<{ success: boolean; message: string }> {
    await delay(600)
    const items = getDb<WishlistItem[]>('wishlist', initialItems)
    const itemIndex = items.findIndex(i => i.id === itemId)
    
    if (itemIndex === -1) throw new Error("Item not found")
    
    const item = items[itemIndex]
    const remaining = item.requiredQuantity - item.pledgedQuantity
    
    // Concurrency check simulation (Optimistic locking mock)
    if (quantity > remaining) {
      if (remaining === 0) {
        return { success: false, message: "Sorry, this item was just fully pledged by another user." }
      }
      return { success: false, message: `Only ${remaining} items are left. Please reduce your quantity.` }
    }
    
    items[itemIndex].pledgedQuantity += quantity
    setDb('wishlist', items)
    
    return { success: true, message: "Successfully pledged! The NGO will contact you for delivery details." }
  }
}
