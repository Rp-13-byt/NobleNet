import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export function Unauthorized() {
  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-6">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold mb-3">Access Denied</h1>
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        You do not have the required permissions to access this area. If you believe this is in error, please switch to an authorized role.
      </p>
      <div className="flex gap-4">
        <Link to="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Return to Home
          </Button>
        </Link>
        <Link to="/campaigns">
          <Button>Explore Campaigns</Button>
        </Link>
      </div>
    </div>
  );
}
