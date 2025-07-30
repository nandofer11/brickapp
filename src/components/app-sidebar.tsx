"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Command,
  LifeBuoy,
  PieChart,
  Settings2,
  DollarSign,
  Settings
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
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
      url: "/admin/asistencia",
      icon: LifeBuoy,
      items: [], // Agregamos un array vacío para consistencia
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
    {
      title: "Reportes",
      url: "#",
      icon: DollarSign,
      items: [
        {
          title: "Reporte Asistencia",
          url: "/admin/reportes/asistencia",
        },
      ],
    },
     {
      title: "Configuración",
      url: "/admin/configuracion",
      icon: Settings,
      items: [], // Agregamos un array vacío para consistencia
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
  const pathname = usePathname();

  // Función para determinar si un elemento del menú está activo
  const isMenuItemActive = (item: { url: string; items?: { url: string }[] }) => {
    // Función auxiliar para normalizar URLs (quitar barra final si existe)
    const normalizeUrl = (url: string) => url.endsWith('/') ? url.slice(0, -1) : url;
    
    // Normalizar URLs para comparación
    const currentPath = pathname ? normalizeUrl(pathname) : '';
    const itemUrl = normalizeUrl(item.url);
    
    // Determinar si el ítem tiene submenús reales (no arrays vacíos)
    const hasSubMenus = item.items && item.items.length > 0;
    
    // Si la URL coincide exactamente (después de normalizar)
    if (currentPath === itemUrl) return true;
    
    // Para elementos con URL directa (no placeholder "#")
    if (item.url !== "#") {
      // Si la ruta actual comienza con la URL del ítem, está activo
      if (currentPath && currentPath.startsWith(itemUrl)) return true;
    }
    
    // Para elementos con submenús, verificar si alguno de los subítems está activo
    if (hasSubMenus && item.items?.some(subItem => {
      const normalizedSubUrl = normalizeUrl(subItem.url);
      return currentPath && currentPath.startsWith(normalizedSubUrl);
    })) return true;
    
    return false;
  };
  
  // Para depuración - ver la ruta actual
  console.log("Ruta actual:", pathname);

  // Marcar los elementos activos basados en la ruta actual
  const navMainWithActive = data.navMain.map(item => {
    // Determinar si realmente tiene submenús (no array vacíos)
    const hasSubMenus = item.items && item.items.length > 0;
    
    // Función auxiliar para normalizar URLs (igual que en isMenuItemActive)
    const normalizeUrl = (url: string) => url.endsWith('/') ? url.slice(0, -1) : url;
    const currentPath = pathname ? normalizeUrl(pathname) : '';
    
    return {
      ...item,
      // Si tiene array vacío, tratarlo como sin submenú para evaluación de isActive
      isActive: isMenuItemActive(item),
      
      // Si tiene subitems, verificar cuál está activo
      items: hasSubMenus ? item.items.map(subItem => ({
        ...subItem,
        isActive: currentPath ? currentPath.startsWith(normalizeUrl(subItem.url)) : false
      })) : item.items
    };
  });
  
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
        <NavMain items={navMainWithActive} />
        {/* <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
