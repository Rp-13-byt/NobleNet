import { apiClient } from './apiClient';

export interface BackendVolunteerOpportunity {
  _id: string;
  id?: string;
  ngoId: any;
  title: string;
  description: string;
  category: string;
  location: string;
  isRemote?: boolean;
  eventDate: string;
  startTime: string;
  endTime: string;
  requiredSkills: string[];
  requiredVolunteers: number;
  approvedVolunteers: number;
  status: string;
}

export interface VolunteerOpp {
  id: string;
  ngoId: string;
  title: string;
  date: string;
  time: string;
  location: string;
  requiredSkills: string[];
  seatsAvailable: number;
  description: string;
  requirements: string[];
  responsibilities: string[];
  raw?: BackendVolunteerOpportunity;
}

function mapBackendOpportunity(b: BackendVolunteerOpportunity): VolunteerOpp {
  const id = b.id || b._id;
  const eventDateStr = b.eventDate ? new Date(b.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming';
  const seatsAvailable = Math.max(0, b.requiredVolunteers - (b.approvedVolunteers || 0));

  return {
    id,
    ngoId: typeof b.ngoId === 'object' && b.ngoId ? b.ngoId._id || b.ngoId.id : b.ngoId,
    title: b.title,
    date: eventDateStr,
    time: `${b.startTime || '09:00 AM'} - ${b.endTime || '01:00 PM'}`,
    location: b.location,
    requiredSkills: b.requiredSkills && b.requiredSkills.length > 0 ? b.requiredSkills : ['Enthusiasm', 'Community Spirit'],
    seatsAvailable,
    description: b.description,
    requirements: [
      'Positive and proactive attitude',
      `Skills matching: ${b.requiredSkills?.join(', ') || 'Teamwork'}`,
      'Available for the specified time commitment',
    ],
    responsibilities: [
      'Active participation on the designated event day',
      'Coordinating with on-ground NGO volunteer leads',
      'Supporting logistics and beneficiary interactions',
    ],
    raw: b,
  };
}

export const volunteerService = {
  async getOpportunities(category?: string, location?: string): Promise<VolunteerOpp[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (location) params.append('location', location);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<{ data: BackendVolunteerOpportunity[]; meta: any } | BackendVolunteerOpportunity[]>(`/volunteering${queryStr}`);
    const items = Array.isArray(res) ? res : res?.data || [];
    return items.map(mapBackendOpportunity);
  },

  async getOpportunityById(id: string): Promise<VolunteerOpp | undefined> {
    try {
      const res = await apiClient.get<BackendVolunteerOpportunity>(`/volunteering/${id}`);
      return mapBackendOpportunity(res);
    } catch {
      return undefined;
    }
  },

  async applyToVolunteer(oppId: string, message: string): Promise<{ success: boolean; message: string }> {
    try {
      await apiClient.post(`/volunteering/${oppId}/apply`, {
        message,
        skills: ['Community Mentorship'],
        availability: 'Weekends',
      });
      return {
        success: true,
        message: 'Application submitted successfully! The NGO will review your profile.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to submit application.',
      };
    }
  },

  async getMyApplications(): Promise<any[]> {
    return apiClient.get<any[]>('/volunteering/applications/my');
  },

  async getNgoApplications(): Promise<any[]> {
    return apiClient.get<any[]>('/volunteering/ngo/applications');
  },

  async approveApplication(applicationId: string): Promise<any> {
    return apiClient.patch(`/volunteering/applications/${applicationId}/approve`);
  },

  async rejectApplication(applicationId: string): Promise<any> {
    return apiClient.patch(`/volunteering/applications/${applicationId}/reject`);
  },
};
