const express = require('express');
const app = express();
const db = require('./src/config/db'); // Importar el archivo de configuración de la base de datos
const { sequelize } = require('./src/models'); // Importar instancia de sequelize


// Conectar a la base de datos
db.connect();

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const empresaRoutes = require('./routes/empresaRoutes');
const materialRoutes = require('./routes/materialRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const detallePedidoRoutes = require('./routes/detallePedidoRoutes');
const proveedorRoutes = require('./routes/proveedoresRoutes'); // Nombre corregido
const rolRoutes = require('./routes/rolRoutes');
const authProveedorRoutes = require('./routes/authProveedorRoutes');

// Middleware para parsear JSON
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})
// Configurar rutas
app.use('/api/auth', authRoutes); // Ruta de autenticación para usuarios de empresa
app.use('/api/empresas', empresaRoutes);
app.use('/api/materiales', materialRoutes);
app.use('/api/pedido', pedidoRoutes);
app.use('/api/detallepedido', detallePedidoRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/authProveedor', authProveedorRoutes);  // Ruta de autenticación para usuarios de proveedor

// Puerto del servidor
const PORT = process.env.PORT || 3000;

// Sincronizar modelos con la base de datos y luego iniciar el servidor
sequelize.sync({ force: false }) // Cambiar a 'false' para evitar que se eliminen y vuelvan a crear las tablas cada vez
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor iniciado en el puerto ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error al sincronizar la base de datos:', err);
  });
