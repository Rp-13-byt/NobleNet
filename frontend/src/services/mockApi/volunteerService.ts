import { getDb, setDb, delay } from './mockDb'

export interface VolunteerOpp {
  id: string
  ngoId: string
  title: string
  date: string
  time: string
  location: string
  requiredSkills: string[]
  seatsAvailable: number
  description: string
  requirements: string[]
  responsibilities: string[]
}

const initialOpps: VolunteerOpp[] = [
  {
    id: 'vol-1',
    ngoId: 'ngo-1',
    title: 'Weekend Teaching Volunteers',
    date: '2026-10-15',
    time: '09:00 AM - 01:00 PM',
    location: 'Dharavi, Mumbai',
    requiredSkills: ['Teaching', 'English', 'Patience'],
    seatsAvailable: 5,
    description: 'Spend your weekend morning teaching basic English and Mathematics to primary school children in our community center.',
    requirements: ['Must be fluent in English', 'Previous teaching experience is a plus but not required'],
    responsibilities: ['Conducting a 4-hour class', 'Helping kids with assignments', 'Engaging them in educational games']
  },
  {
    id: 'vol-2',
    ngoId: 'ngo-2',
    title: 'Medical Camp Registration Desk',
    date: '2026-10-20',
    time: '08:00 AM - 04:00 PM',
    location: 'Bhopal Rural District',
    requiredSkills: ['Data Entry', 'Local Language', 'Communication'],
    seatsAvailable: 2,
    description: 'Help us manage the crowd and register patients at our free rural medical camp.',
    requirements: ['Must know Hindi fluently', 'Basic computer skills'],
    responsibilities: ['Registering patient details on tablets', 'Managing queue', 'Directing patients to the right doctors']
  }
]

export const volunteerService = {
  async getOpportunities(): Promise<VolunteerOpp[]> {
    await delay()
    return getDb<VolunteerOpp[]>('volunteer_opps', initialOpps)
  },

  async getOpportunityById(id: string): Promise<VolunteerOpp | undefined> {
    await delay()
    const opps = getDb<VolunteerOpp[]>('volunteer_opps', initialOpps)
    return opps.find(o => o.id === id)
  },

  async applyToVolunteer(oppId: string, message: string): Promise<{ success: boolean; message: string }> {
    await delay(800)
    const opps = getDb<VolunteerOpp[]>('volunteer_opps', initialOpps)
    const index = opps.findIndex(o => o.id === oppId)
    
    if (index === -1) throw new Error("Opportunity not found")
    
    if (opps[index].seatsAvailable <= 0) {
      return { success: false, message: "Sorry, all seats are filled for this activity." }
    }
    
    // In a real app we'd save an application record. Here we just decrement seats to show state change
    opps[index].seatsAvailable -= 1
    setDb('volunteer_opps', opps)
    
    return { success: true, message: "Application submitted successfully! The NGO will review it shortly." }
  }
}
