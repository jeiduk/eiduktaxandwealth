import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { 
  LayoutDashboard, 
  Users, 
  Settings,
  LogOut,
  Menu,
  X,
  Calculator,
  FileText,
  BookOpen,
  ExternalLink,
  Download
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  showBadge?: boolean;
  external?: boolean;
}

const dashboardNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users, showBadge: true },
];

const toolsNavItems: NavItem[] = [
  { href: '/reasonable-comp', label: 'Reasonable Comp', icon: FileText },
  { href: 'https://tools.eiduktaxandwealth.com', label: 'Calculators', icon: Calculator, external: true },
  { href: '/downloads', label: 'Downloads', icon: Download },
  { href: '/strategies', label: 'Strategy Library', icon: BookOpen },
];

const settingsNavItems: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clientCount, setClientCount] = useState(0);
  const [profile, setProfile] = useState<{ full_name: string | null; title: string | null }>({
    full_name: null,
    title: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      // Fetch client count
      const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });
      setClientCount(count || 0);
      
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, title')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profileData) {
        setProfile({
          full_name: profileData.full_name,
          title: profileData.title,
        });
      }
    };
    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  const NavItemComponent = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => {
    const active = isActive(item.href);
    
    if (item.external) {
      return (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
          className={cn(
            'flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
            'text-white/70 hover:bg-white/10 hover:text-white'
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-5 w-5" />
            {item.label}
          </div>
          <ExternalLink className="h-3.5 w-3.5 opacity-50" />
        </a>
      );
    }

    return (
      <Link
        to={item.href}
        onClick={onClick}
        className={cn(
          'flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
          active
            ? 'bg-blue-600 text-white'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        )}
      >
        <div className="flex items-center gap-3">
          <item.icon className="h-5 w-5" />
          {item.label}
        </div>
        {item.showBadge && clientCount > 0 && (
          <Badge className="bg-amber-500 text-white text-xs px-1.5 py-0.5 h-5 min-w-[20px] flex items-center justify-center">
            {clientCount}
          </Badge>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[260px] lg:fixed lg:inset-y-0 bg-gradient-to-b from-[#1e3a5f] to-[#152d4a]">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <Link to="/dashboard" className="block">
            <h1 className="font-display text-xl font-semibold text-white">
              Eiduk Tax & Wealth
            </h1>
            <p className="text-amber-400 text-xs mt-1 tracking-wide">
              Pay Less. Keep More. Build Wealth.
            </p>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          {/* Dashboard Section */}
          <div>
            <p className="px-4 text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
              Dashboard
            </p>
            <div className="space-y-1">
              {dashboardNavItems.map((item) => (
                <NavItemComponent key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* Tools Section */}
          <div>
            <p className="px-4 text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
              Tools
            </p>
            <div className="space-y-1">
              {toolsNavItems.map((item) => (
                <NavItemComponent key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* Settings Section */}
          <div>
            <p className="px-4 text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
              Settings
            </p>
            <div className="space-y-1">
              {settingsNavItems.map((item) => (
                <NavItemComponent key={item.href} item={item} />
              ))}
            </div>
          </div>
        </nav>

        {/* Footer - User Info */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-semibold text-sm">
              {profile.full_name 
                ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile.full_name || user?.email || 'User'}
              </p>
              {profile.title && (
                <p className="text-xs text-white/50 truncate">
                  {profile.title}
                </p>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white/50 hover:text-white hover:bg-white/10"
              onClick={handleSignOut}
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1e3a5f] to-[#152d4a]">
        <div className="flex items-center justify-between h-16 px-4">
          <Link to="/dashboard" className="font-display font-semibold text-white">
            Eiduk Tax & Wealth
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white p-2"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-gradient-to-b from-[#1e3a5f] to-[#152d4a] border-t border-white/10 px-4 py-4 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div>
              <p className="px-4 text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                Dashboard
              </p>
              <div className="space-y-1">
                {dashboardNavItems.map((item) => (
                  <NavItemComponent key={item.href} item={item} onClick={() => setMobileMenuOpen(false)} />
                ))}
              </div>
            </div>
            
            <div className="pt-2 border-t border-white/10">
              <p className="px-4 text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                Tools
              </p>
              {toolsNavItems.map((item) => (
                <NavItemComponent key={item.href} item={item} onClick={() => setMobileMenuOpen(false)} />
              ))}
            </div>

            <div className="pt-2 border-t border-white/10">
              {settingsNavItems.map((item) => (
                <NavItemComponent key={item.href} item={item} onClick={() => setMobileMenuOpen(false)} />
              ))}
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[260px] pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
