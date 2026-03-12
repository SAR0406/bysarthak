'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { LogOut, User as UserIcon, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export type PillNavItem = {
  label: string;
  href: string;
  ariaLabel?: string;
};

export interface PillNavProps {
  logo: string;
  logoAlt?: string;
  items: Readonly<PillNavItem[]>;
  activeHref?: string;
  className?: string;
  baseColor?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
}

const PillNav: React.FC<PillNavProps> = ({
  logo,
  items,
  activeHref,
  className = '',
  baseColor = 'hsl(var(--background))',
  pillColor = 'hsl(var(--foreground))',
  hoveredPillTextColor = 'hsl(var(--background))',
  pillTextColor,
}) => {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState(activeHref);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push('/');
    if(isMobileMenuOpen) setIsMobileMenuOpen(false);
  };
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState(activeHref);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLinkClick = (href: string) => (e: React.MouseEvent) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
        setActiveLink(href);
      }
    }
     if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const cssVars = {
    ['--base']: baseColor,
    ['--pill-bg']: pillColor,
    ['--hover-text']: hoveredPillTextColor,
    ['--pill-text']: resolvedPillTextColor,
  } as React.CSSProperties;


  return (
    <div
      className={cn("relative w-[95%] md:w-auto mx-auto", className)}
      style={cssVars}
    >
      <nav
        className="w-full md:w-max flex items-center justify-between md:justify-start box-border px-4 md:px-2 py-1.5 mx-auto rounded-full bg-background/40 backdrop-blur-xl border border-white/5 shadow-2xl"
        aria-label="Primary"
      >
        <Link
            href="/"
            aria-label="Home"
            onClick={handleLinkClick('/')}
            className="rounded-full p-1 inline-flex items-center justify-center overflow-hidden h-9 w-9 bg-[--pill-bg] text-[--pill-text] transition-transform duration-300 hover:rotate-12 hover:scale-110"
          >
            <span className="text-lg leading-none">{logo}</span>
        </Link>

        <div
          className="relative items-center rounded-full hidden md:flex ml-2 h-9 bg-[--base]/20 backdrop-blur-md"
        >
          <ul
            role="menubar"
            className="list-none flex items-stretch m-0 p-[3px] h-full gap-[3px]"
          >
            {items.map((item) => {
              const isActive = activeLink === item.href;

              return (
                <li key={item.href} role="none" className="flex h-full">
                  <Link
                      role="menuitem"
                      href={item.href}
                      className={cn("relative overflow-hidden inline-flex items-center justify-center h-full no-underline rounded-full box-border font-bold text-[12px] leading-none uppercase tracking-wider whitespace-nowrap cursor-pointer px-4 group transition-all duration-300",
                         isActive ? "bg-[--pill-bg] text-[--pill-text]" : "text-white/70 hover:text-white"
                      )}
                      aria-label={item.ariaLabel || item.label}
                       onClick={handleLinkClick(item.href)}
                    >
                      <span className="absolute inset-0 rounded-full bg-[--pill-bg] scale-0 transition-transform duration-300 ease-out group-hover:scale-100 z-[1]"></span>
                      <span className={cn("relative z-[2] transition-colors duration-300", !isActive && "group-hover:text-[--pill-text]")}>
                        {item.label}
                      </span>
                    </Link>
                </li>
              );
            })}
             {!isUserLoading && (
              <li role="none" className="flex h-full ml-1">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        role="menuitem"
                        aria-haspopup="true"
                        aria-label="User menu"
                        className="relative overflow-hidden inline-flex items-center justify-center h-full no-underline rounded-full box-border font-semibold text-[14px] leading-[0] uppercase tracking-[0.2px] whitespace-nowrap cursor-pointer px-3 bg-[--pill-bg] text-[--pill-text]"
                      >
                        <Avatar className="w-6 h-6 border-2 border-[--pill-text]/20">
                          <AvatarImage src={user.photoURL ?? undefined} />
                          <AvatarFallback>
                            <UserIcon className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-background/95 backdrop-blur-xl border-white/10">
                      <DropdownMenuLabel className="text-white/90">{user.email}</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem onClick={handleLogout} className="text-white/70 hover:text-white hover:bg-white/5 focus:bg-white/5">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link
                    href="/login"
                    className="relative overflow-hidden inline-flex items-center justify-center h-full no-underline rounded-full box-border font-bold text-[12px] leading-none uppercase tracking-wider whitespace-nowrap cursor-pointer px-4 bg-[--pill-bg] text-[--pill-text] group transition-all duration-300"
                  >
                    <span className="absolute inset-0 rounded-full bg-white/10 scale-0 transition-transform duration-300 ease-out group-hover:scale-100 z-[1]"></span>
                    <span className="relative z-[2]">Login</span>
                  </Link>
                )}
              </li>
            )}
          </ul>
        </div>

        <button
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
          className="md:hidden rounded-full border-0 flex flex-col items-center justify-center gap-1 cursor-pointer p-0 relative h-9 w-9 bg-[--pill-bg] transition-transform active:scale-95"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden absolute top-full mt-4 left-0 right-0 rounded-3xl shadow-2xl z-[998] origin-top bg-background/95 backdrop-blur-2xl border border-white/5 transition-all duration-500 cubic-bezier(0.23, 1, 0.32, 1)",
          isMobileMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4 pointer-events-none'
        )}
      >
        <ul className="list-none m-0 p-2 flex flex-col gap-2">
          {[...items, { label: user ? 'Logout' : 'Login', href: user ? '#' : '/login', ariaLabel: user ? 'Logout' : 'Login' }].map(item => {
             const isLogout = user && item.label === 'Logout';
            return (
              <li key={item.href}>
                 <Link
                    href={item.href}
                    className="block py-4 px-6 text-base font-bold rounded-2xl transition-all duration-300 text-white/70 bg-white/5 hover:bg-primary hover:text-primary-foreground text-center uppercase tracking-widest"
                    onClick={(e) => {
                      if (isLogout) {
                        e.preventDefault();
                        handleLogout();
                      }
                      handleLinkClick(item.href)(e)
                    }}
                  >
                    {item.label}
                  </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default PillNav;
