'use client';

import { ChevronUp, Moon, Sun, User as UserIcon, Search } from 'lucide-react';
import Image from 'next/image';
import type { User } from 'next-auth';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { toast } from './toast';
import { LoaderIcon, MessageIcon, FileIcon } from './icons';
import { guestRegex } from '@/lib/constants';
import { useChatLayout } from '@/hooks/use-chat-layout';

export function SidebarUserNav({ user }: { user: User }) {
  const router = useRouter();
  const { data, status } = useSession();
  const { setTheme, theme } = useTheme();
  const { layout, setLayout } = useChatLayout();

  const isGuest = guestRegex.test(data?.user?.email ?? '');

  const triggerCommandPalette = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true
    });
    document.dispatchEvent(event);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {status === 'loading' ? (
              <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10 justify-between">
                <div className="flex flex-row gap-2">
                  <div className="size-6 bg-zinc-500/30 rounded-full animate-pulse" />
                  <span className="bg-zinc-500/30 text-transparent rounded-md animate-pulse">
                    Loading auth status
                  </span>
                </div>
                <div className="animate-spin text-zinc-500">
                  <LoaderIcon />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                data-testid="user-nav-button"
                className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10"
              >
                <Avatar className="size-6">
                  <AvatarImage 
                    src={`https://avatar.vercel.sh/${user.email}`} 
                    alt={user.email ?? 'User Avatar'} 
                  />
                  <AvatarFallback className="text-xs">
                    {isGuest ? 'G' : (user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start min-w-0 flex-1">
                  {!isGuest && user?.name && (
                    <span className="text-sm font-medium truncate">
                      {user.name}
                    </span>
                  )}
                  <span data-testid="user-email" className="text-xs text-muted-foreground truncate">
                    {isGuest ? 'Guest' : user?.email}
                  </span>
                </div>
                <ChevronUp className="ml-auto size-4" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            data-testid="user-nav-menu"
            side="top"
            className="w-56"
          >
            {/* User Info Section */}
            {!isGuest && (
              <>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name}
                    </p>
                    <p className="text-sm leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Theme & Layout Toggles */}
            <div className="p-2 space-y-2">
            <div className="text-xs text-muted-foreground font-medium">Layout</div>
              <Tabs value={layout} onValueChange={(value) => setLayout(value as 'bubble' | 'wide')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="bubble" className="text-xs">
                    <MessageIcon size={14} />
                  </TabsTrigger>
                  <TabsTrigger value="wide" className="text-xs">
                    <FileIcon size={14} />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="text-xs text-muted-foreground font-medium">Theme</div>
              <Tabs value={theme} onValueChange={setTheme}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="light" className="text-xs">
                    <Sun className="size-4" />
                  </TabsTrigger>
                  <TabsTrigger value="dark" className="text-xs">
                    <Moon className="size-4" />
                  </TabsTrigger>
                  <TabsTrigger value="system" className="text-xs">
                    <UserIcon className="size-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
           
            </div>

            <DropdownMenuSeparator />

            {/* Command Palette */}
            <DropdownMenuItem 
              onClick={triggerCommandPalette}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              <span>Command Palette</span>
              <span className="ml-auto text-xs text-muted-foreground">⌘K</span>
            </DropdownMenuItem>



            {/* Authentication */}
            <DropdownMenuItem asChild data-testid="user-nav-item-auth">
              <button
                type="button"
                className="w-full cursor-pointer"
                onClick={() => {
                  if (status === 'loading') {
                    toast({
                      type: 'error',
                      description:
                        'Checking authentication status, please try again!',
                    });

                    return;
                  }

                  if (isGuest) {
                    router.push('/login');
                  } else {
                    signOut({
                      redirectTo: '/',
                    });
                  }
                }}
              >
                {isGuest ? 'Login to your account' : 'Sign out'}
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
