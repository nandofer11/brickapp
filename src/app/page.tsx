"use client";

import Link from "next/link";
import styles from "./page.module.css";

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      <h1>Bienvenido a BrickApp</h1>
      <p>Solución para la gestión de ladrilleras.</p>
      <nav>
        <Link href="/auth">Iniciar Sesión</Link>
        <Link href="/registrar_empresa">Registrar Empresa</Link>
      </nav>
    </div>
  );
}
