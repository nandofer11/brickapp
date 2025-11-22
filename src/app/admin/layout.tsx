"use client";

import { getSession, signOut } from "next-auth/react";
import { Session } from "next-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const pathname = usePathname() ?? "";

  useEffect(() => {
    const verificarSesion = async () => {
      const ses = await getSession();
      setSession(ses);
      setLoading(false);

      if (!ses) {
        router.push("/auth");
      }
    };

    verificarSesion();
  }, []);

  if (loading) return <p className="text-center mt-4">Cargando sesión...</p>;
  if (!session) return null;

  return (
    <div className="[--header-height:calc(theme(spacing.14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset className="w-full overflow-x-hidden">
            {children}
          </SidebarInset>
          <Toaster />
        </div>
      </SidebarProvider>
    </div>
  );
}
