// import { Loader2 } from "lucide-react";

// export const LoadingSpinner = () => {
//   return (
//     <div className="flex justify-center items-center w-full h-full min-h-[200px]">
//       <Loader2 className="h-8 w-8 animate-spin text-primary" />
//     </div>
//   );
// };

"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function LoadingSpinner() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true);
      // Cambiar el título de la página para indicar carga
      document.title = "Cargando... | Brickapp";
    };

    const handleComplete = () => {
      setIsLoading(false);
      // Restaurar el título original (se establecerá en cada página)
    };

    // Al cambiar la ruta, mostrar el indicador de carga
    handleStart();
    
    // Cuando se complete la carga de la página, ocultar el indicador
    const timer = setTimeout(() => {
      handleComplete();
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 p-6 rounded-lg bg-white shadow-lg">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground">Cargando página...</p>
      </div>
    </div>
  );
}