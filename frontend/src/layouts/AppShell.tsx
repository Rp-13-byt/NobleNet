import { useState, useTransition, Suspense } from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { PageSkeleton } from '@/components/common/PageSkeleton';
import { useAuthStore } from '@/store/authStore';
import { AuthModal } from '@/features/auth/AuthModal';
import { DemoSwitcher } from '@/components/common/DemoSwitcher';
import { NotificationBell } from '@/components/common/NotificationBell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Menu,
  Heart,
  Package,
  Clock,
  Compass,
  Building2,
  Sparkles,
  User as UserIcon,
  LogOut,
  Settings,
  ShieldCheck,
  Megaphone,
  Receipt,
  FileCheck2,
  RotateCcw,
  History,
  X,
  ArrowRight,
} from 'lucide-react';

export function AppShell() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [, startTransition] = useTransition();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchModalOpen(false);
      setMobileMenuOpen(false);
      navigate(`/campaigns?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleMobileAccountClick = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
    } else if (user?.role === 'NGO') {
      navigate('/organization');
    } else if (user?.role === 'SUPER_ADMIN') {
      navigate('/admin');
    } else {
      navigate('/me');
    }
  };

  const handleLogout = () => {
    startTransition(() => {
      logout();
      navigate('/');
    });
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors hover:text-primary ${
      isActive ? 'text-primary font-semibold' : 'text-neutral-600'
    }`;

  const getRoleBadgeVariant = (role?: string) => {
    if (role === 'SUPER_ADMIN') return 'bg-purple-100 text-purple-800 border-purple-200';
    if (role === 'NGO') return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-neutral-50/40 text-neutral-900 selection:bg-primary/20">
      {/* ─── Top Universal Header ─── */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 transition-all">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 font-bold text-xl text-primary shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
            aria-label="NobleNet Home"
          >
            <img src="/logo.png" alt="" className="h-9 w-auto mix-blend-multiply" />
            <span className="tracking-tight text-neutral-900 font-extrabold text-xl">
              Noble<span className="text-primary">Net</span>
            </span>
          </Link>

          {/* Desktop Search Trigger */}
          <div className="hidden lg:flex items-center flex-1 max-w-xs mx-4">
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-500 bg-neutral-100/80 hover:bg-neutral-100 border border-neutral-200 rounded-full transition-colors cursor-pointer"
              aria-label="Search causes and organizations"
            >
              <Search className="w-4 h-4 text-neutral-400" />
              <span>Search causes, NGOs...</span>
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-neutral-400">
                /
              </kbd>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main Navigation">
            <NavLink to="/explore" className={navLinkClasses}>
              Explore
            </NavLink>
            <NavLink to="/campaigns" className={navLinkClasses}>
              Campaigns
            </NavLink>
            <NavLink to="/ngos" className={navLinkClasses}>
              NGOs
            </NavLink>
            <NavLink to="/volunteers" className={navLinkClasses}>
              Volunteers
            </NavLink>
            <NavLink to="/wishlist" className={navLinkClasses}>
              Wishlist
            </NavLink>
            <NavLink to="/how-it-works" className={navLinkClasses}>
              How It Works
            </NavLink>
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Icon (Mobile / Tablet) */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-full cursor-pointer text-neutral-600"
              onClick={() => setSearchModalOpen(true)}
              aria-label="Open search dialog"
            >
              <Search className="w-5 h-5" />
            </Button>

            {isAuthenticated && user && <NotificationBell />}

            {isAuthenticated && user ? (
              /* Role-Aware Profile Menu */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative flex items-center gap-2 pl-2 pr-3 py-1.5 h-10 rounded-full border border-neutral-200 hover:bg-neutral-100 focus:ring-2 focus:ring-primary cursor-pointer"
                    aria-label="User Account Menu"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs font-semibold max-w-[100px] truncate hidden sm:inline-block">
                      {user.name?.split(' ')[0]}
                    </span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getRoleBadgeVariant(user.role)}`}>
                      {user.role === 'SUPER_ADMIN' ? 'Admin' : user.role}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-64 p-2 shadow-xl rounded-xl">
                  <DropdownMenuLabel className="font-normal px-2 py-1.5">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none text-neutral-900">{user.name}</p>
                      <p className="text-xs text-neutral-500 leading-none truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Role Specific Section */}
                  {user.role === 'USER' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/me" className="flex items-center gap-2 cursor-pointer font-medium">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span>My NobleNet</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/me?tab=donations" className="flex items-center gap-2 cursor-pointer">
                          <Receipt className="w-4 h-4 text-neutral-500" />
                          <span>My Donations & Receipts</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/me?tab=wishlist" className="flex items-center gap-2 cursor-pointer">
                          <Package className="w-4 h-4 text-neutral-500" />
                          <span>My Wishlist Pledges</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/me?tab=volunteering" className="flex items-center gap-2 cursor-pointer">
                          <Clock className="w-4 h-4 text-neutral-500" />
                          <span>My Applications</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {user.role === 'NGO' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/organization" className="flex items-center gap-2 cursor-pointer font-semibold text-blue-700">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <span>Organization Hub</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/organization?tab=campaigns" className="flex items-center gap-2 cursor-pointer">
                          <Megaphone className="w-4 h-4 text-neutral-500" />
                          <span>Manage Campaigns</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/organization?tab=volunteers" className="flex items-center gap-2 cursor-pointer">
                          <Clock className="w-4 h-4 text-neutral-500" />
                          <span>Volunteer Applicants</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/organization?tab=wishlist" className="flex items-center gap-2 cursor-pointer">
                          <Package className="w-4 h-4 text-neutral-500" />
                          <span>Wishlist Items</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/organization?tab=donations" className="flex items-center gap-2 cursor-pointer">
                          <Receipt className="w-4 h-4 text-neutral-500" />
                          <span>Donations Received</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {user.role === 'SUPER_ADMIN' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer font-semibold text-purple-700">
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          <span>Administration Console</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin?tab=verification" className="flex items-center gap-2 cursor-pointer">
                          <FileCheck2 className="w-4 h-4 text-neutral-500" />
                          <span>NGO Verifications</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin?tab=refunds" className="flex items-center gap-2 cursor-pointer">
                          <RotateCcw className="w-4 h-4 text-neutral-500" />
                          <span>Refunds & Reversals</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin?tab=overview" className="flex items-center gap-2 cursor-pointer">
                          <History className="w-4 h-4 text-neutral-500" />
                          <span>System Audit Log</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4 text-neutral-500" />
                      <span>Account Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-600 focus:text-red-700 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                onClick={() => setAuthModalOpen(true)}
                className="font-semibold shadow-sm px-4 rounded-full cursor-pointer"
              >
                Join NobleNet
              </Button>
            )}

            {/* Mobile Hamburger Drawer Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden rounded-full cursor-pointer text-neutral-700"
                  aria-label="Open mobile navigation menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm p-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <SheetHeader className="text-left">
                    <SheetTitle className="flex items-center gap-2 text-primary font-bold text-xl">
                      <img src="/logo.png" alt="" className="h-8 w-auto mix-blend-multiply" />
                      NobleNet
                    </SheetTitle>
                  </SheetHeader>

                  {/* Mobile Search */}
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                      placeholder="Search causes, NGOs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-11 rounded-xl bg-neutral-100/80"
                    />
                  </form>

                  {/* Navigation Links */}
                  <nav className="flex flex-col gap-3" aria-label="Mobile Navigation Drawer">
                    <Link
                      to="/explore"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-100 font-medium text-neutral-800"
                    >
                      <Compass className="w-5 h-5 text-primary" />
                      <span>Explore Causes</span>
                    </Link>
                    <Link
                      to="/campaigns"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-100 font-medium text-neutral-800"
                    >
                      <Heart className="w-5 h-5 text-primary" />
                      <span>Campaigns</span>
                    </Link>
                    <Link
                      to="/ngos"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-100 font-medium text-neutral-800"
                    >
                      <Building2 className="w-5 h-5 text-primary" />
                      <span>Verified NGOs</span>
                    </Link>
                    <Link
                      to="/volunteers"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-100 font-medium text-neutral-800"
                    >
                      <Clock className="w-5 h-5 text-primary" />
                      <span>Volunteering</span>
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-100 font-medium text-neutral-800"
                    >
                      <Package className="w-5 h-5 text-primary" />
                      <span>Wishlist Items</span>
                    </Link>
                    <Link
                      to="/how-it-works"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-100 font-medium text-neutral-800"
                    >
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span>How It Works</span>
                    </Link>
                  </nav>
                </div>

                {/* Mobile Drawer Bottom Identity Section */}
                <div className="pt-6 border-t space-y-3">
                  {isAuthenticated && user ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm">{user.name}</div>
                          <div className="text-xs text-neutral-500">{user.email}</div>
                        </div>
                        <Badge variant="outline" className={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </div>
                      <Link
                        to={user.role === 'NGO' ? '/organization' : user.role === 'SUPER_ADMIN' ? '/admin' : '/me'}
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-white font-medium text-sm"
                      >
                        {user.role === 'NGO' ? (
                          <>
                            <Building2 className="w-4 h-4" /> Go to Organization Hub
                          </>
                        ) : user.role === 'SUPER_ADMIN' ? (
                          <>
                            <ShieldCheck className="w-4 h-4" /> Go to Admin Console
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" /> Go to My NobleNet
                          </>
                        )}
                      </Link>
                      <Button variant="outline" size="sm" className="w-full text-red-600" onClick={handleLogout}>
                        <LogOut className="w-4 h-4 mr-2" /> Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full h-12 rounded-xl font-bold text-base"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setAuthModalOpen(true);
                      }}
                    >
                      Join NobleNet
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* ─── Main Content Outlet ─── */}
      <main className="flex-1 pb-16 md:pb-0" id="main-content">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>

      {/* ─── Universal Footer ─── */}
      <footer className="border-t bg-white py-14 mt-auto">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-5 gap-10">
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="font-bold text-xl text-primary flex items-center gap-2">
              <img src="/logo.png" alt="" className="h-8 w-auto mix-blend-multiply" />
              <span className="text-neutral-900 font-extrabold text-xl">
                Noble<span className="text-primary">Net</span>
              </span>
            </Link>
            <p className="text-sm text-neutral-600 leading-relaxed max-w-sm">
              An intelligent, transparent ecosystem connecting compassionate individuals with verified grassroots NGOs across India.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% Tax Deductible (Section 80G Compliant)</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-neutral-900 mb-3 uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li>
                <Link to="/campaigns" className="hover:text-primary transition-colors">
                  Urgent Campaigns
                </Link>
              </li>
              <li>
                <Link to="/ngos" className="hover:text-primary transition-colors">
                  Verified NGOs
                </Link>
              </li>
              <li>
                <Link to="/volunteers" className="hover:text-primary transition-colors">
                  Volunteering
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-primary transition-colors">
                  Item Wishlists
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-neutral-900 mb-3 uppercase tracking-wider">Impact</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li>
                <Link to="/impact" className="hover:text-primary transition-colors">
                  Transparency Reports
                </Link>
              </li>
              <li>
                <Link to="/impact" className="hover:text-primary transition-colors">
                  Beneficiary Stories
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-primary transition-colors">
                  How NobleNet Works
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-neutral-900 mb-3 uppercase tracking-wider">Account</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              {isAuthenticated ? (
                <>
                  <li>
                    <Link
                      to={user?.role === 'NGO' ? '/organization' : user?.role === 'SUPER_ADMIN' ? '/admin' : '/me'}
                      className="hover:text-primary transition-colors font-medium"
                    >
                      {user?.role === 'NGO' ? 'Organization Hub' : user?.role === 'SUPER_ADMIN' ? 'Admin Console' : 'My NobleNet'}
                    </Link>
                  </li>
                  <li>
                    <Link to="/settings" className="hover:text-primary transition-colors">
                      Profile Settings
                    </Link>
                  </li>
                  <li>
                    <button onClick={handleLogout} className="hover:text-red-600 transition-colors text-left cursor-pointer">
                      Sign Out
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <button onClick={() => setAuthModalOpen(true)} className="hover:text-primary transition-colors cursor-pointer">
                      Sign In / Register
                    </button>
                  </li>
                  <li>
                    <Link to="/ngos" className="hover:text-primary transition-colors">
                      Register as an NGO
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>&copy; {new Date().getFullYear()} NobleNet Foundation. Built with transparency and care.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
            <a href="#" className="hover:underline">
              Terms of Service
            </a>
            <a href="#" className="hover:underline">
              Security & Verification
            </a>
          </div>
        </div>
      </footer>

      {/* ─── Mobile Bottom Navigation Bar (Hidden on Desktop) ─── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t px-2 py-1.5 flex justify-around items-center text-xs shadow-lg"
        aria-label="Mobile Bottom Navigation"
      >
        <NavLink
          to="/campaigns"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
              isActive ? 'text-primary font-bold' : 'text-neutral-500 hover:text-neutral-900'
            }`
          }
        >
          <Compass className="w-5 h-5" />
          <span>Explore</span>
        </NavLink>
        <NavLink
          to="/wishlist"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
              isActive ? 'text-primary font-bold' : 'text-neutral-500 hover:text-neutral-900'
            }`
          }
        >
          <Package className="w-5 h-5" />
          <span>Wishlist</span>
        </NavLink>
        <NavLink
          to="/volunteers"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
              isActive ? 'text-primary font-bold' : 'text-neutral-500 hover:text-neutral-900'
            }`
          }
        >
          <Clock className="w-5 h-5" />
          <span>Volunteer</span>
        </NavLink>
        <button
          type="button"
          onClick={handleMobileAccountClick}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
            (user?.role === 'NGO' && location.pathname.startsWith('/organization')) ||
            (user?.role === 'SUPER_ADMIN' && location.pathname.startsWith('/admin')) ||
            (user?.role === 'USER' && location.pathname === '/me')
              ? 'text-primary font-bold'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          {user?.role === 'NGO' ? (
            <Building2 className="w-5 h-5" />
          ) : user?.role === 'SUPER_ADMIN' ? (
            <ShieldCheck className="w-5 h-5" />
          ) : (
            <UserIcon className="w-5 h-5" />
          )}
          <span>
            {!isAuthenticated
              ? 'Sign In'
              : user?.role === 'NGO'
              ? 'Organization'
              : user?.role === 'SUPER_ADMIN'
              ? 'Admin'
              : 'My Impact'}
          </span>
        </button>
      </nav>

      {/* ─── Instant Quick Search Dialog ─── */}
      <Dialog open={searchModalOpen} onOpenChange={setSearchModalOpen}>
        <DialogContent className="sm:max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Search Causes & Organizations</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearchSubmit} className="space-y-4 pt-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input
                autoFocus
                placeholder="e.g. Flood relief, oxygen, cancer care, education..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 text-base rounded-xl"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs text-neutral-500 block w-full mb-1">Quick Categories:</span>
              {['Healthcare', 'Education', 'Disaster Relief', 'Hunger Relief', 'Environment'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSearchModalOpen(false);
                    navigate(`/campaigns?category=${encodeURIComponent(cat.toLowerCase())}`);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border bg-neutral-50 hover:bg-primary/5 hover:border-primary/40 transition-colors cursor-pointer font-medium"
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" className="gap-2">
                Search <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      {/* Dev-Only Demo Switcher */}
      {import.meta.env.DEV && <DemoSwitcher />}
    </div>
  );
}
