import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { PageMeta } from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, ShieldCheck, Mail, Bell, Key, Save } from 'lucide-react';

export default function Settings() {
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Profile settings updated successfully');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <PageMeta
        title="Account Settings | NobleNet"
        description="Manage your profile credentials, contact details, and notification preferences."
      />

      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal details, role identity, and security options.
        </p>
      </div>

      {/* Role & Verification Badge */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Account Identity</CardTitle>
          <CardDescription>Your current access role and verification status on NobleNet.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-primary/10 text-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">{user?.name}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-semibold uppercase tracking-wider text-xs">
              {user?.role}
            </Badge>
            {user?.isVerified && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                <ShieldCheck className="w-3 h-3 mr-1" /> Verified
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Profile Details</CardTitle>
          <CardDescription>Update how your name appears on donation receipts and volunteer rosters.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
              <Input value={email} disabled className="bg-neutral-100 text-muted-foreground cursor-not-allowed" />
              <p className="text-[11px] text-muted-foreground">Email address cannot be changed once verified.</p>
            </div>

            <Button type="submit" className="gap-1.5">
              <Save className="w-4 h-4" /> Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Notifications</CardTitle>
          <CardDescription>Choose updates regarding your active campaigns and volunteer events.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded border-neutral-300 text-primary focus:ring-primary h-4 w-4" />
            <span>Email receipts and 80G tax certificates instantly</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded border-neutral-300 text-primary focus:ring-primary h-4 w-4" />
            <span>Updates when my supported campaigns reach impact milestones</span>
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
