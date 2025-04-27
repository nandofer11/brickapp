import React, { useEffect, useState } from "react";

export function CreateUserModal({ onClose }: { onClose: () => void }) {
  const [roles, setRoles] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    rol: "",
    id_empresa: "",
  });

  useEffect(() => {
    async function fetchRoles() {
      try {
        const response = await fetch("/api/rol", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        setRoles(data.roles || []);
      } catch (error) {
        console.error("Error al cargar los roles:", error);
      }
    }

    fetchRoles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Error al crear el usuario");
      }

      alert("Usuario creado correctamente");
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al crear el usuario");
    }
  };

  return (
    <div className="modal">
      <form onSubmit={handleSubmit}>
        <h2>Crear Usuario</h2>
        <input
          type="text"
          placeholder="Nombre"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <select
          value={formData.rol}
          onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
          required
        >
          <option value="">Seleccionar Rol</option>
          {roles.map((rol) => (
            <option key={rol} value={rol}>
              {rol}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="ID Empresa"
          value={formData.id_empresa}
          onChange={(e) =>
            setFormData({ ...formData, id_empresa: e.target.value })
          }
          required
        />
        <button type="submit">Crear</button>
        <button type="button" onClick={onClose}>
          Cancelar
        </button>
      </form>
    </div>
  );
}
