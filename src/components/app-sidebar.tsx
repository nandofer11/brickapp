"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  DollarSign
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { title } from "process"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Inicio",
      url: "/admin/dashboard",
      icon: PieChart,
    },
    {
      title: "Venta",
      url: "/admin/venta",
      icon: PieChart,
    },
    {
      title: "Gestión",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Personal",
          url: "/admin/gestion/personal",
        },
         {
          title: "Usuarios",
          url: "/admin/gestion/usuarios",
        },
        {
          title: "Productos",
          url: "/admin/gestion/productos",
        },
        {
          title: "Clientes",
          url: "/admin/gestion/clientes",
        },        
      ],
    },
    {
      title: "Asistencia",
      url: "/admin/asistencia/",
      icon: LifeBuoy,
      items: [],
    },
    {
      title: "Producción",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Cocción",
          url: "/admin/produccion/coccion",
        },
        {
          title: "Fabricación",
          url: "/admin/produccion/fabricacion",
        },
      ],
    },
    {
      title: "Pagos",
      url: "#",
      icon: DollarSign,
      items: [
        {
          title: "Pago Personal",
          url: "/admin/pagos/personal",
        },
      ],
    },
  ],
  // navSecondary: [
  //   {
  //     title: "Support",
  //     url: "#",
  //     icon: LifeBuoy,
  //   },
  //   {
  //     title: "Feedback",
  //     url: "#",
  //     icon: Send,
  //   },
  // ],
  // projects: [
  //   {
  //     name: "Design Engineering",
  //     url: "#",
  //     icon: Frame,
  //   },
  //   {
  //     name: "Sales & Marketing",
  //     url: "#",
  //     icon: PieChart,
  //   },
  //   {
  //     name: "Travel",
  //     url: "#",
  //     icon: Map,
  //   },
  // ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Brickapp</span>
                  <span className="truncate text-xs">Soft ladrilleras</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
