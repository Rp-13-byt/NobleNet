import { getDb, setDb, delay } from './mockDb'

export type CampaignStatus = 'Active' | 'Completed' | 'Pending'

export interface Campaign {
  id: string
  ngoId: string
  title: string
  description: string
  category: string
  location: string
  imageUrl: string
  targetAmount: number
  raisedAmount: number
  supportersCount: number
  daysRemaining: number
  status: CampaignStatus
  isVerified: boolean
}

const initialCampaigns: Campaign[] = [
  {
    id: 'camp-1',
    ngoId: 'ngo-1',
    title: 'Help 500 Children Return to School',
    description: 'Providing school kits, uniforms, and books to children in rural areas so they can continue their education without financial burden.',
    category: 'Education',
    location: 'Mumbai, Maharashtra',
    imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop',
    targetAmount: 500000,
    raisedAmount: 320000,
    supportersCount: 142,
    daysRemaining: 15,
    status: 'Active',
    isVerified: true
  },
  {
    id: 'camp-2',
    ngoId: 'ngo-2',
    title: 'Rural Healthcare Initiative',
    description: 'Setting up free medical camps in remote villages to provide basic healthcare, medicines, and checkups to the elderly and children.',
    category: 'Healthcare',
    location: 'Bhopal, Madhya Pradesh',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=800&auto=format&fit=crop',
    targetAmount: 200000,
    raisedAmount: 180000,
    supportersCount: 89,
    daysRemaining: 4,
    status: 'Active',
    isVerified: true
  }
]

export const campaignService = {
  async getCampaigns(): Promise<Campaign[]> {
    await delay()
    return getDb<Campaign[]>('campaigns', initialCampaigns)
  },

  async getCampaignById(id: string): Promise<Campaign | undefined> {
    await delay()
    const campaigns = getDb<Campaign[]>('campaigns', initialCampaigns)
    return campaigns.find(c => c.id === id)
  },
  
  async updateCampaignRaised(id: string, amount: number): Promise<void> {
    await delay(300)
    const campaigns = getDb<Campaign[]>('campaigns', initialCampaigns)
    const index = campaigns.findIndex(c => c.id === id)
    if (index !== -1) {
      campaigns[index].raisedAmount += amount
      campaigns[index].supportersCount += 1
      setDb('campaigns', campaigns)
    }
  }
}
