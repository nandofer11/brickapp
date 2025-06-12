"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { LoadingSpinner } from "@/components/loading-spinner";
import { Toaster } from "@/components/ui/sonner"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!session && status !== "loading") {
      router.push("/auth");
    }
  }, [session, status, router]);

  // Manejar estados de navegación
  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    const handleRouteChange = () => {
      handleStart();
      setTimeout(() => handleComplete(), 500); // Simulate loading completion
    };

    router.prefetch(pathname); // Prefetch the current route
    handleRouteChange();

    return () => {
      handleComplete();
    };
  }, [router, pathname]);

  if (status === "loading") return <p className="text-center mt-4">Cargando sesión...</p>;
  if (!session) return null;

  return (
    <div className="[--header-height:calc(theme(spacing.14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset className="w-full overflow-x-hidden">
            {isLoading ? <LoadingSpinner /> : children}
          </SidebarInset>
          <Toaster />
        </div>
      </SidebarProvider>
    </div>
  )
}
