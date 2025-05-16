import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import ClienteService from '@/lib/services/ClienteService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        const id_empresa = session.user?.id_empresa;
        if (!id_empresa) {
            return res.status(400).json({ message: 'ID de empresa no válido' });
        }

        switch (req.method) {
            case 'GET':
                const { dni, page = 1, limit = 10 } = req.query;
                const offset = (Number(page) - 1) * Number(limit);
                
                const clientes = await ClienteService.getClientes(id_empresa);
                
                // Aplicar filtro por DNI si existe
                const clientesFiltrados = dni 
                    ? clientes.filter(c => 
                        (c.dni && c.dni.includes(dni as string)) || 
                        (c.ruc && c.ruc.includes(dni as string))
                      )
                    : clientes;

                // Aplicar paginación
                const inicio = offset;
                const fin = offset + Number(limit);
                const clientesPaginados = clientesFiltrados.slice(inicio, fin);
                const totalPaginas = Math.ceil(clientesFiltrados.length / Number(limit));

                return res.status(200).json({
                    clientes: clientesPaginados,
                    totalPaginas,
                    paginaActual: Number(page)
                });

            case 'POST':
                const nuevoCliente = await ClienteService.createCliente({
                    ...req.body,
                    id_empresa
                });
                return res.status(201).json(nuevoCliente);

            case 'PUT':
                const { id_cliente, ...updateData } = req.body;
                if (!id_cliente) {
                    return res.status(400).json({ message: 'ID de cliente no proporcionado' });
                }
                const clienteActualizado = await ClienteService.updateCliente(id_cliente, updateData);
                return res.status(200).json(clienteActualizado);

            case 'DELETE':
                const id = Number(req.query.id);
                if (!id) {
                    return res.status(400).json({ message: 'ID no proporcionado' });
                }
                await ClienteService.deleteCliente(id);
                return res.status(200).json({ message: 'Cliente eliminado' });

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}
