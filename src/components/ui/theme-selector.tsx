'use client'

import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useThemeHook } from '@/hooks/use-theme'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const themes = [
  {
    name: 'light',
    label: 'Clair',
    icon: Sun,
  },
  {
    name: 'dark',
    label: 'Sombre',
    icon: Moon,
  },
  {
    name: 'system',
    label: 'Système',
    icon: Monitor,
  },
]

export function ThemeSelector() {
  const { theme, setTheme, mounted } = useThemeHook()

  if (!mounted) {
    return (
      <Button variant="outline" className="w-full justify-start">
        <Sun className="mr-2 h-4 w-4" />
        Sélectionner un thème
      </Button>
    )
  }

  const currentTheme = themes.find((t) => t.name === theme) || themes[2]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <currentTheme.icon className="mr-2 h-4 w-4" />
          {currentTheme.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.name}
            onClick={() => setTheme(themeOption.name)}
            className="cursor-pointer"
          >
            <themeOption.icon className="mr-2 h-4 w-4" />
            <span>{themeOption.label}</span>
            {theme === themeOption.name && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
