'use client';

import Link from 'next/link';
import { ChevronDown, User, Search } from 'lucide-react';
import type { Session } from 'next-auth';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from './theme-toggle';

export interface MenuItem {
  type: 'link' | 'action' | 'separator' | 'custom';
  icon?: LucideIcon;
  label?: string;
  href?: string;
  onClick?: () => void;
  shortcut?: string;
  component?: React.ReactNode;
  className?: string;
}

interface UserMenuProps {
  session: Session | null;
  menuItems?: MenuItem[];
  showThemeSelector?: boolean;
  showCommandPalette?: boolean;
  width?: string;
  align?: "start" | "center" | "end";
  buttonClassName?: string;
}

export function UserMenu({
  session,
  menuItems = [],
  showThemeSelector = true,
  showCommandPalette = true,
  width = "w-56",
  align = "end",
  buttonClassName = "h-9 min-h-9 max-h-9 px-2",
}: UserMenuProps) {
  const triggerCommandPalette = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true
    });
    document.dispatchEvent(event);
  };

  if (!session) {
    return (
      <Button variant="outline" asChild className={buttonClassName}>
        <Link href="/login">
          <User className="size-4 mr-2" />
          Sign In
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={buttonClassName}
        >
          <Avatar className="size-4 mr-2">
            <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
            <AvatarFallback className="text-xs">
              {session.user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{session.user?.name || 'User'}</span>
          <ChevronDown className="size-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={width} align={align} forceMount>
        {/* User Info Section */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {session.user?.name}
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm leading-none text-muted-foreground truncate min-w-0 flex-1">
                {session.user?.email}
              </p>
              {showThemeSelector && <ThemeToggle />}
            </div>
          </div>
        </DropdownMenuLabel>

        {/* Menu Items Section */}
        {(showCommandPalette || menuItems.length > 0) && <DropdownMenuSeparator />}
        
        {/* Custom Menu Items */}
        {menuItems.map((item, index) => {
          if (item.type === 'separator') {
            return <DropdownMenuSeparator key={index} />;
          }

          if (item.type === 'custom') {
            return <div key={index}>{item.component}</div>;
          }

          if (item.type === 'link') {
            return (
              <DropdownMenuItem key={index} asChild>
                <Link href={item.href || '#'} className={`flex items-center gap-2 ${item.className || ''}`}>
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <span className="ml-auto text-xs text-muted-foreground">{item.shortcut}</span>
                  )}
                </Link>
              </DropdownMenuItem>
            );
          }

          if (item.type === 'action') {
            return (
              <DropdownMenuItem 
                key={index}
                onClick={item.onClick}
                className={`flex items-center gap-2 ${item.className || ''}`}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.label}</span>
                {item.shortcut && (
                  <span className="ml-auto text-xs text-muted-foreground">{item.shortcut}</span>
                )}
              </DropdownMenuItem>
            );
          }

          return null;
        })}
        {/* Menu Items Section */}
        {(showCommandPalette || menuItems.length > 0) && <DropdownMenuSeparator />}
        
        {/* Command Palette */}
        {showCommandPalette && (
          <DropdownMenuItem 
            onClick={triggerCommandPalette}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            <span>Command Palette</span>
            <span className="ml-auto text-xs text-muted-foreground">⌘K</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
