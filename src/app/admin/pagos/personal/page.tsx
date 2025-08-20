"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { PlusCircle, Loader2, DollarSign, ClipboardList, Edit, Trash2, AlertTriangle, Eye, CreditCard, Check, AlertCircle, Printer } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

// Estilos inline para impresión térmica
const thermalPrintStyles = `
@media print {
  /* Configuración general para ticket térmico */
  body {
    font-family: Arial, Helvetica, sans-serif !important;
    font-size: 8pt !important;
    width: 80mm !important;
    margin: 0 auto !important;
    padding: 2mm 0 !important; /* Reducido de 4mm a 2mm */
  }
  
  /* Contenedor principal con márgenes laterales */
  .flex.flex-col.text-\\[11px\\] {
    padding-left: 6mm !important; /* Reducido de 8mm a 6mm */
    padding-right: 6mm !important; /* Reducido de 8mm a 6mm */
    padding-top: 2mm !important; /* Reducido de 4mm a 2mm */
  }
  
  /* Hacer todas las líneas continuas, delgadas y bien visibles */
  .border-t, .border-b, .border-dashed, .border-gray-500, .border-gray-300, .border-gray-100 {
    border-color: #555 !important;
    border-width: 0.5px !important;
    border-style: solid !important;
  }
  
  /* Asegurar que las líneas divisorias sean visibles pero con menor margen */
  .my-1.border-t.border-dashed {
    border-top: 0.5px solid #555 !important;
    margin-top: 1mm !important; /* Reducido de 2mm a 1mm */
    margin-bottom: 1mm !important; /* Reducido de 2mm a 1mm */
    display: block !important;
    height: 0 !important;
    width: 100% !important;
    visibility: visible !important;
  }
  }
  
  /* Ajustes para tablas de impresión térmica */
  .thermal-table {
    width: 100% !important;
    border-collapse: collapse !important;
    table-layout: fixed !important;
    margin-bottom: 1mm !important; /* Reducido de 2mm a 1mm */
  }
  
  .thermal-table th,
  .thermal-table td {
    padding: 0.5px 2px !important; /* Reducido de 1px a 0.5px */
    text-align: left !important;
    font-size: 9pt !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    border: none !important;
  }
  
  /* Eliminar todos los bordes de las tablas */
  .thermal-table tr,
  .thermal-table tr.border-b,
  .thermal-table tr.border-dashed,
  .thermal-table thead tr {
    border: none !important;
    border-bottom: none !important;
  }
  
  .thermal-table th {
    font-weight: bold !important;
    padding-bottom: 1px !important; /* Reducido de 2px a 1px */
  }
  
  /* Ancho fijo para columnas */
  .col-fecha { width: 30% !important; text-align: left !important; }
  .col-cargo { width: 40% !important; text-align: left !important; }
  .col-monto { width: 30% !important; text-align: right !important; }
  
  /* Alineaciones */
  .t-right { text-align: right !important; }
  .t-center { text-align: center !important; }
  
  /* Divisores */
  .t-divider {
    border-top: 0.5px solid #555 !important;
    margin: 2px 0 !important;
    height: 0 !important;
    visibility: visible !important;
    display: block !important;
  }
  
  /* Separadores de secciones principales */
  .border-t-2.border-dashed.border-black,
  .border-t.border-dashed.border-gray-500 {
    border-top: 0.7px solid #333 !important;
    margin-top: 3mm !important;
    margin-bottom: 2mm !important;
    padding-top: 1mm !important;
    height: 0 !important;
    visibility: visible !important;
    display: block !important;
  }
}
`;

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/dateFormat";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"



interface SemanaLaboral {
  id_semana_laboral: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: number;
}

interface Personal {
  id_personal: number;
  dni: string;
  ruc: string | null;
  nombre_completo: string;
  fecha_nacimiento: string;
  ciudad: string;
  direccion: string | null;
  celular: string | null;
  pago_diario_normal: number;
  pago_diario_reducido: number | null;
  fecha_ingreso: string;
  estado: number;
  id_empresa: number;
  created_at: string;
  updated_at: string;
}


// Actualizar las interfaces para incluir las relaciones
interface TareaExtra {
  id_tarea_extra?: number;
  id_personal: number;
  id_semana_laboral: number;
  fecha: string;
  monto: string | number;
  descripcion: string;
  created_at: string;
  updated_at: string;
  personal?: Personal;
  semana_laboral?: SemanaLaboral;
}

interface ResumenPago {
  id_personal: number;
  id_semana_laboral: number;
  nombre_completo: string;
  pago_diario_normal: number;
  dias_completos: number;
  medios_dias: number;
  total_asistencia: number;
  total_tareas_extra: number;
  total_coccion: number;
  total_adelantos: number;
  total_descuentos: number;
  total_final: number;
  estado_pago: "Pendiente" | "Pagado";
  pago_aplicado?: 'normal' | 'reducido';
}

interface CargoCoccion {
  id_cargo_coccion: number;
  nombre_cargo: string;
  costo_cargo: string;
  id_horno?: number;
  id_empresa?: number;
}

// Reemplazar la interfaz CoccionPersonal con CoccionTurno
interface CoccionTurno {
  id_coccion_personal: number;
  coccion_id_coccion: number;
  personal_id_personal?: number; // Opcional porque puede ser personal externo
  cargo_coccion_id_cargo_coccion: number;
  fecha: string;
  personal_externo?: string;
  created_at?: string;
  updated_at?: string;
  coccion?: Coccion;
  cargo_coccion?: CargoCoccion;
}

// Actualizar la interfaz Coccion para usar coccion_turno en lugar de coccion_personal
interface Coccion {
  id_coccion: number;
  semana_laboral_id_semana_laboral: number;
  fecha_encendido: string;
  estado: string;
  horno_id_horno?: number;
  humeada?: boolean;
  quema?: boolean;
  id_empresa?: number;
  semana_laboral?: SemanaLaboral;
  horno?: {
    id_horno: number;
    nombre: string;
  };
  coccion_turno?: CoccionTurno[]; // Actualizado de coccion_personal a coccion_turno
}

// Nueva interfaz para pagos realizados
interface PagoRealizado {
  id_pago_personal_semana: number;
  id_personal: number;
  id_semana_laboral: number;
  dias_completos: number;
  costo_pago_diario: string;
  medio_dias: number;
  total_asistencia_pago: string;
  total_tareas_extra: string;
  total_coccion: string;
  total_adelantos: string;
  total_descuentos: string;
  total_pago_final: string;
  estado: string;
  fecha_pago: string;
  personal?: Personal;
  semana_laboral?: SemanaLaboral;
  created_at: string;
  updated_at: string;
}

