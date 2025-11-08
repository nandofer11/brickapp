"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // No mostrar paginación si solo hay una página
  if (totalPages <= 1) return null;

  // Calcular rango de páginas a mostrar (máximo 5)
  const renderPageButtons = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Ajustar si estamos cerca del final
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // Agregar botones para cada página en el rango
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(i)}
          className="h-8 w-8 p-0"
        >
          {i}
        </Button>
      );
    }

    // Agregar puntos suspensivos si hay más páginas antes o después del rango visible
    const buttons = [];
    
    if (startPage > 1) {
      buttons.push(
        <Button key="start" variant="outline" size="sm" onClick={() => onPageChange(1)} className="h-8 w-8 p-0">
          1
        </Button>
      );
      if (startPage > 2) {
        buttons.push(<span key="ellipsis-start" className="mx-1">...</span>);
      }
    }
    
    buttons.push(...pages);
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="ellipsis-end" className="mx-1">...</span>);
      }
      buttons.push(
        <Button 
          key="end" 
          variant="outline" 
          size="sm" 
          onClick={() => onPageChange(totalPages)} 
          className="h-8 w-8 p-0"
        >
          {totalPages}
        </Button>
      );
    }
    
    return buttons;
  };

  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {renderPageButtons()}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
