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
import { Users, PlusCircle } from 'lucide-react';

interface CreateVolunteerOppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateVolunteerOppModal({ open, onOpenChange }: CreateVolunteerOppModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Education');
  const [location, setLocation] = useState('');
  const [isRemote, setIsRemote] = useState('false');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('01:00 PM');
  const [requiredVolunteers, setRequiredVolunteers] = useState('');
  const [skills, setSkills] = useState('');
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error('Opportunity title is required');
      if (!location.trim() && isRemote === 'false') throw new Error('Location is required for on-ground roles');
      if (!eventDate) throw new Error('Event date is required');
      const reqCount = parseInt(requiredVolunteers, 10);
      if (!reqCount || reqCount <= 0) throw new Error('Please specify required number of volunteers');
      if (!description.trim()) throw new Error('Role description is required');

      const skillsArray = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      return apiClient.post('/volunteering', {
        title: title.trim(),
        category,
        location: isRemote === 'true' ? 'Remote / Online' : location.trim(),
        isRemote: isRemote === 'true',
        eventDate: new Date(eventDate).toISOString(),
        startTime,
        endTime,
        requiredVolunteers: reqCount,
        requiredSkills: skillsArray.length > 0 ? skillsArray : ['Enthusiasm', 'Teamwork'],
        description: description.trim(),
        status: 'OPEN',
      });
    },
    onSuccess: () => {
      toast.success('Volunteer opportunity posted successfully! Community members can now apply.');
      queryClient.invalidateQueries({ queryKey: ['volunteer-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['ngo-applications'] });
      onOpenChange(false);
      setTitle('');
      setLocation('');
      setEventDate('');
      setRequiredVolunteers('');
      setSkills('');
      setDescription('');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create volunteer opportunity');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Users className="w-5 h-5" />
            </div>
            <DialogTitle>Post Volunteer Opportunity</DialogTitle>
          </div>
          <DialogDescription>
            Recruit passionate volunteers for on-ground relief operations, teaching drives, or remote assistance.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4 py-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="vol-title">Title / Role Name *</Label>
            <Input
              id="vol-title"
              placeholder="e.g. Weekend Teaching Assistant, Medical Camp Volunteer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vol-category">Domain / Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="vol-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Education">Education & Tutoring</SelectItem>
                  <SelectItem value="Healthcare">Healthcare & Blood Drives</SelectItem>
                  <SelectItem value="Environment">Tree Plantation & Cleanliness</SelectItem>
                  <SelectItem value="Disaster Relief">Disaster & Relief Logistics</SelectItem>
                  <SelectItem value="Elderly Care">Elderly & Community Care</SelectItem>
                  <SelectItem value="Animal Welfare">Animal Care & Rescue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vol-mode">Opportunity Mode</Label>
              <Select value={isRemote} onValueChange={setIsRemote}>
                <SelectTrigger id="vol-mode">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">On-Ground (In-Person)</SelectItem>
                  <SelectItem value="true">Remote (Online)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vol-location">City / Venue {isRemote === 'false' && '*'}</Label>
              <Input
                id="vol-location"
                placeholder={isRemote === 'true' ? 'Online / Zoom' : 'e.g. South Delhi Community Hall'}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isRemote === 'true'}
                required={isRemote === 'false'}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vol-count">Required Volunteers *</Label>
              <Input
                id="vol-count"
                type="number"
                min="1"
                placeholder="e.g. 15"
                value={requiredVolunteers}
                onChange={(e) => setRequiredVolunteers(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vol-date">Event Date *</Label>
              <Input
                id="vol-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vol-start">Start Time</Label>
              <Input
                id="vol-start"
                placeholder="09:00 AM"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vol-end">End Time</Label>
              <Input
                id="vol-end"
                placeholder="02:00 PM"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vol-skills">Required Skills (Comma-separated)</Label>
            <Input
              id="vol-skills"
              placeholder="e.g. Basic English, First Aid, Driving, Photography"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vol-desc">Role Responsibilities & Volunteer Guidelines *</Label>
            <Textarea
              id="vol-desc"
              rows={3}
              placeholder="Detail what volunteers will be doing, briefing time, attire guidelines, meals provided, etc."
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
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlusCircle className="w-4 h-4" />
              {createMutation.isPending ? 'Publishing...' : 'Publish Volunteer Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
