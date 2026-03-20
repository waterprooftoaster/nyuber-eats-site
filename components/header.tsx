//components/header.tsx
"use client"

import Link from "next/link"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

export function Header() {
  const isMobile = useIsMobile();
  return (
    <header className="flex items-center justify-between bg-background top-0 left-0 right-0 p-6 pl-10 z-100">
      <NavigationMenu viewport={isMobile}>
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/account">Account</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenu>

      <NavigationMenu viewport={isMobile}>
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/auth/login">Sign In</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/auth/login">Create Account</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenu>
    </header>
  )
}
