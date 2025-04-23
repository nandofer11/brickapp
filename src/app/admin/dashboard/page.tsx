"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { WorkWeekModal } from "../../../components/work-week-modal";

const formSchema = z
  .object({
    fecha_inicio: z.date({ required_error: "La fecha de inicio es requerida" }),
    fecha_fin: z.date({ required_error: "La fecha de fin es requerida" }),
  })
  .refine((data) => data.fecha_fin >= data.fecha_inicio, {
    message: "La fecha de fin debe ser posterior a la de inicio.",
    path: ["fecha_fin"],
  });

export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Bienvenido</h1>
          <p className="text-muted-foreground">Gestione su semana laboral y vea los registros existentes.</p>
          <div className="flex items-center gap-4">
            <Button onClick={() => setIsModalOpen(true)}>Semana Laboral</Button>
          </div>
        </div>

        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
        </div>
        <div className="flex-1 rounded-xl bg-muted/50 p-6 md:min-h-[400px]">
          <h2 className="text-xl font-semibold mb-4">Resumen</h2>
          <p className="text-muted-foreground">Aquí se mostrará un resumen de su actividad reciente.</p>
        </div>
      </div>
      <WorkWeekModal open={isModalOpen} onOpenChange={setIsModalOpen} />

    </>
  )
}
