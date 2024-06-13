const { Sequelize } = require('sequelize');
const config = require('./config');

const sequelize = new Sequelize(config.DB_NAME, config.DB_USER, config.DB_PASSWORD, {
    host: config.DB_HOST,
    dialect: 'mysql',
    logging: false, // para evitar mostrar logs en la consola
});

const connect = async () => {
    try {
      await sequelize.authenticate();
      console.log('Conexión exitosa con la base de datos');
    } catch (error) {
      console.error('Error al conectar con la base de datos:', error);
    }
  };

module.exports = { sequelize, connect };