export default function PagoPersonalPage() {
  // Extiende el tipo de empresa para incluir logo
  interface Empresa {
    id_empresa: number;
    razon_social: string;
    ruc: string;
    direccion: string;
    logo?: string; // Asegura que 'logo' está presente
  }
  // Forzar el tipo de empresa en el contexto para incluir logo
  const { empresa } = useAuthContext() as { empresa: Empresa };
  // Estado para almacenar la URL del logo validada
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  // Estado para controlar si el logo se ha cargado correctamente
  const [logoLoaded, setLogoLoaded] = useState<boolean>(false);

  const [personal, setPersonal] = useState<Personal[]>([]);
  const [todosPersonal, setTodosPersonal] = useState<Personal[]>([]); // Nuevo estado para todo el personal
  const [resumenPagos, setResumenPagos] = useState<ResumenPago[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("pendientes");

  const [semanasLaboral, setSemanasLaborales] = useState<SemanaLaboral[]>([]);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<string>("");

  // Nueva estado para pagos realizados
  const [pagosRealizados, setPagosRealizados] = useState<PagoRealizado[]>([]);
  const [loadingPagosRealizados, setLoadingPagosRealizados] = useState(false);

  // Añadir la propiedad updated_at al tipo AdelantoPersonal
  interface AdelantoPersonal {
    id_adelanto_pago: number;
    id_personal: number;
    id_semana_laboral: number;
    fecha: string;
    monto: number;
    comentario?: string;
    estado: string;
    personal?: Personal;
    updated_at?: string; // <-- Agregado para evitar error de propiedad inexistente
  }

  // Estados para el modal de adelanto
  const [adelantoModalOpen, setAdelantoModalOpen] = useState(false);
  const [adelantoData, setAdelantoData] = useState<Partial<AdelantoPersonal>>({
    fecha: new Date().toISOString().split('T')[0],
  });

  // Estados para el modal de tarea extra
  const [tareaModalOpen, setTareaModalOpen] = useState(false);
  const [tareaData, setTareaData] = useState<Partial<TareaExtra>>({
    fecha: new Date().toISOString().split('T')[0],
  });

  const [adelantos, setAdelantos] = useState<AdelantoPersonal[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [adelantoToDelete, setAdelantoToDelete] = useState<number | null>(null);
  const [isMultipleSelection, setIsMultipleSelection] = useState(false);
  const [selectedPersonal, setSelectedPersonal] = useState<number[]>([]);
  const [tareasExtra, setTareasExtra] = useState<TareaExtra[]>([]);

  // Estados para la eliminación de pagos
  const [showConfirmDeletePagoModal, setShowConfirmDeletePagoModal] = useState(false);
  const [pagoToDelete, setPagoToDelete] = useState<number | null>(null);

  // estado para manejar la selección de filas en la tabla principal 
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  // Agregar al componente principal, después de los estados existentes
  const [pagoModalOpen, setPagoModalOpen] = useState(false);
  const [selectedPago, setSelectedPago] = useState<ResumenPago | null>(null);

  const [descuentosModalOpen, setDescuentosModalOpen] = useState(false);
  const [pagoParcialModalOpen, setPagoParcialModalOpen] = useState(false);
  const [adelantoSeleccionado, setAdelantoSeleccionado] = useState<any>(null);
  const [montoPagoParcial, setMontoPagoParcial] = useState("");
  const [mostrarNuevoDescuento, setMostrarNuevoDescuento] = useState(false);
  const [descuentoTemp, setDescuentoTemp] = useState({
    monto: '',
    motivo: ''
  });
  const [descuentosSeleccionados, setDescuentosSeleccionados] = useState<{
    id?: number;
    tipo: 'adelanto' | 'descuento' | 'adelanto_parcial';
    monto: number;
    motivo: string;
    adelanto_original?: any; // Opcional, solo para adelanto_parcial
  }[]>([]);

  // Añadir nuevas interfaces que necesitamos
  interface DetallePersonal {
    personal: Personal | null;
    asistencias: {
      fecha: string;
      estado: string;
      diaSemana: string;
    }[];
    tareasExtra: TareaExtra[];
    adelantos: AdelantoPersonal[];
    adelantosCancelados?: AdelantoPersonal[]; // Adelantos que fueron cancelados en este pago
    cocciones: {
      fecha_encendido: string;
      semana: string;
      horno: string;
      turnos: {
        fecha?: string;
        cargo: string;
        costo: number;
      }[];
      total_coccion: number;
      turnosPorDia?: {
        fecha: string;
        turnos: {
          cargo: string;
          costo: number;
        }[];
      }[];
      esCoccionDeOtraSemana?: boolean; // Indica si es una cocción de otra semana
    }[];
    totales: {
      asistencia: number;
      tareas_extra: number;
      coccion: number;
      adelantos: number;
      adelantosCancelados?: number; // Total de adelantos cancelados en este pago
      descuentos: number;
      final: number;
      final_pagado: number;
    };
  }

  // Añadir estos estados para el modal de detalles
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [detallePersonal, setDetallePersonal] = useState<DetallePersonal | null>(null);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const impresionRef = useRef<HTMLDivElement>(null);

  // Función para verificar si una imagen existe
  const checkImageExists = async (url: string): Promise<boolean> => {
    if (!url) return false;

    // Normalizar la URL para que siempre comience con "/"
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;

    try {
      // Utilizar una promesa para manejar el tiempo de espera
      const result = await new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);

        // Agregar un timestamp para evitar el caché del navegador
        const cacheBuster = `?t=${new Date().getTime()}`;
        img.src = `${normalizedUrl}${cacheBuster}`;

        // Establecer un timeout de 5 segundos
        setTimeout(() => resolve(false), 5000);
      });

      console.log(`Verificación de imagen ${normalizedUrl}: ${result ? 'Existe' : 'No existe'}`);
      return result;
    } catch (error) {
      console.error(`Error al verificar la imagen ${url}:`, error);
      return false;
    }
  };

  // Función para cargar los datos completos de la empresa, incluyendo el logo
  const fetchEmpresaData = async () => {
    if (!empresa?.id_empresa) return;

    try {
      const response = await fetch(`/api/empresas?id=${empresa.id_empresa}`);

      if (!response.ok) {
        console.error("Error al cargar los datos de la empresa");
        return;
      }

      const data = await response.json();
      // Si la respuesta es un array, tomamos el primer elemento
      const empresaInfo = Array.isArray(data) && data.length > 0 ? data[0] : data;

      // Actualizar el logo y datos de la empresa en el componente
      if (empresaInfo?.logo) {
        // Normalizar la ruta del logo
        const rawLogoUrl = empresaInfo.logo.startsWith('/') ? empresaInfo.logo : `/${empresaInfo.logo}`;

        // Verificar si la imagen existe
        const imageExists = await checkImageExists(rawLogoUrl);

        if (imageExists) {
          // Actualizar el estado local de logoUrl
          setLogoUrl(rawLogoUrl);
          setLogoLoaded(true);

          // También actualizar el objeto empresa para compatibilidad
          // @ts-ignore - Forzar la actualización del objeto empresa
          empresa.logo = empresaInfo.logo;
          console.log("Logo cargado correctamente:", rawLogoUrl);
        } else {
          console.warn("La imagen del logo no existe en la ruta:", rawLogoUrl);
          setLogoUrl(null);
          setLogoLoaded(false);
        }
      } else {
        console.warn("La empresa no tiene un logo definido");
        setLogoUrl(null);
        setLogoLoaded(false);
      }
    } catch (error) {
      console.error("Error al cargar datos de la empresa:", error);
      setLogoUrl(null);
      setLogoLoaded(false);
    }
  };

  // Función para obtener la fecha y hora actual en formato peruano
  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      dateStyle: 'long',
      timeStyle: 'medium'
    });
  };

  // Función para imprimir el detalle de pago en formato ticket
  const imprimirDetalle = () => {
    if (!detallePersonal || !impresionRef.current) {
      toast.error("No se puede imprimir el detalle");
      return;
    }

    try {
      toast.info("Preparando ticket para impresión...");

      // Usar el estado logoUrl en lugar de empresa.logo directamente
      // Esto asegura que usamos la URL validada previamente
      const validLogoUrl = logoLoaded && logoUrl ? logoUrl : null;
      console.log("URL de logo para impresión:", validLogoUrl);

      // Crear estilos específicos para impresora térmica
      const printStyles = `
        <style>
          /* Configuraciones básicas para impresora térmica */
          @page {
            size: 80mm auto;
            margin: 2mm;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 8pt;
            width: 80mm;
            margin: 0 auto;
            padding: 2mm;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
            text-rendering: optimizeLegibility;
          }
          
          /* Estilos específicos para líneas divisorias */
          .border-t, .border-dashed, .border-gray-500 {
            border-top: 0.5px solid #555 !important;
            display: block !important;
            height: 0 !important;
            margin: 2mm 0 !important;
            visibility: visible !important;
            width: 100% !important;
          }
          
          /* Estilos para tablas */
          table.thermal-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 3mm;
          }
          
          table.thermal-table tr {
            border-bottom: 0.5px solid #555;
          }
          
          /* Estilo para tablas térmicas */
          .thermal-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          
          .thermal-table th,
          .thermal-table td {
            padding: 1px;
            text-align: left;
            font-size: 8pt;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          /* Columnas con anchos fijos para servicios de cocción */
          .thermal-table .col-fecha { width: 30%; }
          .thermal-table .col-cargo { width: 40%; }
          .thermal-table .col-monto { width: 30%; text-align: right; }
          
          /* Divisores y espaciado */
          .t-divider { border-top: 1px dashed #000; margin: 2px 0; }
          
          /* Alineaciones */
          .t-right { text-align: right; }
          .t-center { text-align: center; }
          
          /* Estilos adicionales */
          .text-center { text-align: center; }
          .mb-0 { margin-bottom: 0; }
          .mb-1 { margin-bottom: 1mm; }
          .divider { border-top: 1px dashed #000; margin: 2mm 0; }
          .font-bold { font-weight: bold; }
          .font-semibold { font-weight: 600; }
          
          /* Estilos para el logo */
          .logo-container { text-align: center; margin-bottom: 2mm; }
          img.logo { max-height: 10mm; max-width: 70mm; object-fit: contain; }
          
          /* Comandos ESC/POS emulados con CSS */
          .escpos-bold { font-weight: bold; }
          .escpos-center { text-align: center; }
          .escpos-right { text-align: right; }
          .escpos-normal { font-weight: normal; }
          
          ${thermalPrintStyles}
        </style>
      `;

      // Crear una nueva ventana para la impresión
      const printWindow = window.open('', '', 'height=600,width=800');

      if (!printWindow) {
        toast.error("Por favor, permita ventanas emergentes para imprimir");
        return;
      }

      printWindow.document.write('<html><head><title>Detalle de Pago Semanal</title>');
      printWindow.document.write(printStyles);
      printWindow.document.write('</head><body>');

      // Clonar el contenido para evitar modificar el original
      const content = impresionRef.current.innerHTML;

      // Aplicar algunas transformaciones para optimizar la impresión térmica
      let enhancedContent = content;
      
      // Añadir un contenedor con margen para asegurar espaciado en todos los lados y aplicar fuente Arial globalmente
      enhancedContent = `<div style="padding: 4mm; margin: 2mm auto; font-family: Arial, Helvetica, sans-serif; -webkit-print-color-adjust: exact;">${enhancedContent}</div>`;
      
      // Mejorar la visibilidad de las líneas divisorias
      enhancedContent = enhancedContent.replace(/<div class="my-1 border-t border-dashed border-gray-500 print:my-0.5"><\/div>/g, 
        '<div style="border-top: 0.5px solid #555; margin: 3mm 0; height: 0; display: block; visibility: visible; width: 100%"></div>');
      
      // Mejorar la línea divisoria antes del total a pagar
      enhancedContent = enhancedContent.replace(/<div class="my-3 border-t border-dashed border-gray-500 print:my-5"><\/div>/g, 
        '<div style="border-top: 0.7px solid #333; margin: 8mm 0; height: 0; display: block; visibility: visible; width: 100%"></div>');
      
      // Inyectar comandos ESC/POS como clases CSS para una mejor impresión
      enhancedContent = enhancedContent.replace(/<div class="text-center font-bold/g, '<div style="font-family: Arial, Helvetica, sans-serif; font-weight: bold;" class="text-center font-bold escpos-center escpos-bold');
      enhancedContent = enhancedContent.replace(/<div class="flex justify-end/g, '<div style="font-family: Arial, Helvetica, sans-serif;" class="flex justify-end escpos-right');
      
      // Asegurar que las clases de impresión térmica estén correctamente aplicadas
      enhancedContent = enhancedContent.replace(/<th class="col-fecha/g, '<th style="font-family: Arial, Helvetica, sans-serif; font-weight: bold;" class="col-fecha font-bold');
      enhancedContent = enhancedContent.replace(/<th class="col-cargo/g, '<th style="font-family: Arial, Helvetica, sans-serif; font-weight: bold;" class="col-cargo font-bold');
      enhancedContent = enhancedContent.replace(/<th class="col-monto/g, '<th style="font-family: Arial, Helvetica, sans-serif; font-weight: bold;" class="col-monto font-bold');
      
      // Aplicar fuente a las celdas de la tabla
      enhancedContent = enhancedContent.replace(/<td class="/g, '<td style="font-family: Arial, Helvetica, sans-serif;" class="');
      
      // Mejorar estilos para el total a pagar y total pagado
      enhancedContent = enhancedContent.replace(/TOTAL SIN DESCUENTO:/g, '<span style="font-size: 12pt; font-weight: bold;">TOTAL SIN DESCUENTO:</span>');
      enhancedContent = enhancedContent.replace(/TOTAL PAGADO:/g, '<span style="font-size: 12pt; font-weight: bold; margin-top: 6mm; display: block;">TOTAL PAGADO:</span>');
      enhancedContent = enhancedContent.replace(/\(Monto final después de descuentos\)/g, '<span style="font-size: 8pt; color: #666;">(Monto final después de descuentos)</span>');
      
      // Forzar el estilo de los divisores directamente en el HTML
      enhancedContent = enhancedContent.replace(/<div class="my-1 border-t/g, '<div style="border-top: 0.5px solid #333; margin: 3mm 0; display: block; height: 0; width: 100%;" class="my-1 border-t');
      
      // No aplicar bordes a las filas de las tablas
      
      // Insertar el contenido mejorado en la ventana de impresión
      printWindow.document.write(enhancedContent);
      printWindow.document.write('</body></html>');

      // Verificar si hay imágenes en el contenido
      const images = printWindow.document.querySelectorAll('img');
      let imagesLoaded = 0;
      const totalImages = images.length;

      // Si hay imágenes, esperar a que se carguen
      if (totalImages > 0) {
        images.forEach(img => {
          img.onload = () => {
            imagesLoaded++;
            console.log(`Imagen cargada: ${imagesLoaded}/${totalImages}`);

            // Si todas las imágenes están cargadas, imprimir
            if (imagesLoaded === totalImages) {
              setTimeout(() => {
                printWindow.print();
              }, 200);
            }
          };

          img.onerror = () => {
            imagesLoaded++;
            console.error(`Error al cargar imagen: ${img.src}`);
            // Si todas las imágenes han terminado (incluso con error), imprimir
            if (imagesLoaded === totalImages) {
              setTimeout(() => {
                printWindow.print();
              }, 200);
            }
          };
        });
      } else {
        // Si no hay imágenes, imprimir directamente
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }

      printWindow.document.close();
      printWindow.focus();

      // Esperar a que cargue todos los recursos antes de imprimir
      setTimeout(() => {
        printWindow.print();
      }, 500);

    } catch (error) {
      console.error("Error al imprimir:", error);
      toast.error("Error al preparar la impresión");
    }
  };

  useEffect(() => {
    fetchSemanasLaborales();
    fetchEmpresaData(); // Cargar los datos de la empresa al inicio
  }, []);

  // Efecto para cargar datos cuando se selecciona una semana
  useEffect(() => {
    if (semanaSeleccionada) {
      // Llamar SOLO a cargarDatosCompletos para centralizar las cargas
      cargarDatosCompletos(semanaSeleccionada);

      // Siempre cargar pagos realizados al cambiar de semana
      fetchPagosRealizados(semanaSeleccionada);
    }
  }, [semanaSeleccionada]);

  // Nueva función para cargar pagos realizados
  const fetchPagosRealizados = async (idSemana: string) => {
    try {
      setLoadingPagosRealizados(true);
      const response = await fetch(`/api/pago_personal_semana?id_semana=${idSemana}`);

      if (!response.ok) throw new Error("Error al cargar pagos realizados");

      const data = await response.json();
      setPagosRealizados(data);
    } catch (error) {
      console.error("Error al cargar pagos realizados:", error);
      toast.error("Error al cargar los pagos realizados");
    } finally {
      setLoadingPagosRealizados(false);
    }
  };

  // Centralizar carga de datos
  const cargarDatosCompletos = async (idSemana: string) => {
    try {
      setIsLoading(true);
      console.log("Cargando datos completos para semana:", idSemana);

      // Realizar todas las peticiones en paralelo
      const [
        personalResponse,
        asistenciasResponse,
        adelantosResponse,
        tareasExtraResponse,
        turnosResponse
      ] = await Promise.all([
        fetch("/api/personal"),
        fetch(`/api/asistencia?id_semana=${idSemana}`),
        fetch("/api/adelanto_pago?estado=Pendiente"),
        fetch(`/api/tarea_extra?id_semana=${idSemana}`),
        // La API ahora filtrará por rango de fechas de la semana, no solo por id_semana de la cocción
        fetch(`/api/coccion_turno?id_semana=${idSemana}`)
      ]);

      // Procesar todas las respuestas en paralelo
      const [personal, asistencias, adelantos, tareasExtra, turnos] = await Promise.all([
        personalResponse.json(),
        asistenciasResponse.json(),
        adelantosResponse.json(),
        tareasExtraResponse.json(),
        turnosResponse.json()
      ]);

      // Verificar si hay datos de turnos y mostrar para diagnóstico
      console.log(`Turnos de cocción recuperados: ${turnos ? turnos.length : 0}`);
      if (turnos && turnos.length > 0) {
        console.log("Ejemplo de turno recuperado:", turnos[0]);
      }

      // Filtrar el personal activo
      const personalActivo = personal.filter((p: Personal) => p.estado === 1);

      // Actualizar los estados en orden correcto - primero los datos fuente
      setPersonal(personalActivo);
      setAdelantos(adelantos);
      setTareasExtra(tareasExtra);

      // IMPORTANTE: Usar solo UN setResumenPagos al final para evitar renderizaciones parciales
      // Generar el resumen de pagos una sola vez con todos los datos
      generarResumenPagos(personalActivo, asistencias, adelantos, tareasExtra, turnos, idSemana);

    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar los datos necesarios");
    } finally {
      setIsLoading(false);
    }
  }

  const generarResumenPagos = (
    personalActivo: Personal[],
    asistencias: any[],
    adelantos: any[],
    tareasExtra: any[],
    turnos: any[],
    idSemana: string
  ) => {
    // Obtener el rango de fechas de la semana seleccionada
    const semanaSeleccionadaObj = semanasLaboral.find(s => s.id_semana_laboral.toString() === idSemana);
    if (!semanaSeleccionadaObj) {
      console.error("No se encontró la semana seleccionada");
      return;
    }

    // Convertir fechas a objetos Date para comparaciones
    const fechaInicioSemana = new Date(semanaSeleccionadaObj.fecha_inicio);
    const fechaFinSemana = new Date(semanaSeleccionadaObj.fecha_fin);

    // Asegurar que ambas fechas estén a medianoche para comparaciones correctas
    fechaInicioSemana.setHours(0, 0, 0, 0);
    fechaFinSemana.setHours(23, 59, 59, 999); // Fin del día

    console.log(`Rango de fechas para semana ${idSemana}:`,
      `${fechaInicioSemana.toISOString()} - ${fechaFinSemana.toISOString()}`);

    // Filtrar datos por la semana seleccionada
    const asistenciasSemana = asistencias.filter((a) => a.id_semana_laboral.toString() === idSemana);
    const adelantosPendientes = adelantos.filter((a) => a.estado === "Pendiente");
    const tareasExtraSemana = tareasExtra.filter((t) => t.id_semana_laboral.toString() === idSemana);

    // Ya no necesitamos filtrar los turnos por fecha, pues la API ya los devuelve filtrados por el rango correcto
    const turnosSemana = Array.isArray(turnos) ? turnos : [];

    // Crear un registro de turnos por personal para diagnóstico
    const turnosPorPersonal = turnosSemana.reduce((acc, turno) => {
      const idPersonal = turno.personal_id_personal;
      if (idPersonal) {
        if (!acc[idPersonal]) acc[idPersonal] = [];
        acc[idPersonal].push({
          fecha: new Date(turno.fecha).toLocaleDateString(),
          cargo: turno.cargo_coccion?.nombre_cargo || 'Sin cargo',
          costo: turno.cargo_coccion?.costo_cargo || 0,
          id_coccion: turno.coccion_id_coccion,
          id_semana_coccion: turno.coccion?.semana_laboral_id_semana_laboral
        });
      }
      return acc;
    }, {});

    console.log("Resumen de turnos por personal:", turnosPorPersonal);

    // Crear el resumen completo
    interface ResumenPago {
      id_personal: number;
      nombre_completo: string;
      pago_diario_normal: number;
      dias_completos: number;
      medios_dias: number;
      total_asistencia: number;
      total_tareas_extra: number;
      total_coccion: number;
      total_adelantos: number;
      total_descuentos: number;
      total_final: number;
      estado_pago: "Pendiente" | "Pagado";
      pago_aplicado: 'normal' | 'reducido';
      id_semana_laboral: number; // <-- Agregado para evitar error
    }

    const resumen = personalActivo.map((p): ResumenPago => {
      // Calcular días de asistencia
      const asistenciasPersonal = asistenciasSemana.filter(
        (a) => a.id_personal === p.id_personal
      );
      const dias_completos = asistenciasPersonal.filter((a) => a.estado === "A").length;
      const medios_dias = asistenciasPersonal.filter((a) => a.estado === "M").length;

      // Verificar si tiene alguna inasistencia (I) en la semana
      const tieneInasistencia = asistenciasPersonal.some((a) => a.estado === "I");

      // Determinar si aplica pago reducido - si tiene pago_diario_reducido configurado Y tiene inasistencias
      const aplicaPagoReducido = p.pago_diario_reducido &&
        Number(p.pago_diario_reducido) > 0 &&
        tieneInasistencia;

      // Calcular pago por asistencia - asegurarse que los valores son numéricos
      const pagoDiarioNormal = typeof p.pago_diario_normal === 'number' ?
        p.pago_diario_normal :
        Number(p.pago_diario_normal);

      const pagoDiarioReducido = p.pago_diario_reducido && typeof p.pago_diario_reducido === 'number' ?
        p.pago_diario_reducido :
        p.pago_diario_reducido ? Number(p.pago_diario_reducido) : 0;

      // Determinar qué pago aplicar basado en la presencia de inasistencias
      const pagoDiarioAplicado = aplicaPagoReducido ? pagoDiarioReducido : pagoDiarioNormal;

      // Calcular el total de asistencia correctamente
      const total_asistencia = (dias_completos * pagoDiarioAplicado) +
        (medios_dias * (pagoDiarioAplicado / 2));

      // Calcular adelantos
      const adelantosPersonal = adelantosPendientes.filter(
        (a) => a.id_personal === p.id_personal
      );

      const total_adelantos = adelantosPersonal.reduce(
        (sum, adelanto) => sum + Number(adelanto.monto),
        0
      );

      // Calcular tareas extra
      const tareasPersonal = tareasExtraSemana.filter(
        (t) => t.id_personal === p.id_personal
      );
      const total_tareas_extra = tareasPersonal.reduce(
        (sum, tarea) => sum + Number(tarea.monto),
        0
      );

      // Calcular total de cocción usando turnos - estos ya vienen filtrados por fecha desde la API
      const turnosPersonal = turnosSemana.filter(turno =>
        turno.personal_id_personal === p.id_personal
      );

      console.log(`Personal ${p.nombre_completo} - Turnos encontrados: ${turnosPersonal.length}`);

      let total_coccion = 0;

      // Sumar el costo de cada turno
      turnosPersonal.forEach(turno => {
        if (turno.cargo_coccion && turno.cargo_coccion.costo_cargo) {
          const costoCargo = Number(turno.cargo_coccion.costo_cargo);
          total_coccion += costoCargo;

          // Mostrar detalles de cada turno para diagnóstico
          console.log(`Turno ${turno.id_coccion_personal} - ${turno.cargo_coccion.nombre_cargo} - ${new Date(turno.fecha).toLocaleDateString()}: S/. ${costoCargo}`);
        }
      });

      console.log(`Personal ${p.nombre_completo} - Total cocción: S/. ${total_coccion}`);

      // Asumimos que total_descuentos ya está calculado o es 0
      const total_descuentos = 0;

      // Calcular total final
      const total_final = total_asistencia + total_tareas_extra + total_coccion - total_descuentos;

      return {
        id_personal: p.id_personal,
        nombre_completo: p.nombre_completo,
        pago_diario_normal: Number(p.pago_diario_normal),
        dias_completos,
        medios_dias,
        total_asistencia,
        total_tareas_extra,
        total_coccion,
        total_adelantos,
        total_descuentos,
        total_final,
        estado_pago: "Pendiente",
        pago_aplicado: aplicaPagoReducido ? 'reducido' : 'normal',
        id_semana_laboral: Number(idSemana) // <-- Agregado para evitar error
      };
    });

    setResumenPagos(resumen);
  };

  //Función para cargar las semanas laborales
  const fetchSemanasLaborales = async () => {
    try {
      // Solicitar todas las semanas con un límite de 10 para asegurar obtener suficientes
      const response = await fetch("/api/semana_laboral?limit=10");
      const data = await response.json();

      // Ordenar semanas por fecha de inicio (más recientes primero)
      const semanasOrdenadas = [...data].sort((a, b) =>
        new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()
      );

      // Limitar a las 4 semanas más recientes
      const semanasRecientes = semanasOrdenadas.slice(0, 4);

      // Actualizar el estado de semanas
      setSemanasLaborales(semanasRecientes);

      // Seleccionar automáticamente la semana con estado 1
      // Primero verificar si existe una semana activa
      const semanaActiva = semanasRecientes.find((s: SemanaLaboral) => s.estado === 1);
      if (semanaActiva) {
        // Asignar la semana seleccionada (esto disparará el useEffect para cargar datos)
        setSemanaSeleccionada(semanaActiva.id_semana_laboral.toString());
      } else if (semanasRecientes.length > 0) {
        // Si no hay semana activa pero hay semanas, seleccionar la más reciente
        setSemanaSeleccionada(semanasRecientes[0].id_semana_laboral.toString());
      } else {
        // Si no hay semanas, limpiar la selección y mostrar el estado de carga como completado
        setSemanaSeleccionada("");
        setIsLoading(false);
        console.log("No hay semanas laborales disponibles");
      }
    } catch (error) {
      console.error("Error al cargar semanas laborales:", error);
      toast.error("Error al cargar semanas laborales");
    }
  };


  const fetchAdelantos = async (idSemana: string) => {
    try {
      const response = await fetch("/api/adelanto_pago?estado=Pendiente");
      const data = await response.json();
      // Convertir monto a número para cada adelanto
      const adelantosProcessed = data.map((adelanto: AdelantoPersonal) => ({
        ...adelanto,
        monto: Number(adelanto.monto)
      }));
      setAdelantos(adelantosProcessed);

      // Actualizar los totales de adelantos en el resumen de pagos
      setResumenPagos(prev => prev.map(resumen => {
        // Filtrar adelantos por personal y sumar los montos
        interface AdelantoPersonalWithSemana extends AdelantoPersonal {
          id_semana_laboral: number;
        }

        const adelantosPersonal: AdelantoPersonalWithSemana[] = adelantosProcessed.filter(
          (adelanto: AdelantoPersonalWithSemana) =>
            adelanto.id_personal === resumen.id_personal &&
            adelanto.id_semana_laboral.toString() === idSemana
        );
        const totalAdelantos = adelantosPersonal.reduce(
          (sum, adelanto) => sum + Number(adelanto.monto),
          0
        );

        return {
          ...resumen,
          total_adelantos: totalAdelantos,
          // Recalcular el total final SIN descontar adelantos
          total_final: resumen.total_asistencia +
            resumen.total_tareas_extra +
            resumen.total_coccion -
            resumen.total_descuentos
        };
      }));
    } catch (error) {
      console.error("Error al cargar adelantos:", error);
      toast.error("Error al cargar los adelantos");
    }
  };

  // Modificar la función handleEditAdelanto
  const handleEditAdelanto = (adelanto: AdelantoPersonal) => {
    const formatISODate = (dateString: string) => {
      const date = new Date(dateString);
      date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
      return date.toISOString().split('T')[0];
    };

    setAdelantoData({
      ...adelanto,
      fecha: formatISODate(adelanto.fecha)
    });
    setAdelantoModalOpen(true);
  };

  const handleDeleteAdelanto = (id: number) => {
    setAdelantoToDelete(id);
    setShowConfirmModal(true);
  };

  const confirmDeleteAdelanto = async () => {
    if (adelantoToDelete === null) return;

    try {
      const response = await fetch(`/api/adelanto_pago/?id=${adelantoToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar adelanto');

      toast.success('Adelanto eliminado correctamente');
      // setShowConfirmModal(false);
      // Recargar adelantos
      if (semanaSeleccionada) {
        fetchAdelantos(semanaSeleccionada);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el adelanto');
    } finally {
      setAdelantoToDelete(null);
    }
  };

  // Modificar handleAdelantoSubmit
  const handleAdelantoSubmit = async () => {
    // Validaciones
    if (!semanaSeleccionada) {
      toast.error("Debe seleccionar una semana laboral");
      return;
    }

    if (!adelantoData.id_personal) {
      toast.error("Debe seleccionar un personal");
      return;
    }

    if (!adelantoData.fecha) {
      toast.error("Debe ingresar una fecha");
      return;
    }

    if (!adelantoData.monto || adelantoData.monto <= 0) {
      toast.error("Debe ingresar un monto válido");
      return;
    }

    try {
      setIsSubmitting(true);

      // Separar los datos relacionales de los datos directos
      const dataToSubmit = {
        ...(adelantoData.id_adelanto_pago && { id_adelanto_pago: adelantoData.id_adelanto_pago }),
        fecha: new Date(adelantoData.fecha + 'T00:00:00.000Z').toISOString(),
        monto: Number(adelantoData.monto),
        comentario: adelantoData.comentario || "",
        estado: "Pendiente",
        // Solo incluir las relaciones para nuevos registros (POST)
        ...((!adelantoData.id_adelanto_pago) && {
          id_personal: Number(adelantoData.id_personal),
          id_semana_laboral: Number(semanaSeleccionada),
        })
      };

      const response = await fetch("/api/adelanto_pago", {
        method: adelantoData.id_adelanto_pago ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al procesar adelanto");
      }

      toast.success(
        adelantoData.id_adelanto_pago
          ? "Adelanto actualizado correctamente"
          : "Adelanto registrado correctamente"
      );

      // setAdelantoModalOpen(false);

      // Resetear el formulario
      setAdelantoData({
        fecha: new Date().toISOString().split('T')[0]
      });

      // Recargar adelantos
      if (semanaSeleccionada) {
        // fetchAdelantos(semanaSeleccionada);
        // await actualizarResumenPagos(semanaSeleccionada);
        await cargarDatosCompletos(semanaSeleccionada); // Recargar todos los datos de forma coordinada
      }

    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error al procesar el adelanto");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modificar el useEffect existente para incluir la carga de asistencias
  useEffect(() => {
    if (semanaSeleccionada) {
      // Llamar SOLO a cargarDatosCompletos para centralizar las cargas
      cargarDatosCompletos(semanaSeleccionada);

    }
  }, [semanaSeleccionada]);

  // Agregar la función fetchTareasExtra
  const fetchTareasExtra = async (idSemana: string) => {
    try {
      const response = await fetch(`/api/tarea_extra?id_semana=${idSemana}`);
      if (!response.ok) throw new Error("Error al obtener tareas extras");

      const data = await response.json();

      // Guardar todas las tareas de la semana seleccionada
      setTareasExtra(data);

      // Actualizar los totales en el resumen de pagos
      setResumenPagos(prev => prev.map(resumen => {
        const tareasPorPersonal: TareaExtra[] = data.filter(
          (tarea: TareaExtra) => tarea.id_personal === resumen.id_personal
        );
        const totalTareasExtra = tareasPorPersonal.reduce(
          (sum, tarea) => sum + Number(tarea.monto),
          0
        );

        return {
          ...resumen,
          total_tareas_extra: totalTareasExtra,
          total_final: resumen.total_asistencia +
            totalTareasExtra +
            resumen.total_coccion -
            resumen.total_adelantos -
            resumen.total_descuentos
        };
      }));

    } catch (error) {
      console.error("Error al cargar tareas extra:", error);
      toast.error("Error al cargar las tareas extra");
    }
  };

  // Modificar la función handleTareaExtraSubmit
  async function handleTareaExtraSubmit(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    event.preventDefault();

    try {
      // Validación de la semana laboral
      if (!semanaSeleccionada) {
        toast.error("Debe seleccionar una semana laboral");
        return;
      }

      // Validación de personal según el modo de selección
      if (isMultipleSelection) {
        if (selectedPersonal.length === 0) {
          toast.error("Debe seleccionar al menos un personal");
          return;
        }
      } else {
        if (!tareaData.id_personal) {
          toast.error("Debe seleccionar un personal");
          return;
        }
      }

      // Validación de fecha
      if (!tareaData.fecha) {
        toast.error("Debe ingresar una fecha");
        return;
      }

      // Validación de monto
      if (!tareaData.monto || Number(tareaData.monto) <= 0) {
        toast.error("El monto debe ser mayor a 0");
        return;
      }

      setIsSubmitting(true);

      // Preparar datos base
      const tareaToSubmit = {
        fecha: new Date(tareaData.fecha + 'T00:00:00.000Z').toISOString(),
        monto: Number(tareaData.monto),
        descripcion: tareaData.descripcion || "",
        id_semana_laboral: Number(semanaSeleccionada),
      };

      if (tareaData.id_tarea_extra) {
        // Modo edición
        const response = await fetch(`/api/tarea_extra?id=${tareaData.id_tarea_extra}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...tareaToSubmit,
            id_tarea_extra: tareaData.id_tarea_extra,
            id_personal: tareaData.id_personal
          }),
        });

        if (!response.ok) {
          throw new Error("Error al actualizar la tarea extra");
        }

        toast.success("Tarea extra actualizada correctamente");
      } else {
        // Modo creación (existente)
        if (isMultipleSelection) {
          const tareasMultiples = selectedPersonal.map(idPersonal => ({
            ...tareaToSubmit,
            id_personal: idPersonal,
          }));

          const response = await fetch("/api/tarea_extra", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tareasMultiples),
          });

          if (!response.ok) {
            throw new Error("Error al registrar las tareas extras");
          }

          toast.success(`${selectedPersonal.length} tareas extras registradas correctamente`);
        } else {
          const response = await fetch("/api/tarea_extra", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...tareaToSubmit,
              id_personal: Number(tareaData.id_personal),
            }),
          });

          if (!response.ok) {
            throw new Error("Error al registrar la tarea extra");
          }

          toast.success("Tarea extra registrada correctamente");
        }
      }

      // Recargar datos y limpiar formulario
      // await fetchTareasExtra(semanaSeleccionada);
      // await actualizarResumenPagos(semanaSeleccionada);
      await cargarDatosCompletos(semanaSeleccionada); // Recargar todo de forma consistente

      setTareaModalOpen(false);
      setTareaData({ fecha: new Date().toISOString().split('T')[0] });
      setSelectedPersonal([]);
      setIsMultipleSelection(false);

    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar la tarea extra");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Estados para la eliminación de tareas extra
  const [showConfirmDeleteTareaModal, setShowConfirmDeleteTareaModal] = useState(false);
  const [tareaToDelete, setTareaToDelete] = useState<number | null>(null);

  // Función para mostrar modal de confirmación antes de eliminar
  const confirmDeleteTareaExtra = (id: number) => {
    setTareaToDelete(id);
    setShowConfirmDeleteTareaModal(true);
  };
  
  // Agregar función para eliminar tarea extra
  const handleDeleteTareaExtra = async () => {
    if (!tareaToDelete) return;
    
    try {
      const response = await fetch(`/api/tarea_extra/?id=${tareaToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar tarea extra');

      toast.success('Tarea extra eliminada correctamente');
      
      // Recargar tareas extras y actualizar el resumen de pagos
      if (semanaSeleccionada) {
        // Recargar todos los datos para asegurar que todo se actualice correctamente
        await cargarDatosCompletos(semanaSeleccionada);
      }
      
      // Cerrar el modal de confirmación
      setShowConfirmDeleteTareaModal(false);
      setTareaToDelete(null);  
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar la tarea extra');
    }
  };

  // Función para manejar el cierre del modal de descuentos
  const handleCloseDescuentosModal = () => {
    setDescuentosModalOpen(false);
    setDescuentoTemp({ monto: '', motivo: '' });
    setMostrarNuevoDescuento(false);
    // No reiniciamos descuentosSeleccionados para mantener los previamente seleccionados
  };

  // Función para manejar pagos parciales
  const handlePagoParcial = (adelanto: any) => {
    setAdelantoSeleccionado(adelanto);
    setMontoPagoParcial("");
    setPagoParcialModalOpen(true);
  };

  // Función para aplicar pago parcial
  const handleApplyPagoParcial = () => {
    if (!adelantoSeleccionado || !montoPagoParcial || Number(montoPagoParcial) <= 0) {
      toast.error("Ingrese un monto válido para el pago parcial");
      return;
    }

    if (Number(montoPagoParcial) > Number(adelantoSeleccionado.monto)) {
      toast.error("El monto no puede ser mayor que el adelanto");
      return;
    }

    // Agregar a la lista de descuentos seleccionados
    setDescuentosSeleccionados([
      ...descuentosSeleccionados,
      {
        tipo: 'adelanto_parcial',
        monto: Number(montoPagoParcial),
        motivo: `Pago parcial de adelanto (${formatDate(adelantoSeleccionado.fecha)})`,
        adelanto_original: adelantoSeleccionado
      }
    ]);

    // Cerrar el modal
    setPagoParcialModalOpen(false);
    setAdelantoSeleccionado(null);
    setMontoPagoParcial("");

    toast.success("Pago parcial agregado");
  };

  // Función para cargar los detalles del personal para el modal
  const cargarDetallesPersonal = async (idPersonal: number) => {
    try {
      setLoadingDetalles(true);

      // Verificar si existe el logo de la empresa
      console.log("Empresa data:", empresa);
      console.log("Logo de la empresa:", empresa?.logo);

      // Obtener el objeto de personal
      const personalObj = personal.find(p => p.id_personal === idPersonal);
      if (!personalObj) throw new Error("No se encontró el personal");

      // Obtener el resumen del pago
      const resumenObj = resumenPagos.find(r => r.id_personal === idPersonal);
      if (!resumenObj) throw new Error("No se encontró el resumen de pago");

      // Obtener la semana actual seleccionada
      const semanaActiva = semanasLaboral.find(s => s.id_semana_laboral.toString() === semanaSeleccionada);
      if (!semanaActiva) throw new Error("No se encontró la semana seleccionada");
      const idSemanaActiva = semanaActiva.id_semana_laboral.toString();

      // Definir rango de fechas para la semana actual
      const fechaInicio = new Date(semanaActiva.fecha_inicio);
      const fechaFin = new Date(semanaActiva.fecha_fin);
      // Ajustar para incluir el día completo
      fechaInicio.setHours(0, 0, 0, 0);
      fechaFin.setHours(23, 59, 59, 999);

      // Obtener asistencias específicamente para este personal y esta semana activa
      const asistenciasResponse = await fetch(`/api/asistencia?id_personal=${idPersonal}&id_semana=${idSemanaActiva}`);
      const asistenciasData = await asistenciasResponse.json();

      // Procesar asistencias para crear asistenciasFormateadas
      const asistenciasFormateadas = asistenciasData.map((asistencia: any) => {
        const fecha = new Date(asistencia.fecha);
        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const diaSemana = diasSemana[fecha.getDay()];
        const fechaFormateada = formatDate(asistencia.fecha);

        let estado;
        switch (asistencia.estado) {
          case 'A':
            estado = 'Completo';
            break;
          case 'M':
            estado = 'Medio día';
            break;
          case 'I':
            estado = 'Inasistencia';
            break;
          default:
            estado = asistencia.estado;
        }

        return {
          fecha: fechaFormateada,
          estado,
          diaSemana,
        };
      });

      // Ordenar asistencias por fecha
      asistenciasFormateadas.sort((a: any, b: any) => {
        const fechaA = new Date(a.fecha.split('/').reverse().join('-'));
        const fechaB = new Date(b.fecha.split('/').reverse().join('-'));
        return fechaA.getTime() - fechaB.getTime();
      });

      // Filtrar adelantos pendientes del personal (mostrar todos, no solo los de esta semana)
      const adelantosPersonal = adelantos.filter(
        a => a.id_personal === idPersonal && a.estado === "Pendiente"
      );

      const tareasPersonal = tareasExtra.filter(
        t => t.id_personal === idPersonal && t.id_semana_laboral.toString() === idSemanaActiva
      );

      // IMPORTANTE: Obtener los turnos de cocción directamente desde la API para la semana seleccionada
      const turnosResponse = await fetch(`/api/coccion_turno?id_semana=${idSemanaActiva}&id_personal=${idPersonal}`);
      const turnosData = await turnosResponse.json();

      console.log(`Turnos obtenidos para personal ${idPersonal} en semana ${idSemanaActiva}:`, turnosData);

      // Filtrar los turnos para asegurarnos que solo incluimos los que tienen fecha dentro del rango de la semana
      const turnosFiltradosPorFecha = turnosData.filter((turno: any) => {
        const fechaTurno = new Date(turno.fecha);
        fechaTurno.setHours(0, 0, 0, 0); // Normalizar la hora
        return fechaTurno >= fechaInicio && fechaTurno <= fechaFin;
      });

      console.log(`Turnos filtrados por fecha (${fechaInicio.toISOString()} - ${fechaFin.toISOString()}):`,
        turnosFiltradosPorFecha);

      // Obtener datos de cocción relacionados con estos turnos
      const idsCocciones = [...new Set(turnosFiltradosPorFecha.map((t: any) => t.coccion_id_coccion))];

      // Obtener solo las cocciones relacionadas con los turnos filtrados
      const coccionesResponse = await fetch(`/api/coccion?ids=${idsCocciones.join(',')}`);
      const coccionesData = await coccionesResponse.json();

      console.log(`Cocciones obtenidas para los turnos filtrados:`, coccionesData);

      // Agrupar los turnos por cocción para mostrarlos organizados
      const detallesCocciones = coccionesData.reduce((acc: any[], coccion: Coccion) => {
        // Filtrar los turnos para esta cocción específica donde participó el personal
        // y que están dentro del rango de fechas de la semana actual
        const turnosCoccion = turnosFiltradosPorFecha.filter((turno: CoccionTurno) =>
          turno.coccion_id_coccion === coccion.id_coccion &&
          turno.personal_id_personal === idPersonal
        );

        if (turnosCoccion.length > 0) {
          const totalCoccion = turnosCoccion.reduce((sum: number, turno: CoccionTurno) => {
            const costoCargo = turno.cargo_coccion?.costo_cargo;
            return sum + (costoCargo ? Number(costoCargo) : 0);
          }, 0);

          // Obtener información del horno (si está disponible)
          const nombreHorno = coccion.horno?.nombre || (coccion.horno_id_horno ? `Horno ${coccion.horno_id_horno}` : 'No especificado');

          // Agrupar turnos por fecha para mostrarlos mejor organizados
          const turnosPorFecha = turnosCoccion.reduce((grupos: any, turno: CoccionTurno) => {
            // Registrar cada fecha para diagnóstico
            const fechaOriginal = turno.fecha;
            const fechaFormateada = formatDate(turno.fecha);

            console.log(`Procesando turno ${turno.id_coccion_personal}: Fecha original=${fechaOriginal}, Fecha formateada=${fechaFormateada}`);

            if (!grupos[fechaFormateada]) {
              grupos[fechaFormateada] = [];
            }

            grupos[fechaFormateada].push({
              cargo: turno.cargo_coccion?.nombre_cargo || 'Desconocido',
              costo: turno.cargo_coccion ? Number(turno.cargo_coccion.costo_cargo) : 0
            });

            return grupos;
          }, {});

          // Crear un arreglo de turnos agrupado por fecha
          const turnosAgrupados: any[] = [];
          Object.entries(turnosPorFecha).forEach(([fecha, turnos]: [string, any]) => {
            console.log(`Grupo de fecha ${fecha} contiene ${(turnos as any[]).length} turnos`);
            turnosAgrupados.push({
              fecha,
              turnos
            });
          });

          // Ordenar turnosAgrupados por fecha (más reciente primero)
          turnosAgrupados.sort((a, b) => {
            // Convertir fechas DD/MM/YYYY a objetos Date para comparación
            const [diaA, mesA, yearA] = a.fecha.split('/');
            const [diaB, mesB, yearB] = b.fecha.split('/');

            const dateA = new Date(Number(yearA), Number(mesA) - 1, Number(diaA));
            const dateB = new Date(Number(yearB), Number(mesB) - 1, Number(diaB));

            return dateB.getTime() - dateA.getTime();
          });

          // IMPORTANTE: Mostramos la semana actual, no la de la cocción
          const semanaInfo = `${formatDate(semanaActiva.fecha_inicio)} - ${formatDate(semanaActiva.fecha_fin)}`;

          acc.push({
            id_coccion: coccion.id_coccion,
            fecha_encendido: coccion.fecha_encendido,
            // Nota informativa si la cocción es de otra semana
            semana: coccion.semana_laboral_id_semana_laboral.toString() !== idSemanaActiva ?
              `${semanaInfo} (Cocción iniciada en semana ${coccion.semana_laboral_id_semana_laboral})` :
              semanaInfo,
            horno: nombreHorno,
            turnos: turnosCoccion.map((turno: CoccionTurno) => ({
              fecha: formatDate(turno.fecha),
              cargo: turno.cargo_coccion?.nombre_cargo || 'Desconocido',
              costo: turno.cargo_coccion ? Number(turno.cargo_coccion.costo_cargo) : 0
            })),
            turnosPorDia: turnosAgrupados,
            total_coccion: totalCoccion,
            // Indicador visual si la cocción es de otra semana
            esCoccionDeOtraSemana: coccion.semana_laboral_id_semana_laboral.toString() !== idSemanaActiva
          });
        }
        return acc;
      }, []);

      console.log(`Detalles de cocciones procesados:`, detallesCocciones);

      // Crear el objeto completo de detalles
      // Buscar si existe un pago realizado para este personal en esta semana
      const pagoRealizado = pagosRealizados.find(
        p => p.id_personal === idPersonal &&
          p.id_semana_laboral.toString() === idSemanaActiva
      );

      // Calcular total final sin descuentos (suma de asistencia, tareas extra y cocción)
      const totalFinalSinDescuento = resumenObj.total_asistencia +
        resumenObj.total_tareas_extra +
        resumenObj.total_coccion;

      // Total final pagado es el monto que figura en el pago realizado, si existe
      // Si el personal no ha sido pagado, asignamos el valor del monto sin descuentos 
      // (la interfaz mostrará un guion pero necesitamos un valor numérico para la interfaz)
      const totalFinalPagado = pagoRealizado ?
        Number(pagoRealizado.total_pago_final) :
        Number(totalFinalSinDescuento);

      // Para obtener adelantos cancelados, necesitamos hacer una consulta adicional
      let adelantosCancelados: AdelantoPersonal[] = [];
      let totalAdelantosCancelados = 0;

      // Si hay un pago realizado, consultamos los adelantos cancelados asociados a ese pago
      if (pagoRealizado) {
        try {
          // Necesitamos un enfoque más preciso para obtener los adelantos cancelados
          // específicamente para este personal y en relación con este pago

          // 1. Consultar TODOS los adelantos cancelados de este personal específico
          const adelantosCanceladosResponse = await fetch(`/api/adelanto_pago?id_personal=${idPersonal}&estado=Cancelado`);
          if (adelantosCanceladosResponse.ok) {
            const adelantosCanceladosData = await adelantosCanceladosResponse.json();

            console.log(`Todos los adelantos cancelados para personal ${idPersonal}:`, adelantosCanceladosData);

            // 2. Filtrar solo los adelantos de este personal específico (doble verificación)
            const adelantosDelPersonal = adelantosCanceladosData.filter((adelanto: AdelantoPersonal) =>
              adelanto.id_personal === idPersonal
            );

            // 3. Obtener la fecha exacta del pago realizado
            const fechaPago = new Date(pagoRealizado.fecha_pago);

            // 4. Obtener la fecha de actualización (cuando se marcó como cancelado)
            // Para un rango de tiempo razonable alrededor de la fecha de pago (1 día antes/después)
            const fechaInicioPago = new Date(fechaPago);
            fechaInicioPago.setDate(fechaInicioPago.getDate() - 1);
            const fechaFinPago = new Date(fechaPago);
            fechaFinPago.setDate(fechaFinPago.getDate() + 1);

            // 5. Solo incluir adelantos cuya fecha de actualización esté dentro de este rango
            // esto indica que probablemente fueron cancelados como parte de este pago
            adelantosCancelados = adelantosDelPersonal.filter((adelanto: AdelantoPersonal) => {
              if (!adelanto.updated_at) return false;

              const fechaActualizacion = new Date(adelanto.updated_at);
              const dentroDeFechasPago = fechaActualizacion >= fechaInicioPago &&
                fechaActualizacion <= fechaFinPago;

              console.log(`Adelanto ${adelanto.id_adelanto_pago} actualizado el ${fechaActualizacion.toISOString()}. ¿Dentro de rango de pago (${fechaInicioPago.toISOString()} - ${fechaFinPago.toISOString()})? ${dentroDeFechasPago ? 'SÍ' : 'NO'}`);

              return dentroDeFechasPago;
            });

            console.log(`Adelantos cancelados FILTRADOS para el personal ${idPersonal} en pago del ${fechaPago.toISOString()}:`, adelantosCancelados);

            // Calcular total de adelantos cancelados con este pago específico
            totalAdelantosCancelados = adelantosCancelados.reduce(
              (sum, adelanto) => sum + Number(adelanto.monto), 0
            );
          }
        } catch (error) {
          console.error("Error al cargar adelantos cancelados:", error);
        }
      }

      // Calcular total de adelantos pendientes
      const totalAdelantosPendientes = adelantosPersonal.reduce(
        (sum, adelanto) => sum + Number(adelanto.monto), 0
      );

      const detalles: DetallePersonal = {
        personal: personalObj,
        asistencias: asistenciasFormateadas,
        tareasExtra: tareasPersonal,
        adelantos: adelantosPersonal,
        adelantosCancelados: adelantosCancelados,
        cocciones: detallesCocciones,
        totales: {
          asistencia: resumenObj.total_asistencia,
          tareas_extra: resumenObj.total_tareas_extra,
          coccion: resumenObj.total_coccion,
          adelantos: totalAdelantosPendientes, // Usar el total calculado de adelantos pendientes
          adelantosCancelados: totalAdelantosCancelados, // Total de adelantos cancelados
          descuentos: resumenObj.total_descuentos,
          final: totalFinalSinDescuento - totalAdelantosPendientes, // Restar los adelantos pendientes
          final_pagado: totalFinalPagado
        }
      };

      setDetallePersonal(detalles);
      setDetalleModalOpen(true);

    } catch (error) {
      console.error("Error al cargar detalles:", error);
      toast.error("Error al cargar los detalles del pago");
    } finally {
      setLoadingDetalles(false);
    }
  };

  // Función para cerrar el modal de detalles
  const handleCloseDetalleModal = () => {
    setDetalleModalOpen(false);
    setDetallePersonal(null);
  };

  // Función para abrir el modal de detalles y cargar la información del personal
  const handleOpenDetalleModal = async (idPersonal: number) => {
    setLoadingDetalles(true);
    setSelectedRow(idPersonal);

    // Primero cargar los datos de la empresa para asegurar que tenemos el logo
    await fetchEmpresaData();

    // Luego cargar los detalles del personal
    cargarDetallesPersonal(idPersonal);
  };

  // Función para abrir el modal de pago y cargar la información del resumen de pago
  const handleOpenPagoModal = (resumen: ResumenPago) => {
    setSelectedPago(resumen);
    setDescuentosSeleccionados([]); // Reiniciar descuentos seleccionados
    setPagoModalOpen(true);
  };

  // Arreglar funciones que faltan
  function handlePagoClick(resumen: ResumenPago) {
    // Limpiar los descuentos seleccionados
    setDescuentosSeleccionados([]);

    // Establecer el total de descuentos en 0 inicialmente
    const pagoSinDescuentos = {
      ...resumen,
      total_descuentos: 0,
      total_final: resumen.total_asistencia +
        resumen.total_tareas_extra +
        resumen.total_coccion
    };

    // Establecer el pago seleccionado sin descuentos aplicados inicialmente
    setSelectedPago(pagoSinDescuentos);

    // Abrir modal de pago
    setPagoModalOpen(true);
  }

  // Añadir las funciones que faltan
  function puedesCerrarSemana(): boolean {
    // Verificar primero si hay una semana activa seleccionada
    if (!semanaSeleccionada) {
      return false;
    }

    // Verificar si la semana seleccionada está activa (estado = 1)
    const semanaActiva = semanasLaboral.find(s =>
      s.id_semana_laboral.toString() === semanaSeleccionada && s.estado === 1
    );

    if (!semanaActiva) {
      return false;
    }

    // Verificar si hay pagos pendientes
    const pagosPendientes = resumenPagos.filter(r =>
      !pagosRealizados.some(p =>
        p.id_personal === r.id_personal &&
        p.id_semana_laboral.toString() === semanaSeleccionada
      )
    );

    // Solo se puede cerrar si no hay pagos pendientes
    return pagosPendientes.length === 0;
  }

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isClosingSemana, setIsClosingSemana] = useState(false);

  async function confirmCerrarSemana() {
    try {
      setIsClosingSemana(true);

      // Usar el mismo enfoque que en el dashboard
      const response = await fetch(`/api/semana_laboral`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_semana_laboral: Number(semanaSeleccionada),
          estado: 0 // Actualizar estado a "cerrado"
        })
      });

      if (!response.ok) {
        throw new Error("Error al cerrar la semana");
      }

      toast.success("Semana cerrada correctamente");
      setShowCloseModal(false);

      // Recargar las semanas laborales
      await fetchSemanasLaborales();

    } catch (error) {
      console.error("Error al cerrar semana:", error);
      toast.error("Error al cerrar la semana");
    } finally {
      setIsClosingSemana(false);
    }
  }

  async function handleApplyDescuentos() {
    if (!selectedPago) return;

    // Calcular el total de descuentos
    const totalDescuentos = descuentosSeleccionados.reduce((sum, d) => sum + Number(d.monto), 0);
    
    // Ya no procesamos pagos parciales aquí - se procesarán en handlePagoSubmit
    // Los pagos parciales se mantienen en el array descuentosSeleccionados

    // Actualizar el pago seleccionado con los descuentos
    setSelectedPago({
      ...selectedPago,
      total_descuentos: totalDescuentos,
      total_final: selectedPago.total_asistencia +
        selectedPago.total_tareas_extra +
        selectedPago.total_coccion -
        totalDescuentos
    });

    // Mostrar un mensaje para indicar que los descuentos se aplicarán al procesar el pago
    if (descuentosSeleccionados.some(d => d.tipo === 'adelanto_parcial')) {
      toast.info("Los pagos parciales se registrarán al procesar el pago");
    }

    // Cerrar el modal de descuentos
    setDescuentosModalOpen(false);
  }

  function handleClosePagoModal() {
    setPagoModalOpen(false);
    setSelectedPago(null);
    setDescuentosSeleccionados([]);
  }

  async function cargarAdelantosPendientes(idPersonal: number) {
    try {
      const response = await fetch(`/api/adelanto_pago?id_personal=${idPersonal}&estado=Pendiente`);
      if (!response.ok) throw new Error("Error al cargar adelantos pendientes");

      const adelantos = await response.json();
      return adelantos;
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar adelantos pendientes");
      return [];
    }
  }

  async function handlePagoSubmit(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    event.preventDefault();
    if (!selectedPago || !semanaSeleccionada) {
      toast.error("No hay pago seleccionado o semana activa");
      return;
    }

    // Validar que haya descuentos seleccionados si corresponde
    const totalDescuentos = descuentosSeleccionados.reduce(
      (sum, d) => sum + (Number(d.monto) || 0),
      0
    );

    // Sumar todos los descuentos seleccionados (adelantos y descuentos)
    const adelantosAplicados = descuentosSeleccionados
      .filter(d => d.tipo === 'adelanto' && d.id)
      .map(d => d.id) as number[];

    // Construir el payload para el pago
    const payload = {
      id_personal: selectedPago.id_personal,
      id_semana_laboral: Number(semanaSeleccionada),
      dias_completos: selectedPago.dias_completos,
      costo_pago_diario: selectedPago.pago_aplicado === 'reducido'
        ? personal.find(p => p.id_personal === selectedPago.id_personal)?.pago_diario_reducido
        : personal.find(p => p.id_personal === selectedPago.id_personal)?.pago_diario_normal,
      medio_dias: selectedPago.medios_dias,
      total_asistencia_pago: selectedPago.total_asistencia,
      total_tareas_extra: selectedPago.total_tareas_extra,
      total_coccion: selectedPago.total_coccion,
      total_adelantos: selectedPago.total_adelantos,
      total_descuentos: totalDescuentos,
      total_pago_final: selectedPago.total_asistencia +
        selectedPago.total_tareas_extra +
        selectedPago.total_coccion -
        totalDescuentos,
      estado: "Pagado",
      fecha_pago: new Date().toISOString(),
      descuentos: descuentosSeleccionados, // Para referencia en backend si se requiere
      adelantos_aplicados: adelantosAplicados
    };

    setIsSubmitting(true);
    try {
      // 1. Registrar el pago
      const response = await fetch("/api/pago_personal_semana", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al procesar el pago");
      }

      // Obtener los datos del pago recién creado
      const nuevoPago = await response.json();

      // 2. Procesar pagos parciales de adelanto (antes se hacía en handleApplyDescuentos)
      const pagosParciales = descuentosSeleccionados.filter(d => d.tipo === 'adelanto_parcial');
      if (pagosParciales.length > 0) {
        try {
          // Registrar los pagos parciales en la API
          for (const pagoParcial of pagosParciales) {
            // Solo procesamos si tiene la referencia al adelanto original
            if (pagoParcial.adelanto_original) {
              const adelanto = pagoParcial.adelanto_original;
              
              // Datos para el pago parcial
              const dataPagoParcial = {
                fecha: new Date().toISOString().split('T')[0], // Fecha actual
                monto_pagado: pagoParcial.monto,
                id_semana_laboral: selectedPago.id_semana_laboral,
                observacion: `Pago parcial registrado en planilla de ${formatDate(new Date())}`
              };
              
              // Llamar a la API para registrar el pago parcial
              const parcialResponse = await fetch(`/api/adelanto_pago/${adelanto.id_adelanto_pago}/detalle`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataPagoParcial)
              });
              
              if (!parcialResponse.ok) {
                const errorData = await parcialResponse.json();
                throw new Error(errorData.message || 'Error al registrar pago parcial');
              }
              
              // Actualizar el estado de adelantos si se canceló completamente
              const responseData = await parcialResponse.json();
              if (responseData.saldo && responseData.saldo.saldo === 0) {
                // Actualizar el estado en la API
                await fetch(`/api/adelanto_pago?id=${adelanto.id_adelanto_pago}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ 
                    estado: "Cancelado",
                    comentario: `Cancelado por pagos parciales completados en ${formatDate(new Date())}`
                  })
                });
              }
            }
          }
        } catch (error) {
          console.error('Error al registrar pagos parciales:', error);
          toast.error(error instanceof Error ? error.message : 'Error al registrar pagos parciales');
        }
      }

      // 3. Marcar adelantos aplicados como "Cancelado" y guardar referencia al pago
      if (adelantosAplicados.length > 0) {
        await Promise.all(
          adelantosAplicados.map(async (id) => {
            await fetch(`/api/adelanto_pago?id=${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                estado: "Cancelado",
                comentario: `Cancelado por pago #${nuevoPago.id_pago_personal_semana}`
              })
            });
          })
        );
      }

      toast.success("Pago procesado correctamente");
      
      // Si se procesaron pagos parciales, mostrar mensaje adicional
      if (pagosParciales.length > 0) {
        toast.success(`Se registraron ${pagosParciales.length} pagos parciales de adelantos`);
      }

      // 3. Cerrar el modal y limpiar estados
      setPagoModalOpen(false);
      setSelectedPago(null);
      setDescuentosSeleccionados([]);
      setDescuentoTemp({ monto: '', motivo: '' });

      // 4. Recargar datos
      await fetchPagosRealizados(semanaSeleccionada);
      await cargarDatosCompletos(semanaSeleccionada);

    } catch (error) {
      console.error("Error al procesar el pago:", error);
      toast.error(error instanceof Error ? error.message : "Error al procesar el pago");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Función para eliminar un pago
  const handleDeletePago = async () => {
    if (!pagoToDelete) return;

    try {
      setIsSubmitting(true);
      
      // Primero obtener detalles del pago para saber qué revertir
      const pagoResponse = await fetch(`/api/pago_personal_semana?id=${pagoToDelete}`);
      if (!pagoResponse.ok) {
        throw new Error("Error al obtener detalles del pago");
      }
      
      const pagoData = await pagoResponse.json();
      console.log("Datos del pago a eliminar:", pagoData);
      
      // Buscar adelantos con comentario que menciona este pago
      const busquedaComentario = `Cancelado por pago #${pagoToDelete}`;
      const adelantosResponse = await fetch(
        `/api/adelanto_pago?id_personal=${pagoData.id_personal}&estado=Cancelado`
      );
      
      let adelantosARevertir = [];
      if (adelantosResponse.ok) {
        const adelantos = await adelantosResponse.json();
        
        // Filtrar manualmente por el comentario que incluye el ID del pago
        adelantosARevertir = adelantos.filter((adelanto: any) => 
          adelanto.comentario && adelanto.comentario.includes(busquedaComentario)
        );
        
        console.log("Adelantos a revertir encontrados por comentario:", adelantosARevertir);
      }
      
      // Si no encontramos adelantos por comentario, intentamos con el rango de fechas
      if (adelantosARevertir.length === 0) {
        console.log("No se encontraron adelantos por comentario, intentando con fechas...");
        
        const fechaPago = new Date(pagoData.fecha_pago);
        const rangoInicio = new Date(fechaPago);
        rangoInicio.setHours(rangoInicio.getHours() - 24);
        const rangoFin = new Date(fechaPago);
        rangoFin.setHours(rangoFin.getHours() + 24);
        
        // Obtener todos los adelantos cancelados del personal
        const todosAdelantosResponse = await fetch(
          `/api/adelanto_pago?id_personal=${pagoData.id_personal}&estado=Cancelado`
        );
        
        if (todosAdelantosResponse.ok) {
          const todosAdelantos = await todosAdelantosResponse.json();
          
          // Filtrar por fecha de actualización
          adelantosARevertir = todosAdelantos.filter((adelanto: any) => {
            if (!adelanto.updated_at) return false;
            const fechaActualizacion = new Date(adelanto.updated_at);
            return fechaActualizacion >= rangoInicio && fechaActualizacion <= rangoFin;
          });
          
          console.log("Adelantos a revertir encontrados por fecha:", adelantosARevertir);
        }
      }
      
      // Obtener descuentos aplicados con este pago
      const fechaInicioSemana = new Date(pagoData.semana_laboral.fecha_inicio);
      const fechaFinSemana = new Date(pagoData.semana_laboral.fecha_fin);
      
      const descuentosResponse = await fetch(
        `/api/descuento_personal?id_personal=${pagoData.id_personal}&fecha_inicio=${fechaInicioSemana.toISOString()}&fecha_fin=${fechaFinSemana.toISOString()}`
      );
      
      let descuentosAplicados = [];
      if (descuentosResponse.ok) {
        descuentosAplicados = await descuentosResponse.json();
        console.log("Descuentos a eliminar:", descuentosAplicados);
      }
      
      // Eliminar el pago
      const response = await fetch(`/api/pago_personal_semana?id=${pagoToDelete}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el pago");
      }
      
      // Revertir adelantos cancelados a "Pendiente"
      let resultadosReversos = [];
      if (adelantosARevertir.length > 0) {
        resultadosReversos = await Promise.all(
          adelantosARevertir.map(async (adelanto: any) => {
            console.log(`Revirtiendo adelanto #${adelanto.id_adelanto_pago} a Pendiente`);
            const resp = await fetch(`/api/adelanto_pago?id=${adelanto.id_adelanto_pago}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                estado: "Pendiente",
                comentario: adelanto.comentario ? `${adelanto.comentario} - Revertido a Pendiente` : "Revertido a Pendiente"
              })
            });
            
            if (!resp.ok) {
              console.error(`Error al revertir adelanto #${adelanto.id_adelanto_pago}:`, await resp.text());
              return false;
            }
            return true;
          })
        );
        
        console.log("Resultados de reversión de adelantos:", resultadosReversos);
        
        if (resultadosReversos.some(r => r === false)) {
          toast.warning("Algunos adelantos no pudieron ser revertidos correctamente");
        } else if (resultadosReversos.length > 0) {
          toast.success(`${resultadosReversos.length} adelantos revertidos a Pendiente`);
        }
      } else {
        console.log("No se encontraron adelantos para revertir");
      }
      
      // Eliminar descuentos asociados a este pago
      if (descuentosAplicados.length > 0) {
        const resultadosDescuentos = await Promise.all(
          descuentosAplicados.map(async (descuento: any) => {
            const resp = await fetch(`/api/descuento_personal?id=${descuento.id_descuento_personal}`, {
              method: "DELETE"
            });
            return resp.ok;
          })
        );
        
        if (resultadosDescuentos.some(r => r === false)) {
          toast.warning("Algunos descuentos no pudieron ser eliminados");
        } else if (resultadosDescuentos.length > 0) {
          toast.success(`${resultadosDescuentos.length} descuentos eliminados`);
        }
      }

      toast.success("Pago eliminado correctamente");

      // Cerrar el modal y limpiar estados
      setShowConfirmDeletePagoModal(false);
      setPagoToDelete(null);

      // Recargar datos
      await fetchPagosRealizados(semanaSeleccionada);
      await cargarDatosCompletos(semanaSeleccionada);
    } catch (error) {
      console.error("Error al eliminar el pago:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar el pago");
    } finally {
      setIsSubmitting(false);
    }
  }


  // Corregir el error en la tabla duplicada
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Pago Personal</h1>
        <p className="text-muted-foreground">
          Registre pagos, adelantos, tareas extra, descuentos del personal.
        </p>
      </div>

      {/* Filtros y Acciones */}
      <div className="flex flex-col md:flex-row justify-between gap-2">
        <div className="w-full md:w-[300px]">
          <Label>Semana Laboral</Label>
          <Select value={semanaSeleccionada} onValueChange={setSemanaSeleccionada}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Seleccione una semana" />
            </SelectTrigger>
            <SelectContent>
              {semanasLaboral.map((semana) => (
                <SelectItem
                  key={semana.id_semana_laboral}
                  value={semana.id_semana_laboral.toString()}
                  className={semana.estado === 1 ? "font-semibold" : ""}
                >
                  {formatDate(semana.fecha_inicio)} - {formatDate(semana.fecha_fin)}
                  {semana.estado === 1 ? " ✓ (Activa)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* card total asistencia */}
        <div>
          <Card className="w-[320px] bg-blue-50/50 py-0">
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-sm font-medium">Total sin descuento</CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    Asistencia, T.Extra, Cocción
                  </CardDescription>
                </div>
                <div className="text-lg font-bold text-blue-600">
                  S/. {resumenPagos.reduce((sum, item) =>
                    sum + item.total_asistencia + item.total_tareas_extra + item.total_coccion,
                    0
                  ).toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botón de cerrar semana */}
        <Button
          variant="outline"
          className={`h-full ${puedesCerrarSemana() ? 'bg-green-50 hover:bg-green-100 border-green-200' : 'bg-gray-100 text-gray-400'}`}
          disabled={!puedesCerrarSemana()}
          onClick={() => setShowCloseModal(true)} // Usa setShowCloseModal, no setShowConfirmModal
        >
          <Check className={`mr-2 h-4 w-4 ${puedesCerrarSemana() ? 'text-green-600' : 'text-gray-400'}`} />
          Cerrar Semana
        </Button>
        <div className="flex flex-col md:flex-row w-full md:w-auto gap-2 md:gap-2">
          <Button
            onClick={() => setAdelantoModalOpen(true)}
            className="w-full md:w-auto"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Adelanto Pago
          </Button>
          <Button
            onClick={() => setTareaModalOpen(true)}
            className="w-full md:w-auto"
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Agregar Tarea Extra
          </Button>
        </div>
      </div>

      {/* Sistema de tabs */}
      <Tabs defaultValue="pendientes" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="pendientes">Pagos pendientes</TabsTrigger>
          <TabsTrigger value="realizados">Pagos realizados</TabsTrigger>
        </TabsList>

        {/* Tab de pagos pendientes */}
        <TabsContent value="pendientes" className="mt-0">
          {/* Tabla de Resumen de Pagos */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2} className="align-bottom text-center">ID</TableHead>
                  <TableHead rowSpan={2} className="align-bottom">Personal</TableHead>
                  <TableHead colSpan={2} className="text-center border-b">Asistencia</TableHead>
                  <TableHead colSpan={2} className="text-center border-b">P. actual</TableHead>
                  <TableHead rowSpan={2} className="text-right align-bottom">S/. Total<br />Asistencia</TableHead>
                  <TableHead rowSpan={2} className="text-right align-bottom">S/. Total<br />Tareas Extra</TableHead>
                  <TableHead rowSpan={2} className="text-right align-bottom">S/. Total<br />Cocción</TableHead>
                  <TableHead rowSpan={2} className="text-right align-bottom">S/.<br />Adelantos</TableHead>
                  <TableHead rowSpan={2} className="text-right align-bottom">S/. Total<br />sin descontar</TableHead>
                  <TableHead rowSpan={2} className="text-right align-bottom">Acciones</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-center border-b">
                    <Check className="h-4 w-4 mx-auto text-green-600" />
                  </TableHead>
                  <TableHead className="text-center border-b">
                    <AlertCircle className="h-4 w-4 mx-auto text-yellow-600" />
                  </TableHead>
                  <TableHead className="text-center border-b">
                    P. normal
                  </TableHead>
                  <TableHead className="text-center border-b">
                    P. reducido
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isLoading && resumenPagos.map((resumen) => {
                  const personalObj = personal.find(p => p.id_personal === resumen.id_personal);
                  const tienePagoReducido = personalObj?.pago_diario_reducido && personalObj.pago_diario_reducido > 0;
                  const pagoAplicado = resumen.pago_aplicado || 'normal';

                  // Verificar si ya existe un pago realizado para este personal en esta semana
                  const pagoYaRealizado = pagosRealizados.some(
                    pago => pago.id_personal === resumen.id_personal &&
                      pago.id_semana_laboral.toString() === semanaSeleccionada
                  );

                  // No mostrar en pagos pendientes si ya tiene un pago realizado
                  if (pagoYaRealizado) return null;

                  return (
                    <TableRow key={resumen.id_personal}
                      className={`cursor-pointer transition-colores ${selectedRow === resumen.id_personal
                        ? "bg-muted hover:bg-muted/80"
                        : "hover:bg-muted/50"
                        }`}
                      onClick={() => setSelectedRow(resumen.id_personal)}
                    >
                      <TableCell className="text-center">{resumen.id_personal}</TableCell>
                      <TableCell className="font-medium">{resumen.nombre_completo}</TableCell>
                      <TableCell className="text-center">{resumen.dias_completos}</TableCell>
                      <TableCell className="text-center">{resumen.medios_dias}</TableCell>
                      {/* P. normal - Solo se resalta cuando se está aplicando */}
                      <TableCell
                        className={`text-center ${pagoAplicado === 'normal'
                          ? 'font-bold bg-green-100 text-green-900'
                          : 'text-gray-600'
                          }`}
                      >
                        {personalObj?.pago_diario_normal != null
                          ? (typeof personalObj.pago_diario_normal === 'number'
                            ? personalObj.pago_diario_normal.toFixed(2)
                            : Number(personalObj.pago_diario_normal).toFixed(2))
                          : '-'}
                      </TableCell>
                      {/* P. reducido - Solo se resalta cuando existe Y se está aplicando */}
                      <TableCell
                        className={`text-center ${tienePagoReducido
                          ? (pagoAplicado === 'reducido'
                            ? 'font-bold bg-yellow-200 text-yellow-900'
                            : 'text-gray-600')
                          : 'text-gray-400'
                          }`}
                      >
                        {tienePagoReducido && personalObj?.pago_diario_reducido != null
                          ? (typeof personalObj.pago_diario_reducido === 'number'
                            ? personalObj.pago_diario_reducido.toFixed(2)
                            : Number(personalObj.pago_diario_reducido).toFixed(2))
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">{resumen.total_asistencia.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{resumen.total_tareas_extra.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{resumen.total_coccion.toFixed(2)}</TableCell>
                      <TableCell className={`text-right ${resumen.total_adelantos > 0 ? 'bg-red-100 text-red-800 font-medium rounded-md px-2' : ''}`}>
                        {resumen.total_adelantos.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-bold">{resumen.total_final.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setLoadingDetalles(true);
                              setSelectedRow(resumen.id_personal);
                              // Implementar ver detalle
                              cargarDetallesPersonal(resumen.id_personal);
                            }}
                          >
                            {loadingDetalles && selectedRow === resumen.id_personal ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePagoClick(resumen);
                            }}
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2">Cargando datos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !semanaSeleccionada && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <AlertCircle className="h-6 w-6 text-amber-500" />
                        <span className="ml-2 text-amber-600 font-medium">No hay ninguna semana laboral activa para realizar pagos</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && semanaSeleccionada && resumenPagos.filter(r =>
                  !pagosRealizados.some(p => p.id_personal === r.id_personal &&
                    p.id_semana_laboral.toString() === semanaSeleccionada)
                ).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <div className="text-muted-foreground">
                          No hay pagos pendientes para esta semana
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab de pagos realizados */}
        <TabsContent value="realizados" className="mt-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Personal</TableHead>
                  <TableHead className="text-center">Fecha de pago</TableHead>
                  <TableHead className="text-right">Asistencia</TableHead>
                  <TableHead className="text-right">Tareas Extra</TableHead>
                  <TableHead className="text-right">Cocción</TableHead>
                  <TableHead className="text-right">Adelantos</TableHead>
                  <TableHead className="text-right">Descuentos</TableHead>
                  <TableHead className="text-right">Total Final</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loadingPagosRealizados && pagosRealizados
                  .filter(pago => pago.id_semana_laboral.toString() === semanaSeleccionada)
                  .map((pago) => {
                    const personalObj = personal.find(p => p.id_personal === pago.id_personal);

                    return (
                      <TableRow key={pago.id_pago_personal_semana}>
                        <TableCell className="text-center">{pago.id_personal}</TableCell>
                        <TableCell className="font-medium">
                          {personalObj?.nombre_completo || `Personal ID: ${pago.id_personal}`}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatDate(pago.fecha_pago)}
                        </TableCell>
                        <TableCell className="text-right">
                          S/. {Number(pago.total_asistencia_pago || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          S/. {Number(pago.total_tareas_extra || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          S/. {Number(pago.total_coccion || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          S/. {Number(pago.total_adelantos || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          S/. {Number(pago.total_descuentos || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          S/. {Number(pago.total_pago_final || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium ${pago.estado === 'Pagado' ? 'text-green-600' : 'text-red-600'}`}>
                            {pago.estado}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setLoadingDetalles(true);
                                // Implementar ver detalle de pago realizado
                                cargarDetallesPersonal(pago.id_personal);
                              }}
                            >
                              {loadingDetalles && selectedRow === pago.id_personal ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setPagoToDelete(pago.id_pago_personal_semana);
                                setShowConfirmDeletePagoModal(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                {loadingPagosRealizados && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2">Cargando pagos realizados...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!loadingPagosRealizados && pagosRealizados
                  .filter(pago => pago.id_semana_laboral.toString() === semanaSeleccionada)
                  .length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="text-muted-foreground">
                          No hay pagos realizados para esta semana
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={adelantoModalOpen} onOpenChange={setAdelantoModalOpen}>
        <DialogContent className="sm:max-w-[800px] lg:max-w-[1000px] w-[90vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {adelantoData.id_adelanto_pago ? "Actualizar Adelanto" : "Registrar Adelanto"}
            </DialogTitle>
            <DialogDescription>
              {adelantoData.id_adelanto_pago
                ? "Modifique los detalles del adelanto de pago."
                : "Ingrese los detalles del adelanto de pago para el personal."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-4 md:gap-6">
            {/* Formulario de Adelanto */}
            <div className="space-y-3 md:space-y-4">
              {/* Información de la Semana */}
              <div className="rounded-lg border p-3 bg-muted/50">
                <Label>Semana Seleccionada:</Label>
                {semanaSeleccionada && (
                  <p className="text-sm mt-1">
                    {(() => {
                      const semana = semanasLaboral.find(s => s.id_semana_laboral.toString() === semanaSeleccionada);
                      if (semana) {
                        return `${formatDate(semana.fecha_inicio)} - ${formatDate(semana.fecha_fin)}`;
                      }
                      return "Seleccione una semana";
                    })()}

                  </p>
                )}
              </div>

              {/* Personal Select */}
              <div className="grid gap-2 w-full">
                <Label htmlFor="personal">Personal</Label>
                <Select
                  value={adelantoData.id_personal?.toString()}
                  onValueChange={(value) =>
                    setAdelantoData({
                      ...adelantoData,
                      id_personal: Number(value),
                      id_semana_laboral: Number(semanaSeleccionada),
                      estado: "Pendiente"
                    })
                  }
                  disabled={!!adelantoData.id_adelanto_pago} // Deshabilitar en modo edición
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione al personal" />
                  </SelectTrigger>
                  <SelectContent>
                    {personal.map((p) => (
                      <SelectItem key={p.id_personal} value={p.id_personal.toString()}>
                        {p.nombre_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fecha">Fecha de adelanto</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={adelantoData.fecha}
                  onChange={(e) =>
                    setAdelantoData({ ...adelantoData, fecha: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="monto">Monto</Label>
                <Input
                  id="monto"
                  type="number"
                  value={adelantoData.monto || ""}
                  onChange={(e) =>
                    setAdelantoData({ ...adelantoData, monto: Number(e.target.value) })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción (Opcional)</Label>
                <Textarea
                  id="descripcion"
                  value={adelantoData.comentario || ""}
                  onChange={(e) =>
                    setAdelantoData({ ...adelantoData, comentario: e.target.value })
                  }
                  placeholder="Ingrese una descripción"
                />
              </div>
            </div>

            {/* Tabla de Adelantos */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Personal</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adelantos.filter(adelanto => adelanto.estado === "Pendiente").map((adelanto) => (
                      <TableRow key={adelanto.id_adelanto_pago}>
                        <TableCell>{formatDate(adelanto.fecha)}</TableCell>
                        <TableCell>
                          {adelanto.personal?.nombre_completo ||
                            todosPersonal.find(p => p.id_personal === adelanto.id_personal)?.nombre_completo ||
                            "Personal no encontrado"}
                        </TableCell>
                        <TableCell className="text-right">
                          {(typeof adelanto.monto === 'number' ? adelanto.monto : Number(adelanto.monto)).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={adelanto.estado === "Pendiente" ? "destructive" : "default"}
                            className={adelanto.estado === "Pendiente"
                              ? "bg-red-50 text-red-600 hover:bg-red-50"
                              : "bg-green-100 text-green-600 hover:bg-green-100"
                            }
                          >
                            {adelanto.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditAdelanto(adelanto)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => adelanto.id_adelanto_pago && handleDeleteAdelanto(adelanto.id_adelanto_pago)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {adelantos.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No hay adelantos registrados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdelantoModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdelantoSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {adelantoData.id_adelanto_pago ? "Actualizando..." : "Guardando..."}
                </>
              ) : (
                adelantoData.id_adelanto_pago ? "Actualizar" : "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Tarea Extra */}
      <Dialog open={tareaModalOpen} onOpenChange={setTareaModalOpen}>
        <DialogContent className="sm:max-w-[800px] lg:max-w-[1000px] w-[90vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle>
              {tareaData.id_tarea_extra ? "Editar Tarea Extra" : "Registrar Tarea Extra"}
            </DialogTitle>
            <DialogDescription>
              {tareaData.id_tarea_extra
                ? "Modifique los detalles de la tarea extra."
                : "Ingrese los detalles de la tarea extra realizada por el personal."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-4">
            {/* Formulario de Tarea Extra */}
            <div className="space-y-3">
              {/* Información de la Semana */}
              <div className="rounded-lg border p-2 bg-muted/50">
                <Label>Semana Seleccionada:</Label>
                {semanaSeleccionada && (
                  <p className="text-sm mt-0.5">
                    {(() => {
                      const semana = semanasLaboral.find(s => s.id_semana_laboral.toString() === semanaSeleccionada);
                      if (semana) {
                        return `${formatDate(semana.fecha_inicio)} - ${formatDate(semana.fecha_fin)}`;
                      }
                      return "Seleccione una semana";
                    })()}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="selection-mode">Modo de selección</Label>
                <Select
                  value={isMultipleSelection ? "multiple" : "single"}
                  onValueChange={(value) => {
                    setIsMultipleSelection(value === "multiple");
                    setSelectedPersonal([]);
                    setTareaData(prev => {
                      const { id_personal, ...rest } = prev;
                      return { ...rest };
                    });
                  }}
                  disabled={!!tareaData.id_tarea_extra} // Deshabilitar si es edición
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione modo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Personal Individual</SelectItem>
                    <SelectItem value="multiple">Múltiples Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="personal">
                  {isMultipleSelection ? "Seleccionar Personal" : "Personal"}
                </Label>
                {isMultipleSelection ? (
                  <div className="border rounded-md p-2 max-h-[150px] overflow-y-auto space-y-1">
                    {personal.map((p) => (
                      <div key={p.id_personal} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`personal-${p.id_personal}`}
                          checked={selectedPersonal.includes(p.id_personal)}
                          onChange={(e) => {
                            const newSelected = e.target.checked
                              ? [...selectedPersonal, p.id_personal]
                              : selectedPersonal.filter(id => id !== p.id_personal);
                            setSelectedPersonal(newSelected);
                            setTareaData(prev => {
                              // Remove id_personal from tareaData in multiple mode to avoid type error
                              const { id_personal, ...rest } = prev;
                              return { ...rest };
                            });
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label
                          htmlFor={`personal-${p.id_personal}`}
                          className="text-sm cursor-pointer"
                        >
                          {p.nombre_completo}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Select
                    value={tareaData.id_personal?.toString()}
                    onValueChange={(value) =>
                      setTareaData({ ...tareaData, id_personal: Number(value) })
                    }
                    disabled={!!tareaData.id_tarea_extra} // Deshabilitar si es edición
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione al personal" />
                    </SelectTrigger>
                    <SelectContent>
                      {personal.map((p) => (
                        <SelectItem key={p.id_personal} value={p.id_personal.toString()}>
                          {p.nombre_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={tareaData.fecha}
                    onChange={(e) =>
                      setTareaData({ ...tareaData, fecha: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="monto">Monto a Pagar</Label>
                  <Input
                    id="monto"
                    type="number"
                    value={tareaData.monto || ""}
                    onChange={(e) =>
                      setTareaData({ ...tareaData, monto: Number(e.target.value) })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="descripcion">Descripción de la Tarea</Label>
                <Textarea
                  id="descripcion"
                  value={tareaData.descripcion || ""}
                  onChange={(e) =>
                    setTareaData({ ...tareaData, descripcion: e.target.value })
                  }
                  placeholder="Describa la tarea extra realizada"
                  className="min-h-[80px]"
                />
              </div>
            </div>

            {/* Tabla de Tareas Extras */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Personal</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {semanaSeleccionada && tareasExtra.length > 0 ? (
                      tareasExtra.filter(tarea => tarea.id_semana_laboral.toString() === semanaSeleccionada).map((tarea) => (
                        <TableRow key={tarea.id_tarea_extra}>
                          <TableCell>{formatDate(tarea.fecha)}</TableCell>
                          <TableCell>{tarea.personal?.nombre_completo}</TableCell>
                          <TableCell>{tarea.descripcion}</TableCell>
                          <TableCell className="text-right">
                            {Number(tarea.monto).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setTareaData({
                                    ...tarea,
                                    // Convertir la fecha ISO a formato YYYY-MM-DD para el input type="date"
                                    fecha: new Date(tarea.fecha).toISOString().split('T')[0],
                                    monto: Number(tarea.monto)
                                  });
                                  setIsMultipleSelection(false);
                                  setTareaModalOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  tarea.id_tarea_extra && confirmDeleteTareaExtra(tarea.id_tarea_extra)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No hay tareas extras para la semana seleccionada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setTareaModalOpen(false);
              setSelectedPersonal([]);
              setIsMultipleSelection(false);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleTareaExtraSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tareaData.id_tarea_extra ? "Actualizando..." : "Guardando..."}
                </>
              ) : (
                tareaData.id_tarea_extra ? "Actualizar" : "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Eliminación de Tarea Extra */}
      <AlertDialog open={showConfirmDeleteTareaModal} onOpenChange={setShowConfirmDeleteTareaModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">
              Confirmar eliminación
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              ¿Está seguro que desea eliminar esta tarea extra?
              <p className="mt-2 font-medium text-red-600">
                Esta acción no se puede deshacer.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 mt-4">
            <AlertDialogCancel className="mt-0">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTareaExtra}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmación de Eliminación de Adelanto */}
      <AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">
              Confirmar eliminación
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              ¿Está seguro que desea eliminar este adelanto?
              <p className="mt-2 font-medium text-red-600">
                Esta acción no se puede deshacer.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 mt-4">
            <AlertDialogCancel className="mt-0">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAdelanto}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmación de Cierre de Semana */}
      <AlertDialog open={showCloseModal} onOpenChange={setShowCloseModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">
              Confirmar cierre de semana laboral
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              ¿Está seguro que desea cerrar esta semana laboral?
              <p className="mt-2 font-medium text-orange-600">
                Esta acción no se puede deshacer y ya no podrá registrar nuevos pagos para esta semana.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 mt-4">
            <AlertDialogCancel className="mt-0">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCerrarSemana}
              className="bg-green-600 text-white hover:bg-green-700"
              disabled={isClosingSemana}
            >
              {isClosingSemana ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cerrando...
                </>
              ) : (
                "Confirmar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Pago */}
      <Dialog
        open={pagoModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleClosePagoModal();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="sr-only">Detalles del Pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 print:p-4">
            {/* Cabecera de la empresa */}
            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg">{empresa?.razon_social}</h3>
              <p className="text-sm">RUC: {empresa?.ruc}</p>
              <p className="text-sm">{empresa?.direccion}</p>
            </div>

            {/* Título del recibo */}
            <div className="text-center border-y py-2">
              <h2 className="font-bold text-xl">RECIBO PAGO SEMANAL</h2>
            </div>

            {/* Información del pago */}
            {selectedPago && (
              <div className="space-y-4">
                {/* Fecha y Personal */}
                <div className="space-y-2">
                  <p><span className="font-semibold">Fecha y Hora:</span> {getCurrentDateTime()}</p>
                  <p>
                    <span className="font-semibold">Personal:</span> {
                      personal.find(p => p.id_personal === selectedPago.id_personal)?.dni
                    } - {selectedPago.nombre_completo}
                  </p>
                </div>

                {/* Detalle del pago */}
                <div className="space-y-2 border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span>Total Semana S/.</span>
                    <span>{selectedPago.total_asistencia.toFixed(2)}</span>
                  </div>

                  {/* Detalle de días y tarifa aplicada */}
                  <div className="bg-muted/30 p-2 rounded-md text-xs mb-1">
                    <div className="flex justify-between items-center">
                      <span>Días completos: {selectedPago.dias_completos}</span>
                      <span>Medios días: {selectedPago.medios_dias}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span>
                        Tarifa diaria aplicada:
                        <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-medium rounded 
                          ${selectedPago.pago_aplicado === 'reducido'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'}`}>
                          {selectedPago.pago_aplicado === 'reducido' ? 'REDUCIDA' : 'NORMAL'}
                        </span>
                      </span>
                      <span>
                        S/. {personal.find(p => p.id_personal === selectedPago.id_personal)
                          ? (selectedPago.pago_aplicado === 'reducido'
                            ? Number(personal.find(p => p.id_personal === selectedPago.id_personal)?.pago_diario_reducido || 0).toFixed(2)
                            : Number(personal.find(p => p.id_personal === selectedPago.id_personal)?.pago_diario_normal || 0).toFixed(2))
                          : '0.00'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Tareas Extra S/.</span>
                    <span>{selectedPago.total_tareas_extra.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Servicios cocción S/.</span>
                    <span>{selectedPago.total_coccion.toFixed(2)}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>Descuentos S/.</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDescuentosModalOpen(true)}
                          className="h-8"
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <span>{selectedPago.total_descuentos.toFixed(2)}</span>
                    </div>

                    {/* Detalle de descuentos - Solo mostrar si hay descuentos seleccionados */}
                    {descuentosSeleccionados.length > 0 && (
                      <div className="bg-muted/50 rounded-md p-2 text-sm">
                        <p className="text-muted-foreground text-xs mb-1">Detalle de descuentos:</p>
                        <ul className="space-y-1">
                          {descuentosSeleccionados.map((descuento, index) => (
                            <li key={index} className="flex justify-between items-center">
                              <span className="text-xs truncate max-w-[200px]">
                                {descuento.tipo === 'adelanto' ? '• Adelanto: ' : '• Descuento: '}
                                {descuento.motivo}
                              </span>
                              <span className="text-xs font-medium">S/. {
                                typeof descuento.monto === 'number'
                                  ? descuento.monto.toFixed(2)
                                  : Number(descuento.monto).toFixed(2)
                              }</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>


                {/* Total Final */}
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>TOTAL S/.</span>
                    <span>{selectedPago.total_final.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClosePagoModal}
              >
                Cerrar
              </Button>
              <Button
                onClick={handlePagoSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : "Procesar Pago"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de descuentos */}
      <Dialog
        open={descuentosModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDescuentosModal();
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Gestionar Descuentos</DialogTitle>
            <DialogDescription>
              Seleccione adelantos pendientes o agregue nuevos descuentos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Sección de Adelantos Pendientes */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Adelantos Pendientes</h4>
              <div className="max-h-[150px] overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Semana</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Comentario</TableHead>
                      <TableHead className="w-[80px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adelantos
                      .filter(a => {
                        // Mostrar TODOS los adelantos pendientes del personal seleccionado
                        const esPersonalSeleccionado = selectedPago && a.id_personal === selectedPago.id_personal;
                        const estaPendiente = a.estado === "Pendiente";

                        return esPersonalSeleccionado && estaPendiente;
                      })
                      .sort((a, b) => {
                        // Ordenar por semana (más reciente primero) y luego por fecha
                        if (a.id_semana_laboral !== b.id_semana_laboral) {
                          return b.id_semana_laboral - a.id_semana_laboral;
                        }
                        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
                      })
                      .map((adelanto) => {
                        // Obtener la información de la semana para mostrarla en la tabla
                        const semanaInfo = semanasLaboral.find(s => s.id_semana_laboral === adelanto.id_semana_laboral);
                        const esSemanaActual = adelanto.id_semana_laboral.toString() === semanaSeleccionada;

                        return (
                          <TableRow key={adelanto.id_adelanto_pago} className={esSemanaActual ? "bg-blue-50" : ""}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={descuentosSeleccionados.some(
                                  d => d.tipo === 'adelanto' && d.id === adelanto.id_adelanto_pago
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // Verificar si ya existe este adelanto en los descuentos seleccionados
                                    if (!descuentosSeleccionados.some(
                                      d => d.tipo === 'adelanto' && d.id === adelanto.id_adelanto_pago
                                    )) {
                                      setDescuentosSeleccionados([
                                        ...descuentosSeleccionados,
                                        {
                                          id: adelanto.id_adelanto_pago,
                                          tipo: 'adelanto',
                                          monto: adelanto.monto,
                                          motivo: (adelanto.comentario || 'Adelanto de pago') +
                                            (esSemanaActual ? '' : ` (Semana ${formatDate(semanaInfo?.fecha_inicio || '')})`)
                                        }
                                      ]);
                                    }
                                  } else {
                                    setDescuentosSeleccionados(
                                      descuentosSeleccionados.filter(
                                        d => !(d.tipo === 'adelanto' && d.id === adelanto.id_adelanto_pago)
                                      )
                                    );
                                  }
                                }}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                            </TableCell>
                            <TableCell>{formatDate(adelanto.fecha)}</TableCell>
                            <TableCell>
                              {esSemanaActual ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Actual</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                                  {semanaInfo ? formatDate(semanaInfo.fecha_inicio) : `Sem. ${adelanto.id_semana_laboral}`}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>S/. {
                              typeof adelanto.monto === 'number'
                                ? adelanto.monto.toFixed(2)
                                : Number(adelanto.monto).toFixed(2)
                            }</TableCell>
                            <TableCell>{adelanto.comentario || '-'}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-7 w-7" 
                                onClick={() => handlePagoParcial(adelanto)}
                                title="Pago Parcial"
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {adelantos.filter(a =>
                      selectedPago &&
                      a.id_personal === selectedPago.id_personal &&
                      a.estado === "Pendiente"
                    ).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-3 text-muted-foreground">
                            No hay adelantos pendientes
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Botón para mostrar/ocultar sección de nuevo descuento */}
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => setMostrarNuevoDescuento(!mostrarNuevoDescuento)}
              >
                {mostrarNuevoDescuento ? "Ocultar" : "Agregar otros descuentos"}
                {mostrarNuevoDescuento ? 
                  <Eye className="ml-1 h-3 w-3" /> : 
                  <PlusCircle className="ml-1 h-3 w-3" />
                }
              </Button>
            </div>

            {/* Formulario para Nuevo Descuento - Oculto inicialmente */}
            {mostrarNuevoDescuento && (
              <div className="space-y-3 border p-3 rounded-md bg-gray-50">
                <h4 className="font-medium">Agregar Nuevo Descuento</h4>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="monto" className="text-sm">Monto</Label>
                    <Input
                      id="monto"
                      type="number"
                    value={descuentoTemp.monto}
                    onChange={(e) => setDescuentoTemp({
                      ...descuentoTemp,
                      monto: e.target.value
                    })}
                    placeholder="0.00"
                    className="h-8"
                  />
                </div>
                <div className="flex-[2]">
                  <Label htmlFor="motivo" className="text-sm">Motivo</Label>
                  <Input
                    id="motivo"
                    value={descuentoTemp.motivo}
                    onChange={(e) => setDescuentoTemp({
                      ...descuentoTemp,
                      motivo: e.target.value
                    })}
                    placeholder="Motivo del descuento"
                    className="h-8"
                  />
                </div>
                <Button
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (!descuentoTemp.monto || !descuentoTemp.motivo) {
                      toast.error("Complete todos los campos");
                      return;
                    }
                    setDescuentosSeleccionados([
                      ...descuentosSeleccionados,
                      {
                        tipo: 'descuento',
                        monto: Number(descuentoTemp.monto),
                        motivo: descuentoTemp.motivo
                      }
                    ]);
                    setDescuentoTemp({ monto: '', motivo: '' });
                  }}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
            )}

            {/* Resumen de Descuentos Seleccionados */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Descuentos Seleccionados</h4>
              <div className="max-h-[150px] overflow-y-auto border rounded-md p-4">
                {descuentosSeleccionados.map((descuento, index) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <div>
                      <span className="font-medium">{descuento.motivo}</span>
                      <Badge className="ml-2">
                        {descuento.tipo === 'adelanto' ? 'Adelanto' : 'Descuento'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>S/. {
                        typeof descuento.monto === 'number'
                          ? descuento.monto.toFixed(2)
                          : Number(descuento.monto).toFixed(2)
                      }</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDescuentosSeleccionados(
                            descuentosSeleccionados.filter((_, i) => i !== index)
                          );
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {descuentosSeleccionados.length === 0 && (
                  <p className="text-center text-muted-foreground">
                    No hay descuentos seleccionados
                  </p>
                )}
              </div>
              {descuentosSeleccionados.length > 0 ? (
                <div className="flex justify-between items-center font-medium mt-2">
                  <span>Total Descuentos:</span>
                  <span className="text-red-600">S/. {
                    descuentosSeleccionados
                      .reduce((sum, d) => sum + (Number(d.monto) || 0), 0)
                      .toFixed(2)
                  }</span>
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={handleCloseDescuentosModal}>
              Cancelar
            </Button>
            <Button onClick={handleApplyDescuentos} disabled={descuentosSeleccionados.length === 0}>
              Aplicar Descuentos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalle de Pago - Optimizado para impresora térmica de 80mm */}
      <Dialog open={detalleModalOpen} onOpenChange={setDetalleModalOpen}>
        <DialogContent className="sm:max-w-[350px] w-[95vw] max-h-[90vh] overflow-y-auto p-0 bg-white print:shadow-none print:max-w-[80mm] print:w-[80mm]">
          <DialogTitle className="sr-only">Detalle de Pago</DialogTitle>
          {/* Contenedor principal del recibo - Ticket estilo impresora térmica */}
          <div ref={impresionRef} className="flex flex-col text-[11px] print:text-[9pt] print:m-0 print:p-4 print:w-full">
            {/* Cabecera del ticket */}
              <div className="bg-white p-2 text-center print:bg-white print:px-2 print:py-1">
                {/* Logo de la empresa */}
                {logoLoaded && logoUrl ? (
                  <div className="flex justify-center mb-1 logo-container print:mb-0.5">
                    <img
                      src={`${logoUrl}?t=${new Date().getTime()}`}
                      alt={`Logo de ${empresa?.razon_social || 'la empresa'}`}
                      className="h-10 object-contain print:h-8 mx-auto logo"
                      onLoad={() => console.log("Logo cargado en el modal")}
                      onError={(e) => {
                        console.error("Error al cargar la imagen en el modal:", e);
                        setLogoLoaded(false);
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex justify-center mb-1 print:mb-0.5">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center print:h-8 print:w-8">
                      <span className="text-gray-500 text-xs">Logo</span>
                    </div>
                  </div>
                )}
                <div className="space-y-0 leading-tight header-no-space">
                  <p className="text-xs mb-0 font-semibold print:text-[9pt] print:font-bold">
                    {empresa?.razon_social || "EMPRESA"} - RUC: {empresa?.ruc || ""}
                  </p>
                  <p className="text-xs text-muted-foreground mb-0 print:text-[8pt] print:text-black">
                    {semanasLaboral.find(s => s.id_semana_laboral.toString() === semanaSeleccionada)
                      ? `Semana: ${formatDate(semanasLaboral.find(s => s.id_semana_laboral.toString() === semanaSeleccionada)!.fecha_inicio)} - 
                        ${formatDate(semanasLaboral.find(s => s.id_semana_laboral.toString() === semanaSeleccionada)!.fecha_fin)}`
                      : "Semana no seleccionada"}
                  </p>
                  <p className="text-xs print:text-[8pt]">{getCurrentDateTime()}</p>
                </div>
                <h2 className="pt-0.5 pb-0 font-bold text-base print:text-[12pt]">RECIBO DE PAGO SEMANAL</h2>

                <div className="my-1 border-t border-dashed border-gray-500 print:my-0.5"></div>
              </div>            {loadingDetalles ? (
              <div className="flex justify-center items-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Cargando detalles...</span>
              </div>
            ) : (
              <>
                {/* Información del trabajador */}
                <div className="p-1 print:p-0.5">
                  <div className="text-center font-bold mb-0.5 print:mb-0 print:text-[10pt]">DATOS DEL PERSONAL</div>
                  <div className="flex flex-col text-xs space-y-0 print:text-[9pt] print:space-y-0">
                    <div className="flex justify-between">
                      <span className="font-medium">Personal:</span>
                      <span className="text-right">{detallePersonal?.personal?.nombre_completo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">DNI:</span>
                      <span>{detallePersonal?.personal?.dni}</span>
                    </div>
                  </div>
                </div>

                {/* Sección de asistencias - con tabla para impresión térmica */}
                <div className="px-1 py-0.5 print:px-0.5 print:py-0">
                  <div className="my-0.5 border-t border-dashed border-gray-500 print:my-0.5"></div>
                  <div className="text-center font-bold mb-0.5 print:mb-0 print:text-[10pt]">ASISTENCIA</div>
                  <table className="thermal-table w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="font-bold text-center">Días completos</th>
                        <th className="font-bold text-center">Medios días</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-center">
                          {detallePersonal?.asistencias.filter(a => a.estado === 'Completo').length || 0}
                        </td>
                        <td className="text-center">
                          {detallePersonal?.asistencias.filter(a => a.estado === 'Medio día').length || 0}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="flex justify-end font-semibold text-[10px] mt-0.5 pt-0.5 print:mt-0 print:pt-0.5">
                    <span>Total: S/.{detallePersonal?.totales.asistencia.toFixed(2)}</span>
                  </div>
                </div>

                {/* Sección de tareas extras - con tabla para impresión térmica */}
                <div className="px-1 py-0.5 print:px-0.5 print:py-0">
                  <div className="my-0.5 border-t border-dashed border-gray-500 print:my-0.5"></div>
                  <div className="text-center font-bold mb-0.5 print:mb-0 print:text-[10pt]">TAREAS EXTRA</div>
                  {detallePersonal?.tareasExtra && detallePersonal.tareasExtra.length > 0 ? (
                    <div className="text-[9px] print:text-[8pt]">
                      {/* Tabla para impresión térmica */}
                      <table className="thermal-table w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="col-fecha font-bold">Fecha</th>
                            <th className="col-cargo font-bold">Descripción</th>
                            <th className="col-monto font-bold">Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...detallePersonal.tareasExtra]
                            .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                            .map((tarea, idx) => (
                              <tr key={idx}>
                                <td className="col-fecha">{formatDate(tarea.fecha)}</td>
                                <td className="col-cargo">{tarea.descripcion || 'Sin desc.'}</td>
                                <td className="col-monto">S/.{Number(tarea.monto).toFixed(2)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      <div className="flex justify-end font-semibold text-[10px] mt-0.5 pt-0.5 print:mt-0 print:pt-0.5">
                        Total: S/.{detallePersonal?.totales.tareas_extra.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9px] text-center text-muted-foreground py-0.5 print:text-[8pt] print:text-black">
                      No hay tareas extra registradas
                    </div>
                  )}
                </div>

                {/* Sección de servicios de cocción - con tabla */}
                <div className="px-1 py-0.5 print:px-0.5 print:py-0">
                  <div className="my-0.5 border-t border-dashed border-gray-500 print:my-0.5"></div>
                  <div className="text-center font-bold mb-0.5 print:mb-0 print:text-[10pt]">SERVICIOS DE COCCIÓN</div>
                  {detallePersonal?.cocciones && detallePersonal.cocciones.length > 0 ? (
                    <div className="text-[9px] print:text-[8pt]">
                      {/* Versión única optimizada con tablas */}
                      {[...detallePersonal.cocciones]
                        .sort((a, b) => new Date(a.fecha_encendido).getTime() - new Date(b.fecha_encendido).getTime())
                        .map((coccion, idx) => (
                          <div key={idx} className="mb-0.5 print:mb-0.5">
                            {/* Primera fila: Información de la cocción (fecha y horno) */}
                            <div className="flex justify-between items-center mb-0 pb-0">
                              <div className={coccion.esCoccionDeOtraSemana ? "text-orange-600 font-medium print:text-black" : "font-medium"}>
                                Horno: {coccion.horno}
                              </div>
                              <div className="font-medium">
                                F. encendido: {formatDate(coccion.fecha_encendido)}
                              </div>
                            </div>

                            {/* Tabla para impresión térmica */}
                            <table className="thermal-table w-full border-collapse">
                              <thead>
                                <tr>
                                  <th className="col-fecha font-bold">Fecha</th>
                                  <th className="col-cargo font-bold">Cargo</th>
                                  <th className="col-monto font-bold">Monto</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...coccion.turnos]
                                  .sort((a, b) => {
                                    if (!a.fecha || !b.fecha) return 0;
                                    const [diaA, mesA, yearA] = a.fecha.split('/');
                                    const [diaB, mesB, yearB] = b.fecha.split('/');
                                    const dateA = new Date(Number(yearA), Number(mesA) - 1, Number(diaA));
                                    const dateB = new Date(Number(yearB), Number(mesB) - 1, Number(diaB));
                                    return dateA.getTime() - dateB.getTime();
                                  })
                                  .map((turno, turnoIdx, arr) => (
                                    <tr key={turnoIdx}>
                                      <td className="col-fecha">{turno.fecha}</td>
                                      <td className="col-cargo">{turno.cargo}</td>
                                      <td className="col-monto">S/.{turno.costo.toFixed(2)}</td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        ))}

                      {/* Total general de todas las cocciones */}
                      <div className="flex justify-end font-semibold text-[10px] mt-0.5 pt-0.5 print:mt-0 print:pt-0.5">
                        Total: S/.{detallePersonal?.totales.coccion.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9px] text-center text-muted-foreground py-0.5">
                      No hay servicios de cocción registrados
                    </div>
                  )}
                </div>

                {/* Sección de adelantos pendientes - con tabla */}
                <div className="px-1 py-0.5 print:px-0.5 print:py-0">
                  <div className="my-0.5 border-t border-dashed border-gray-500 print:my-0.5"></div>
                  <div className="text-center font-bold mb-0.5 print:mb-0 print:text-[10pt]">ADELANTOS PENDIENTES</div>
                  {detallePersonal?.adelantos && detallePersonal.adelantos.length > 0 ? (
                    <div className="text-[9px] print:text-[8pt]">
                      {/* Tabla para impresión térmica */}
                      <table className="thermal-table w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="col-fecha font-bold">Fecha</th>
                            <th className="col-cargo font-bold">Descripción</th>
                            <th className="col-monto font-bold">Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detallePersonal.adelantos
                            .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                            .map((adelanto, idx, arr) => (
                              <tr key={idx}>
                                <td className="col-fecha">{formatDate(adelanto.fecha)}</td>
                                <td className="col-cargo">{adelanto.comentario || 'Sin desc.'}</td>
                                <td className="col-monto text-red-600 font-medium print:font-normal">S/.{Number(adelanto.monto).toFixed(2)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      <div className="flex justify-end font-semibold text-[10px] mt-0.5 pt-0.5 border-t border-dashed border-gray-300 print:text-[9pt] print:mt-0 print:pt-0.5">
                        <span className="text-red-600 print:font-medium">Total Pendiente: S/.{detallePersonal?.totales.adelantos.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9px] text-center text-muted-foreground py-0.5 print:text-[8pt] print:text-black">
                      No hay adelantos pendientes
                    </div>
                  )}
                </div>

                {/* Sección de adelantos cancelados - solo visible si hay datos */}
                {detallePersonal?.adelantosCancelados && detallePersonal.adelantosCancelados.length > 0 && (
                  <div className="px-1 py-0.5 print:px-0.5 print:py-0">
                   <div className="my-0.5 border-t border-dashed border-gray-500 print:my-0.5"></div>
                    <div className="text-center font-bold mb-0.5 print:mb-0 print:text-[10pt]">ADELANTOS CANCELADOS EN ESTE PAGO</div>
                    <div className="text-[9px] print:text-[8pt]">
                      {/* Tabla para impresión térmica */}
                      <table className="thermal-table w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="col-fecha font-bold">Fecha</th>
                            <th className="col-cargo font-bold">Descripción</th>
                            <th className="col-monto font-bold">Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detallePersonal.adelantosCancelados
                            .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                            .map((adelanto, idx, arr) => (
                              <tr key={idx}>
                                <td className="col-fecha">{formatDate(adelanto.fecha)}</td>
                                <td className="col-cargo">{adelanto.comentario || 'Sin desc.'}</td>
                                <td className="col-monto text-green-600 font-medium print:font-normal">S/.{Number(adelanto.monto).toFixed(2)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      <div className="flex justify-end font-semibold text-[10px] mt-0.5 pt-0.5 print:mt-0 print:pt-0.5">
                        <span className="text-green-600 print:font-medium">Total Cancelado: S/.{detallePersonal?.totales.adelantosCancelados?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resumen final */}
                <div className="p-1 print:p-0.5 print:bg-white">
                  <div className="my-0.5 border-t border-dashed border-gray-500 print:my-0.5"></div>
                  <div className="flex flex-col text-[11px] space-y-0 print:text-[9pt] print:space-y-0">
                    <div className="flex justify-between">
                      <span>Total Asistencia:</span>
                      <span>S/.{detallePersonal?.totales.asistencia.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Tareas Extra:</span>
                      <span>S/.{detallePersonal?.totales.tareas_extra.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Cocción:</span>
                      <span>S/.{detallePersonal?.totales.coccion.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600 print:font-medium">
                      <span>Adelantos Pendientes:</span>
                      <span>S/.{detallePersonal?.totales.adelantos.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600 print:font-medium mb-0.5 print:mb-1">
                      <span>Adelantos Cancelados:</span>
                      <span>S/.{detallePersonal?.totales.adelantosCancelados?.toFixed(2) || '0.00'}</span>
                    </div>
                    
                    {/* Línea divisoria antes del total a pagar */}
                    <div className="my-2 border-t border-dashed border-gray-500 print:my-2"></div>
                    
                    {/* Total sin descuento */}
                    <div className="text-center font-bold pt-0.5 mt-1 print:pt-0.5 print:mt-1">
                      <div className="text-base print:text-[11pt]">TOTAL SIN DESCUENTO:</div>
                      <div className="text-lg print:text-[14pt] mt-0.5 print:mt-1">
                        S/.{(
                          (detallePersonal?.totales.asistencia ?? 0) +
                          (detallePersonal?.totales.tareas_extra ?? 0) +
                          (detallePersonal?.totales.coccion ?? 0)
                        ).toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Total pagado */}
                    <div className="text-center font-bold text-emerald-600 print:text-black print:font-extrabold mt-3 print:mt-4">
                      <div className="text-base print:text-[11pt]">TOTAL PAGADO:</div>
                      <div className="text-lg print:text-[14pt] mt-0.5 print:mt-1">
                        {pagosRealizados.some(p =>
                          p.id_personal === detallePersonal?.personal?.id_personal &&
                          p.id_semana_laboral.toString() === semanaSeleccionada
                        )
                          ? `S/.${Number(detallePersonal?.totales.final_pagado).toFixed(2)}`
                          : "-"
                        }
                      </div>
                      <div className="text-xs text-gray-500 mt-1 print:text-[8pt]">
                        (Monto final después de descuentos)
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Pie de página */}
            <div className="p-2 text-center text-[8px] text-muted-foreground print:text-black print:px-0">
              <div className="my-1 border-t border-dashed border-gray-500 print:my-0.5"></div>
              <p className="mb-0.5 print:text-[7pt]">Documento informativo - No constituye comprobante oficial de pago</p>
              <p className="mb-0.5 print:text-[7pt]">Gracias por su trabajo</p>
              <p className="pt-2 mb-0 print:pt-1 print:text-[7pt]">* * * * * * * * * *</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 p-2 border-t print:hidden">
            <Button variant="outline" size="sm" onClick={() => setDetalleModalOpen(false)}>
              Cerrar
            </Button>
            {activeTab === "realizados" && (
              <Button
                size="sm"
                onClick={imprimirDetalle}
                className="print:hidden"
              >
                <Printer className="h-3 w-3 mr-1" /> Imprimir
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para eliminar pago */}
      <AlertDialog open={showConfirmDeletePagoModal} onOpenChange={setShowConfirmDeletePagoModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el registro de pago.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeletePago}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar Pago"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Pago Parcial */}
      <Dialog open={pagoParcialModalOpen} onOpenChange={setPagoParcialModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Pago Parcial de Adelanto</DialogTitle>
            <DialogDescription>
              Ingrese el monto para el pago parcial del adelanto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {adelantoSeleccionado && (
              <div className="space-y-2">
                <div className="border rounded-md p-3 bg-gray-50">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium">Fecha:</div>
                    <div>{formatDate(adelantoSeleccionado.fecha)}</div>
                    
                    <div className="font-medium">Monto Total:</div>
                    <div>S/. {Number(adelantoSeleccionado.monto).toFixed(2)}</div>
                    
                    <div className="font-medium">Comentario:</div>
                    <div>{adelantoSeleccionado.comentario || '-'}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="montoParcial">Monto a Pagar</Label>
                  <Input
                    id="montoParcial"
                    type="number"
                    value={montoPagoParcial}
                    onChange={(e) => setMontoPagoParcial(e.target.value)}
                    placeholder="0.00"
                    className="w-full"
                    step="0.01"
                    min="0.01"
                    max={adelantoSeleccionado.monto}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ingrese un valor entre S/. 0.01 y S/. {Number(adelantoSeleccionado.monto).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => {
              setPagoParcialModalOpen(false);
              setAdelantoSeleccionado(null);
              setMontoPagoParcial("");
            }}>
              Cancelar
            </Button>
            <Button onClick={handleApplyPagoParcial}>
              Aplicar Pago Parcial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}