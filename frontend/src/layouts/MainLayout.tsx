import { useState } from "react"
import { Outlet, Link } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { AuthModal } from "@/features/auth/AuthModal"

export function MainLayout() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const getDashboardLink = () => {
    if (user?.role === 'USER') return '/dashboard'
    if (user?.role === 'NGO') return '/ngo-dashboard'
    if (user?.role === 'SUPER_ADMIN') return '/admin'
    return '/'
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="border-b bg-white sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl text-primary flex items-center gap-2">
            <img src="/logo.png" alt="NobleNet Logo" className="h-10 w-auto mix-blend-multiply" />
            NobleNet
          </Link>
          <nav className="hidden md:flex gap-6 items-center">
            <Link to="/discover" className="text-sm font-medium hover:text-primary">Discover</Link>
            <Link to="/ngos" className="text-sm font-medium hover:text-primary">NGOs</Link>
            <Link to="/volunteer" className="text-sm font-medium hover:text-primary">Volunteer</Link>
          </nav>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()}>
                  <Button variant="outline" size="sm">Dashboard</Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setAuthModalOpen(true)}>Join NobleNet</Button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 bg-neutral-50/50">
        <Outlet />
      </main>
      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="font-bold text-xl text-primary mb-4 flex items-center gap-2">
              <img src="/logo.png" alt="NobleNet Logo" className="h-8 w-auto mix-blend-multiply" />
              NobleNet
            </div>
            <p className="text-sm text-muted-foreground">
              Your kindness can become real change. Support verified NGOs through donations, items, or your time.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/discover">Campaigns</Link></li>
              <li><Link to="/ngos">Verified NGOs</Link></li>
              <li><Link to="/volunteer">Volunteer</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">About</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#">How it works</a></li>
              <li><a href="#">Trust & Safety</a></li>
              <li><a href="#">Impact Reports</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} NobleNet. All rights reserved.
        </div>
      </footer>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  )
}
