import { getDb, setDb, delay } from './mockDb'

export interface NGO {
  id: string
  name: string
  mission: string
  about: string
  location: string
  logoUrl: string
  coverUrl: string
  isVerified: boolean
  rating: number
  establishedYear: number
  categories: string[]
  stats: {
    activeCampaigns: number
    totalImpact: string
    volunteersEngaged: number
  }
}

const initialNGOs: NGO[] = [
  {
    id: 'ngo-1',
    name: 'Udaan Foundation',
    mission: 'Empowering children through quality education.',
    about: 'Udaan Foundation has been working since 2012 to ensure every child gets access to basic education and schooling essentials.',
    location: 'Mumbai, Maharashtra',
    logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1200&auto=format&fit=crop',
    isVerified: true,
    rating: 4.8,
    establishedYear: 2012,
    categories: ['Education', 'Children'],
    stats: {
      activeCampaigns: 4,
      totalImpact: '15,000+ Students',
      volunteersEngaged: 350
    }
  },
  {
    id: 'ngo-2',
    name: 'Rural Health Initiative',
    mission: 'Bringing healthcare to the last mile.',
    about: 'We conduct medical camps and build primary healthcare centers in remote villages.',
    location: 'Bhopal, Madhya Pradesh',
    logoUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=200&h=200&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=1200&auto=format&fit=crop',
    isVerified: true,
    rating: 4.9,
    establishedYear: 2015,
    categories: ['Healthcare'],
    stats: {
      activeCampaigns: 2,
      totalImpact: '50,000+ Patients',
      volunteersEngaged: 120
    }
  }
]

export const ngoService = {
  async getNgos(): Promise<NGO[]> {
    await delay()
    return getDb<NGO[]>('ngos', initialNGOs)
  },

  async getNgoById(id: string): Promise<NGO | undefined> {
    await delay()
    const ngos = getDb<NGO[]>('ngos', initialNGOs)
    return ngos.find(n => n.id === id)
  }
}
