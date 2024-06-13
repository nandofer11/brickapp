const express = require('express');
const app = express();
const db = require('./src/config/db'); // Importar el archivo de configuración de la base de datos
const { sequelize } = require('./src/models'); // Importar instancia de sequelize

// Conectar a la base de datos
db.connect();

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const proveedorRoutes = require('./routes/proveedoresRoutes');
const empresaRoutes = require('./routes/empresaRoutes');
const materialRoutes = require('./routes/materialRoutes');
const compraRoutes = require('./routes/compraRoutes');
const detalleCompraRoutes = require('./routes/detalleCompraRoutes');
// Importar otras rutas necesarias

// Middleware para parsear JSON
app.use(express.json());

// Configurar rutas
app.use('/api/auth', authRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/materiales', materialRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/detalleCompras', detalleCompraRoutes);
// Configurar otras rutas necesarias

// Puerto del servidor
const PORT = process.env.PORT || 3000;

// Sincronizar modelos con la base de datos y luego iniciar el servidor
sequelize.sync({ force: true }) // Cambiar a 'false' para evitar que se eliminen y vuelvan a crear las tablas cada vez
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor iniciado en el puerto ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error al sincronizar la base de datos:', err);
  });
