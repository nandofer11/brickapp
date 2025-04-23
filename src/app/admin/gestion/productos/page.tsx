"use client";
import { useEffect } from "react";

export default function ProductosPage() {

    useEffect(() => {
        document.title = "Gestión de productos";
    }, []);

    return (
        <div>
            <h1>Productos Page</h1>
            {/* <p>Este es el contenido principal.</p> */}
        </div>
    );
}
