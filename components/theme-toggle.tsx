"use client"

import * as React from "react"
import { Moon, Sun, Palette } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const themes = [
  {
    name: "Default",
    light: "default-light",
    dark: "default-dark",
  },
  {
    name: "T3 Chat",
    light: "t3chat-light", 
    dark: "t3chat-dark",
  },
  {
    name: "Claude",
    light: "claude-light",
    dark: "claude-dark", 
  },
  {
    name: "Mocha Mousse",
    light: "mocha-light",
    dark: "mocha-dark",
  },
  {
    name: "Tangerine",
    light: "tangerine-light",
    dark: "tangerine-dark",
  },
]

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="size-10 px-0">
          <Sun className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent  className="w-56">
        <DropdownMenuLabel>Theme Selection</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {themes.map((themeGroup) => (
          <React.Fragment key={themeGroup.name}>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
              {themeGroup.name}
            </DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={() => setTheme(themeGroup.light)}
              className="pl-4"
            >
              <Sun className="mr-2 h-4 w-4" />
              {themeGroup.name} Light
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setTheme(themeGroup.dark)}
              className="pl-4"
            >
              <Moon className="mr-2 h-4 w-4" />
              {themeGroup.name} Dark
            </DropdownMenuItem>
          </React.Fragment>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Palette className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
