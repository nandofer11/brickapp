import Link from "next/link"
import { ChevronRight, type LucideIcon } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
      isActive?: boolean
    }[]
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) =>
          // Verificar si realmente tiene submenús (no arrays vacíos)
          (item.items && item.items.length > 0) ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className={item.isActive ? "bg-primary/80 text-white hover:bg-primary/30" : ""}>
                    {item.icon && <item.icon className={item.isActive ? "text-white" : ""} />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton 
                          asChild
                          className={subItem.isActive ? "bg-primary/10 text-primary font-medium" : ""}
                        >
                          <Link 
                            href={subItem.url}
                            prefetch={true}
                          >
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            // 🟢 Aquí renderizamos los items sin submenús como links normales
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link 
                  prefetch={true} 
                  href={item.url} 
                  className={`flex items-center gap-2 w-full ${item.isActive ? "bg-primary/80 text-white hover:bg-primary/30" : ""}`}
                >
                  {item.icon && <item.icon className={item.isActive ? "text-white" : ""} />}
                  <span className={item.isActive ? "text-white" : ""}>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
