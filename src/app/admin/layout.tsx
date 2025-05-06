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

  // const user = session.user as CustomUser;

  // return (
  //   <div className="d-flex vh-100">
  //     {/* Sidebar */}
  //     <nav
  //       className={`sidebar p-3 bg-primary text-white d-flex flex-column vh-100 ${isSidebarOpen ? "d-block" : "d-none d-lg-flex"
  //         }`}
  //       style={{ width: "250px", position: "relative" }}
  //     >
  //       {/* Logo */}
  //       <div className="text-center mb-3">
  //         <Image src="/images/logo.png" alt="Logo" width={120} height={50} />
  //       </div>

  //       {/* Menú */}
  //       <ul className="nav flex-column flex-grow-1">
  //         <li className="nav-item">
  //           <Link href="/admin/venta"
  //             className="btn btn-success">
  //             Venta
  //           </Link>
  //         </li>
  //         <li className="nav-item">
  //           <Link
  //             href="/admin/dashboard"
  //             className={`nav-link text-white ${pathname === "/admin/dashboard" ? "active bg-dark rounded" : ""}`}
  //           >
  //             Dashboard
  //           </Link>
  //         </li>

  //         {/* Gestión (Menú desplegable) */}
  //         <li className="nav-item">
  //           <div className="accordion" id="gestionAccordion">
  //             <div className="accordion-item bg-primary border-0">
  //               <h2 className="accordion-header">
  //                 <button
  //                   className="accordion-button collapsed bg-primary text-white"
  //                   type="button"
  //                   data-bs-toggle="collapse"
  //                   data-bs-target="#gestionCollapse"
  //                   aria-expanded={pathname.includes("/admin/gestion") ? "true" : "false"}
  //                 >
  //                   Gestión
  //                 </button>
  //               </h2>
  //               <div
  //                 id="gestionCollapse"
  //                 className={`accordion-collapse collapse ${pathname.includes("/admin/gestion") ? "show" : ""}`}
  //               >
  //                 <div className="accordion-body p-0">
  //                   <Link
  //                     href="/admin/gestion/personal"
  //                     className={`nav-link text-white ps-4 ${pathname === "/admin/gestion/personal" ? "active bg-dark rounded" : ""}`}
  //                   >
  //                     Gestión de Personal
  //                   </Link>
  //                   <Link
  //                     href="/admin/gestion/usuarios"
  //                     className={`nav-link text-white ps-4 ${pathname === "/admin/gestion/usuarios" ? "active bg-dark rounded" : ""}`}
  //                   >
  //                     Gestión de Usuarios
  //                   </Link>
  //                   <Link
  //                     href="/admin/gestion/productos"
  //                     className={`nav-link text-white ps-4 ${pathname === "/admin/gestion/productos" ? "active bg-dark rounded" : ""}`}
  //                   >
  //                     Gestión de Productos
  //                   </Link>
  //                 </div>
  //               </div>
  //             </div>
  //           </div>
  //         </li>

  //         <li className="nav-item">
  //           <Link href="/admin/asistencia" className={`nav-link text-white ${pathname === "/admin/asistencia" ? "active bg-dark rounded" : ""}`}>
  //             Asistencia
  //           </Link>
  //         </li>

  //         <li className="nav-item">
  //           <Link href="/admin/movimientos" className={`nav-link text-white ${pathname === "/admin/movimientos" ? "active bg-dark rounded" : ""}`}>
  //             Movimientos
  //           </Link>
  //         </li>

  //         <li className="nav-item">
  //           <Link href="/admin/produccion" className={`nav-link text-white ${pathname === "/admin/produccion" ? "active bg-dark rounded" : ""}`}>
  //             Producción
  //           </Link>
  //         </li>

  //         <li className="nav-item">
  //           <Link href="/admin/pagos-personal" className={`nav-link text-white ${pathname === "/admin/pagos-personal" ? "active bg-dark rounded" : ""}`}>
  //             Pagos Personal
  //           </Link>
  //         </li>
  //       </ul>

  //       {/* Footer con versión */}
  //       <div className="mt-auto border-top pt-2 text-center text-white">Brickapp 1.0</div>
  //     </nav>

  //     {/* Contenido principal */}
  //     <div className="flex-grow-1">
  //       {/* Topbar */}
  //       <div className="topbar bg-light d-flex justify-content-between align-items-center p-3 border-bottom shadow-sm">
  //         {/* Botón hamburguesa solo en móviles */}
  //         <button className="btn btn-dark d-lg-none" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
  //           <FontAwesomeIcon icon={faBars} />
  //         </button>

  //         {/* Usuario info */}
  //         <div className="d-none d-md-block">
  //           <p className="mb-0">
  //             <strong>Usuario:</strong> {user.name}
  //           </p>
  //           <div className="d-flex">
  //             <p className="mb-0">
  //               <strong>Empresa:</strong> {user.razon_social}
  //             </p>
  //             <p className="mb-0 ms-2">
  //               <strong>Rol:</strong> {user.rol}
  //             </p>
  //           </div>
  //         </div>

  //         {/* Menú desplegable en móviles */}
  //         <div className="d-md-none">
  //           <button className="btn btn-dark" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
  //             <FontAwesomeIcon icon={faEllipsisV} />
  //           </button>
  //           {isDropdownOpen && (
  //             <div className="dropdown-menu dropdown-menu-end show position-absolute mt-2">
  //               <div className="dropdown-item-text">
  //                 <p className="mb-1">
  //                   <strong>Usuario:</strong> {user.name}
  //                 </p>
  //                 <p className="mb-1">
  //                   <strong>Empresa:</strong> {user.razon_social}
  //                 </p>
  //                 <p className="mb-2">
  //                   <strong>Rol:</strong> {user.rol}
  //                 </p>
  //               </div>
  //               <div className="dropdown-divider"></div>
  //               <button className="dropdown-item text-danger" onClick={() => signOut({ callbackUrl: "/auth" })}>
  //                 <FontAwesomeIcon icon={faSignOutAlt} /> Cerrar Sesión
  //               </button>
  //             </div>
  //           )}
  //         </div>

  //         {/* Botón de cerrar sesión en pantallas grandes */}
  //         <button className="btn btn-danger btn-sm d-none d-md-block" onClick={() => signOut({ callbackUrl: "/auth" })}>
  //           <FontAwesomeIcon icon={faSignOutAlt} /> Cerrar Sesión
  //         </button>
  //       </div>

  //       {/* Contenido dinámico */}
  //       <div className="p-3">{children}</div>
  //     </div>
  //   </div >
  // );

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
