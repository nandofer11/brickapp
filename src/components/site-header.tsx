"use client"

import { SidebarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import { Label } from "@/components/ui/label"
import { useAuthContext } from "@/context/AuthContext"

import { ModeToggle } from '@/components/mode-toggle'


export function SiteHeader() {
  const { toggleSidebar } = useSidebar()
  const { empresa } = useAuthContext()

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />

        <Label>Empresa:</Label>
        <Label>{empresa?.razon_social}</Label>
        {/* <SearchForm className="w-full sm:ml-auto sm:w-auto" /> */}
        <ModeToggle></ModeToggle>
      </div>
    </header>
  )
}
