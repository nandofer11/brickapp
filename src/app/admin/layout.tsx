"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faEllipsisV, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { Toaster } from "@/components/ui/sonner"

interface CustomUser {
  id: string;
  name: string;
  usuario: string;
  id_empresa: string;
  rol: string;
  razon_social: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!session && status !== "loading") {
      router.push("/auth");
    }
  }, [session, status, router]);

  if (status === "loading") return <p className="text-center mt-4">Cargando sesión...</p>;
  if (!session) return null;

  return (
    <div className="[--header-height:calc(theme(spacing.14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            {children}
          </SidebarInset>
          <Toaster />
        </div>
      </SidebarProvider>
    </div>
  )
}
