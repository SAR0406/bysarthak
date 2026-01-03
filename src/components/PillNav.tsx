'use client';

import React, { useState } from 'react';
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
import { LogOut, User as UserIcon } from 'lucide-react';
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

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push('/');
    if(isMobileMenuOpen) toggleMobileMenu();
  };
  
  const resolvedPillTextColor = pillTextColor ?? baseColor;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState(activeHref);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const handleLinkClick = (href:string) => (e: React.MouseEvent) => {
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
      toggleMobileMenu();
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
        className="w-full md:w-max flex items-center justify-between md:justify-start box-border px-4 md:px-2 py-1.5 mx-auto rounded-full"
        aria-label="Primary"
      >
        <Link
            href={items?.[0]?.href || '/'}
            aria-label="Home"
            onClick={handleLinkClick(items?.[0]?.href || '/')}
            className="rounded-full p-1 inline-flex items-center justify-center overflow-hidden h-9 w-9 bg-[--pill-bg] text-[--pill-text] transition-transform duration-300 hover:rotate-12"
          >
            <span className="text-lg leading-none">{logo}</span>
        </Link>

        <div
          className="relative items-center rounded-full hidden md:flex ml-2 h-9 bg-[--base]"
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
                      className={cn("relative overflow-hidden inline-flex items-center justify-center h-full no-underline rounded-full box-border font-semibold text-[14px] leading-none uppercase tracking-[0.2px] whitespace-nowrap cursor-pointer px-3 group",
                         "bg-[--pill-bg] text-[--pill-text]"
                      )}
                      aria-label={item.ariaLabel || item.label}
                       onClick={handleLinkClick(item.href)}
                    >
                      <span className="absolute inset-0 rounded-full bg-[--base] scale-0 transition-transform duration-300 ease-in-out group-hover:scale-100 z-[1]"></span>
                      <span className="relative z-[2] transition-colors duration-300 group-hover:text-[--hover-text]">
                        {item.label}
                      </span>
                      {isActive && (
                        <span
                          className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-1.5 h-1.5 rounded-full z-[4] bg-[--pill-bg]"
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                </li>
              );
            })}
             {!isUserLoading && (
              <li role="none" className="flex h-full">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="relative overflow-hidden inline-flex items-center justify-center h-full no-underline rounded-full box-border font-semibold text-[14px] leading-[0] uppercase tracking-[0.2px] whitespace-nowrap cursor-pointer px-3 bg-[--pill-bg] text-[--pill-text]"
                      >
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={user.photoURL ?? undefined} />
                          <AvatarFallback>
                            <UserIcon className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link
                    href="/login"
                    className="relative overflow-hidden inline-flex items-center justify-center h-full no-underline rounded-full box-border font-semibold text-[14px] leading-none uppercase tracking-[0.2px] whitespace-nowrap cursor-pointer px-3 bg-[--pill-bg] text-[--pill-text] group"
                  >
                    <span className="absolute inset-0 rounded-full bg-[--base] scale-0 transition-transform duration-300 ease-in-out group-hover:scale-100 z-[1]"></span>
                    <span className="relative z-[2] transition-colors duration-300 group-hover:text-[--hover-text]">Login</span>
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
          className="md:hidden rounded-full border-0 flex flex-col items-center justify-center gap-1 cursor-pointer p-0 relative h-9 w-9 bg-[--pill-bg]"
        >
          <span
            className={cn("w-4 h-0.5 rounded origin-center transition-all duration-300 ease-in-out bg-[--pill-text]", isMobileMenuOpen && "rotate-45 translate-y-0.5")}
          />
          <span
            className={cn("w-4 h-0.5 rounded origin-center transition-all duration-300 ease-in-out bg-[--pill-text]", isMobileMenuOpen ? "-rotate-45 -translate-y-0.5" : "mt-0.5")}
          />
        </button>
      </nav>

      <div
        className={cn(
          "md:hidden absolute top-full mt-2 left-0 right-0 rounded-2xl shadow-lg z-[998] origin-top bg-background transition-all duration-300 ease-in-out",
          isMobileMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        )}
      >
        <ul className="list-none m-0 p-1 flex flex-col gap-1">
          {[...items, { label: user ? 'Logout' : 'Login', href: user ? '#' : '/login', ariaLabel: user ? 'Logout' : 'Login' }].map(item => {
             const isLogout = user && item.label === 'Logout';
            return (
              <li key={item.href}>
                 <Link
                    href={item.href}
                    className="block py-3 px-4 text-base font-medium rounded-full transition-colors duration-200 text-foreground bg-secondary hover:bg-primary hover:text-primary-foreground text-center"
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
