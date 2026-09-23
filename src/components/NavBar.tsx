import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, Sparkles, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/generate', label: 'Generate', icon: Sparkles },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/history', label: 'History', icon: History },
  { to: '/profile', label: 'Profile', icon: User },
];

export function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 py-2">
        {links.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-medium',
                  isActive
                    ? 'text-brand-700'
                    : 'text-slate-500 hover:text-slate-800',
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
