const Empresa = require('../models/Empresa');
const Usuario = require('../models/Usuario');

exports.createEmpresa = async (req, res) => {
  try{
    const { ruc, nombreComercial, direccion, telefono, email, web, UsuarioId} = req.body;
    //Verificar si el usuario existe
    const usuario = await Usuario.findByPk(UsuarioId);

    if(!usuario){
      return res.status(404).json({message: 'Usuario no encontrado.'})
    }

    //Crear la empresa
    const empresa = await Empresa.create({
      ruc,
      nombreComercial,
      direccion,
      telefono,
      email,
      web,
      UsuarioId
    })
    res.status(201).json(empresa);
  }catch(error){
    res.status(500).json({message: 'Error al crear la empresa', error});
    console.log(error.message);
  }
};

exports.getEmpresas = async (req, res) => {
  try {
    const empresas = await Empresa.findAll({
      include: {
        model: Usuario
      }
    });
    res.status(200).json(empresas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las empresas' });
  }
};

exports.getEmpresaById = async (req, res) => {
  const { id } = req.params;

  try {
    const empresa = await Empresa.findByPk(id, {
      include: {
        model: Usuario
      }
    });

    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    res.status(200).json(empresa);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la empresa' });
  }
};

exports.updateEmpresa = async (req, res) => {
  const { id } = req.params;
  const { ruc, nombreComercial, direccion, telefono, email, web, UsuarioId } = req.body;

  try {
    const empresa = await Empresa.findByPk(id);

    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    empresa.Usuario_idUsuario = Usuario_idUsuario;
    empresa.ruc = ruc;
    empresa.nombreComercial = nombreComercial;
    empresa.direccion = direccion;
    empresa.telefono = telefono;
    empresa.email = email;
    empresa.web = web;
    empresa.UsuarioId = UsuarioId;

    await empresa.save();

    res.status(200).json(empresa);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la empresa' });
  }
};

exports.deleteEmpresa = async (req, res) => {
  const { id } = req.params;

  try {
    const empresa = await Empresa.findByPk(id);

    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    await empresa.destroy();
    res.status(204).json();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la empresa' });
  }
};
