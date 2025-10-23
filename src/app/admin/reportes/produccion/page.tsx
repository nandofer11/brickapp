"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FileText, Loader2, Search, Calendar, Factory, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/dateFormat";

// Interfaces
interface Horno {
  id_horno: number;
  nombre: string;
  prefijo: string;
}

interface Coccion {
  id_coccion: number;
  fecha_encendido: string;
  fecha_apagado?: string;
  estado: string;
  horno: Horno;
}

interface Personal {
  id_personal: number;
  nombre_completo: string;
}

interface CargoCoccion {
  id_cargo_coccion: number;
  nombre_cargo: string;
  costo_cargo: number;
}

interface TurnoCoccion {
  id_coccion_personal: number;
  coccion_id_coccion: number;
  personal_id_personal?: number;
  cargo_coccion_id_cargo_coccion: number;
  fecha: string;
  personal_externo?: string;
  nombre_personal?: string;
  nombre_horno?: string;
  personal?: Personal;
  cargo_coccion?: CargoCoccion;
}

interface ReporteCoccionData {
  coccion: Coccion;
  turnos: TurnoCoccion[];
  totalCostos: number;
}

export default function ReportesProduccionPage() {
  const [tipoReporte, setTipoReporte] = useState<string>("cocciones");
  const [mesSeleccionado, setMesSeleccionado] = useState<string>("");
  const [anoSeleccionado, setAnoSeleccionado] = useState<string>(new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = useState(false);
  const [reporteData, setReporteData] = useState<ReporteCoccionData[]>([]);

  // Estilos CSS para impresión
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        
        * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        body {
          font-family: Arial, sans-serif !important;
          font-size: 8px !important;
          line-height: 1.2 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .no-print {
          display: none !important;
        }
        
        .print-container {
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .print-header {
          text-align: center !important;
          margin-bottom: 15px !important;
          font-size: 14px !important;
          font-weight: bold !important;
          color: #000 !important;
        }
        
        .print-table {
          width: 100% !important;
          border-collapse: collapse !important;
          font-size: 8px !important;
          margin: 0 !important;
        }
        
        .print-table th {
          background-color: #e5e7eb !important;
          border: 1px solid #000 !important;
          padding: 3px 2px !important;
          text-align: center !important;
          font-weight: bold !important;
          font-size: 7px !important;
          vertical-align: middle !important;
        }
        
        .print-table td {
          border: 1px solid #000 !important;
          padding: 2px 2px !important;
          text-align: left !important;
          font-size: 7px !important;
          vertical-align: top !important;
          word-wrap: break-word !important;
        }
        
        .print-table .text-right {
          text-align: right !important;
        }
        
        .print-table .text-center {
          text-align: center !important;
        }
        
        .print-footer {
          margin-top: 10px !important;
          text-align: right !important;
          font-size: 10px !important;
          font-weight: bold !important;
        }
        
        .personal-list {
          font-size: 6px !important;
          line-height: 1.1 !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Generar opciones de meses
  const meses = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];

  // Generar opciones de años (desde 2020 hasta el año actual + 1)
  const años = Array.from({ length: new Date().getFullYear() - 2019 + 2 }, (_, i) => 
    (2020 + i).toString()
  );

  useEffect(() => {
    document.title = "Reportes de Producción";
    // Establecer mes actual por defecto
    setMesSeleccionado((new Date().getMonth() + 1).toString());
  }, []);

  const generarReporte = async () => {
    if (!mesSeleccionado || !anoSeleccionado) {
      toast.error("Debe seleccionar un mes y año");
      return;
    }

    if (tipoReporte !== "cocciones") {
      toast.info("Solo está disponible el reporte de cocciones por el momento");
      return;
    }

    setIsLoading(true);
    try {
      // Calcular fechas de inicio y fin del mes
      const fechaInicio = new Date(parseInt(anoSeleccionado), parseInt(mesSeleccionado) - 1, 1);
      const fechaFin = new Date(parseInt(anoSeleccionado), parseInt(mesSeleccionado), 0);

      // Formatear fechas para la API
      const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
      const fechaFinStr = fechaFin.toISOString().split('T')[0];

      // Obtener cocciones del mes
      const coccionesResponse = await fetch(
        `/api/coccion?fechaInicio=${fechaInicioStr}&fechaFin=${fechaFinStr}`
      );
      
      if (!coccionesResponse.ok) throw new Error("Error al obtener cocciones");
      
      const cocciones: Coccion[] = await coccionesResponse.json();

      if (cocciones.length === 0) {
        toast.info("No se encontraron cocciones en el período seleccionado");
        setReporteData([]);
        return;
      }

      // Para cada cocción, obtener sus turnos
      const reportePromises = cocciones.map(async (coccion) => {
        try {
          const turnosResponse = await fetch(`/api/coccion_turno?id_coccion=${coccion.id_coccion}`);
          if (!turnosResponse.ok) throw new Error(`Error al obtener turnos para cocción ${coccion.id_coccion}`);
          
          const turnos: TurnoCoccion[] = await turnosResponse.json();
          
          // Calcular total de costos
          const totalCostos = turnos.reduce((total, turno) => {
            const costo = Number(turno.cargo_coccion?.costo_cargo) || 0;
            return total + costo;
          }, 0);

          return {
            coccion,
            turnos,
            totalCostos
          };
        } catch (error) {
          console.error(`Error procesando cocción ${coccion.id_coccion}:`, error);
          return {
            coccion,
            turnos: [],
            totalCostos: 0
          };
        }
      });

      const reporteCompleto = await Promise.all(reportePromises);
      setReporteData(reporteCompleto);
      
      toast.success(`Reporte generado: ${cocciones.length} cocciones encontradas`);

    } catch (error) {
      console.error("Error al generar reporte:", error);
      toast.error("Error al generar el reporte");
    } finally {
      setIsLoading(false);
    }
  };

  const calcularTotalGeneral = () => {
    return reporteData.reduce((total, item) => {
      const costo = Number(item.totalCostos) || 0;
      return total + costo;
    }, 0);
  };

  const generarTablaPrint = () => {
    const mesNombre = meses.find(m => m.value === mesSeleccionado)?.label || '';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Cocciones - ${mesNombre} ${anoSeleccionado}</title>
          <style>
            @page { 
              size: A4 landscape; 
              margin: 10mm; 
            }
            * { 
              font-family: Arial, sans-serif; 
              box-sizing: border-box; 
            }
            body { 
              margin: 0; 
              padding: 0; 
              font-size: 8px; 
              line-height: 1.2; 
            }
            .header { 
              text-align: center; 
              margin-bottom: 15px; 
              font-size: 14px; 
              font-weight: bold; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              font-size: 7px; 
            }
            th { 
              background-color: #e5e7eb; 
              border: 1px solid #000; 
              padding: 3px 2px; 
              text-align: center; 
              font-weight: bold; 
              vertical-align: middle; 
            }
            td { 
              border: 1px solid #000; 
              padding: 2px; 
              vertical-align: top; 
              word-wrap: break-word; 
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .personal-item { 
              font-size: 6px; 
              line-height: 1.1; 
              margin-bottom: 1px; 
            }
            .footer { 
              margin-top: 10px; 
              text-align: right; 
              font-size: 10px; 
              font-weight: bold; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            Reporte de Cocciones - ${mesNombre} ${anoSeleccionado}
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 12%;">Cocción</th>
                <th style="width: 8%;">Horno</th>
                <th style="width: 12%;">F. Encendido</th>
                <th style="width: 12%;">F. Apagado</th>
                <th style="width: 8%;">Estado</th>
                <th style="width: 33%;">Personal y Cargos</th>
                <th style="width: 10%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${reporteData.map((data, index) => {
                const personalInfo = obtenerPersonalPorCoccion(data.turnos);
                return `
                  <tr>
                    <td class="text-center">${index + 1}</td>
                    <td class="text-center">COC-${data.coccion.id_coccion}</td>
                    <td class="text-center">${data.coccion.horno.nombre}</td>
                    <td class="text-center">${formatDate(data.coccion.fecha_encendido)}</td>
                    <td class="text-center">${data.coccion.fecha_apagado ? formatDate(data.coccion.fecha_apagado) : '-'}</td>
                    <td class="text-center">${data.coccion.estado}</td>
                    <td>
                      ${personalInfo.map(info => `
                        <div class="personal-item">
                          ${info.nombre} - ${info.cargo} (S/. ${info.costo.toFixed(2)})
                        </div>
                      `).join('')}
                    </td>
                    <td class="text-right">S/. ${Number(data.totalCostos).toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            TOTAL GENERAL: S/. ${calcularTotalGeneral().toFixed(2)}
          </div>
        </body>
      </html>
    `;
  };

  const imprimirReporte = () => {
    if (reporteData.length === 0) {
      toast.warning("No hay datos para imprimir");
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generarTablaPrint());
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  };

  const obtenerPersonalPorCoccion = (turnos: TurnoCoccion[]) => {
    const personalMap = new Map<string, { nombre: string; costo: number; cargo: string }>();
    
    turnos.forEach(turno => {
      // Usar nombre_personal del API response o fallback a personal_externo
      const nombre = turno.nombre_personal || turno.personal_externo || turno.personal?.nombre_completo || "Personal Externo";
      const cargo = turno.cargo_coccion?.nombre_cargo || "Sin cargo";
      const costo = Number(turno.cargo_coccion?.costo_cargo) || 0;
      
      const key = `${nombre.trim()}-${cargo}`;
      if (personalMap.has(key)) {
        personalMap.get(key)!.costo += costo;
      } else {
        personalMap.set(key, { nombre: nombre.trim(), costo, cargo });
      }
    });
    
    return Array.from(personalMap.values());
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reportes de Producción</h1>
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>

      {/* Filtros de Reporte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Configuración del Reporte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tipo de Reporte */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de Reporte:</Label>
            <RadioGroup
              value={tipoReporte}
              onValueChange={setTipoReporte}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cocciones" id="cocciones" />
                <Label htmlFor="cocciones" className="flex items-center gap-2">
                  <Factory className="h-4 w-4" />
                  Cocciones
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Selección de Período */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Año:</Label>
              <Select value={anoSeleccionado} onValueChange={setAnoSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar año" />
                </SelectTrigger>
                <SelectContent>
                  {años.map(año => (
                    <SelectItem key={año} value={año}>
                      {año}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Mes:</Label>
              <Select value={mesSeleccionado} onValueChange={setMesSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map(mes => (
                    <SelectItem key={mes.value} value={mes.value}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                onClick={generarReporte}
                disabled={isLoading || !mesSeleccionado || !anoSeleccionado}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Generar Reporte
                  </>
                )}
              </Button>
              
              {reporteData.length > 0 && (
                <Button 
                  onClick={imprimirReporte}
                  variant="outline"
                  className="flex-shrink-0"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir PDF
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados del Reporte */}
      {reporteData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Reporte de Cocciones - {meses.find(m => m.value === mesSeleccionado)?.label} {anoSeleccionado}
              </CardTitle>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total General:</p>
                <p className="text-lg font-bold text-green-600">
                  S/. {calcularTotalGeneral().toFixed(2)}
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Cocción</TableHead>
                    <TableHead>Horno</TableHead>
                    <TableHead>Fecha Encendido</TableHead>
                    <TableHead>Fecha Apagado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Personal y Cargos</TableHead>
                    <TableHead className="text-right">Total Costos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reporteData.map((item, index) => {
                    const personalData = obtenerPersonalPorCoccion(item.turnos);
                    
                    return (
                      <TableRow key={item.coccion.id_coccion}>
                        <TableCell className="font-medium text-center">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          Cocción #{item.coccion.id_coccion}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.coccion.horno.nombre}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.coccion.horno.prefijo}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(item.coccion.fecha_encendido)}
                        </TableCell>
                        <TableCell>
                          {item.coccion.fecha_apagado ? 
                            formatDate(item.coccion.fecha_apagado) : 
                            <span className="text-sm text-muted-foreground">No finalizada</span>
                          }
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              item.coccion.estado === 'Finalizado' ? 'default' :
                              item.coccion.estado === 'En Proceso' ? 'secondary' :
                              'outline'
                            }
                          >
                            {item.coccion.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {personalData.length > 0 ? (
                              personalData.map((personal, idx) => (
                                <div key={idx} className="text-sm">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{personal.nombre} - {personal.cargo}</span>
                                    <span className="text-muted-foreground text-xs">
                                      S/. {personal.costo.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Sin personal registrado
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          S/. {item.totalCostos.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Resumen */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Cocciones</p>
                    <p className="text-2xl font-bold">{reporteData.length}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Costo Total</p>
                    <p className="text-2xl font-bold text-green-600">
                      S/. {calcularTotalGeneral().toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Costo Promedio</p>
                    <p className="text-2xl font-bold text-blue-600">
                      S/. {reporteData.length > 0 ? (calcularTotalGeneral() / reporteData.length).toFixed(2) : '0.00'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensaje cuando no hay datos */}
      {reporteData.length === 0 && !isLoading && mesSeleccionado && anoSeleccionado && (
        <Card>
          <CardContent className="p-8 text-center">
            <Factory className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay datos disponibles</h3>
            <p className="text-muted-foreground">
              No se encontraron cocciones para el período seleccionado.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
