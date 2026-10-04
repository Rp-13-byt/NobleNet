import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { loginWithCredentials, registerWithCredentials, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'USER' | 'NGO'>('USER');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await loginWithCredentials(loginEmail, loginPassword);
      toast.success('Signed in successfully!');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Invalid email or password');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await registerWithCredentials(regName, regEmail, regPassword, regRole);
      toast.success('Account created successfully!');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    }
  };

  const fillDemoAccount = (email: string) => {
    setLoginEmail(email);
    setLoginPassword('Password123!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Welcome to NobleNet</DialogTitle>
          <DialogDescription className="text-center">
            Connect with verified NGOs or manage your social impact.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Create Account</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-2 text-center">Quick demo credentials:</p>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs px-1"
                    onClick={() => fillDemoAccount('priya@example.com')}
                  >
                    User
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs px-1"
                    onClick={() => fillDemoAccount('contact@hopefoundation.org')}
                  >
                    NGO Admin
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs px-1"
                    onClick={() => fillDemoAccount('admin@noblenet.org')}
                  >
                    Super Admin
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name">Full Name / Organization</Label>
                <Input
                  id="reg-name"
                  type="text"
                  placeholder="Priya Patel or Hope Foundation"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password (Min 8 chars)</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Account Role</Label>
                <RadioGroup
                  value={regRole}
                  onValueChange={(val: any) => setRegRole(val)}
                  className="flex gap-4 pt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="USER" id="role-user" />
                    <Label htmlFor="role-user" className="cursor-pointer">User (Donor / Volunteer)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="NGO" id="role-ngo" />
                    <Label htmlFor="role-ngo" className="cursor-pointer">NGO Organization</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
