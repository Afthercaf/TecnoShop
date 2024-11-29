import { Tienda } from "../models/venderos.model.js";
import { User } from "../models/user.model.js";
import { Producto } from "../models/Productos.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { TOKEN_SECRET } from "../config.js";
import { createAccessToken } from "../libs/jwt.js";
import Stripe from "stripe";


export const obtenerTiendas = async (req, res) => {
  try {
    const tiendas = await Tienda.find().populate("propietarioId");
    res.json(tiendas);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const obtenerTienda = async (req, res) => {
  try {
    const tienda = await Tienda.findById(req.params.id);
    if (!tienda) return res.status(404).json({ message: "Tienda no encontrada" });
    return res.json(tienda);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};





const stripe = new Stripe("sk_test_51QNkz6AU7UFoerJEsN0iQuUgdpbai2Tu3r0r7eyZatSZR6NhHKUGwZGQpN8lUfu54OqqB4WBXNQCbjyQ96roTyCh00fPo6Ahty");

export const registerTienda = async (req, res) => {
  try {
    const { nombre, email, password, logo, telefono, direccion, bankAccount, card } = req.body;

    // Verifica el token de usuario y extrae el user.id como propietarioId
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: "Autenticación de usuario requerida" });

    const decoded = jwt.verify(token, TOKEN_SECRET);
    const propietarioId = decoded.id; // Obtenemos el user.id del token de usuario

    // Verificamos si el email ya está en uso para otra tienda
    const tiendaExistente = await Tienda.findOne({ email });
    if (tiendaExistente) {
      return res.status(400).json({ message: "El email ya está en uso" });
    }

    // Hasheamos la contraseña de la tienda
    const passwordHash = await bcrypt.hash(password, 10);

    // Creamos la nueva tienda con el propietarioId
    const nuevaTienda = new Tienda({
      nombre,
      email,
      password: passwordHash,
      propietarioId,
      logo,
      telefono,
      direccion,
    });

    // Guardamos la tienda en la base de datos
    const tiendaGuardada = await nuevaTienda.save();

    // Crea la cuenta de Stripe para el vendedor
    const account = await stripe.accounts.create({
      type: "standard", // Cambia a "express" si deseas usar cuentas express
      country: "MX",    // Configurado para México
      email: tiendaGuardada.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    if (bankAccount) {
      // Si estás en modo de prueba, usa un CLABE de prueba
      const testClabe = "000000001234567897";
    
      await stripe.accounts.update(account.id, {
        external_account: {
          object: "bank_account",
          country: "MX",               // Configurado para México
          currency: "mxn",             // Peso mexicano
          account_number: process.env.NODE_ENV === "test" ? testClabe : bankAccount.clabe, // Usa el CLABE de prueba en modo test
        },
      });
    }
    
    

    // Agrega tarjeta de débito/crédito si se proporciona
    if (card) {
      await stripe.accounts.createExternalAccount(account.id, {
        external_account: {
          object: "card",
          number: card.number,
          exp_month: card.exp_month,
          exp_year: card.exp_year,
          cvc: card.cvc,
        },
      });
    }

    // Guarda el Stripe Account ID en la tienda
    tiendaGuardada.stripeAccountId = account.id;
    await tiendaGuardada.save();

    // Genera un enlace de onboarding
// Genera un enlace de onboarding
const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: "http://localhost:5173/reintentar", // Cambia al puerto que uses para tu frontend
  return_url: "http://localhost:5173/exito",      // Cambia al puerto que uses para tu frontend
  type: "account_onboarding",
});

// Actualiza el registro de la tienda con el enlace de onboarding
tiendaGuardada.onboardingLink = accountLink.url;
await tiendaGuardada.save(); // Guarda los cambios en la base de datos


    // Creamos el tiendaToken
    const tiendaToken = await createAccessToken({ id: tiendaGuardada._id });

    // Guardamos el tiendaToken en las cookies
    res.cookie("tiendaToken", tiendaToken, {
      httpOnly: process.env.NODE_ENV !== "development",
      secure: true,
      sameSite: "none",
    });

    const usuarioActualizado = await User.findByIdAndUpdate(
      propietarioId,
      { tipo: "vendedor" },
      { new: true }
    );

    // Respondemos con los datos de la tienda y el enlace de onboarding
    res.json({
      id: tiendaGuardada._id,
      nombre: tiendaGuardada.nombre,
      email: tiendaGuardada.email,
      propietarioId: tiendaGuardada.propietarioId,
      stripeAccountId: tiendaGuardada.stripeAccountId,
      onboardingLink: tiendaGuardada.onboardingLink, // Devuelve el enlace guardado
      usuario: {
        id: usuarioActualizado._id,
        username: usuarioActualizado.username,
        email: usuarioActualizado.email,
        tipo: usuarioActualizado.tipo,
      },
    });    
  } catch (error) {
    console.error("Error en el registro de tienda:", error);
    res.status(500).json({ message: "Error al registrar la tienda" });
  }
};


export const actualizarTienda = async (req, res) => {
  try {
    const tiendaActualizada = await Tienda.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true }
    );
    if (!tiendaActualizada) return res.status(404).json({ message: "Tienda no encontrada" });
    return res.json(tiendaActualizada);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const eliminarTienda = async (req, res) => {
  try {
    const tiendaEliminada = await Tienda.findOneAndDelete({
      _id: req.params.id,
      propietarioId: req.user.id
    });
    if (!tiendaEliminada) return res.status(404).json({ message: "Tienda no encontrada" });
    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};





export const loginTienda = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificamos si la tienda existe
    const tienda = await Tienda.findOne({ email });
    if (!tienda) return res.status(400).json({ message: "Credenciales incorrectas" });

    // Comparamos la contraseña ingresada con el hash almacenado
    const isMatch = await bcrypt.compare(password, tienda.password);
    if (!isMatch) return res.status(400).json({ message: "Credenciales incorrectas" });

    // Generamos el tiendaToken
    const tiendaToken = jwt.sign({ id: tienda._id }, TOKEN_SECRET, { expiresIn: "1d" });

    // Guardamos el tiendaToken en las cookies
    res.cookie("tiendaToken", tiendaToken, {
      httpOnly: process.env.NODE_ENV !== "development",
      secure: true,
      sameSite: "none",
    });

    // Respondemos con los datos de la tienda
    res.json({
      id: tienda._id,
      nombre: tienda.nombre,
      email: tienda.email,
      propietarioId: tienda.propietarioId,
      telefono: tienda.telefono,
      direccion: tienda.direccion,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const verifyTiendaToken = async (req, res) => {
  try {
    const { tiendaToken } = req.cookies;
    if (!tiendaToken) return res.status(401).json({ message: "Acceso denegado, se requiere autenticación" });

    const decoded = jwt.verify(tiendaToken, TOKEN_SECRET);
    const tienda = await Tienda.findById(decoded.id);

    if (!tienda) return res.status(404).json({ message: "Tienda no encontrada" });

    res.json({
      id: tienda._id,
      nombre: tienda.nombre,
      email: tienda.email,
      propietarioId: tienda.propietarioId,
      telefono: tienda.telefono,
      direccion: tienda.direccion,
    });
  } catch (error) {
    res.status(401).json({ message: "Token inválido o expirado" });
  }
};


////////


export const obtenerInventarios = async (req, res) => {
  try {
    const inventarios = await Inventario.find().populate("productoId");
    res.json(inventarios);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const obtenerInventario = async (req, res) => {
  try {
    const inventario = await Inventario.findById(req.params.id);
    if (!inventario) return res.status(404).json({ message: "Inventario no encontrado" });
    return res.json(inventario);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const registrarInventario = async (req, res) => {
  try {
    const { productoId, cantidadDisponible } = req.body;

    const nuevoInventario = new Inventario({
      productoId,
      cantidadDisponible
    });

    await nuevoInventario.save();
    res.json(nuevoInventario);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const actualizarInventario = async (req, res) => {
  try {
    const inventarioActualizado = await Inventario.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true }
    );
    if (!inventarioActualizado) return res.status(404).json({ message: "Inventario no encontrado" });
    return res.json(inventarioActualizado);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const eliminarInventario = async (req, res) => {
  try {
    const inventarioEliminado = await Inventario.findByIdAndDelete(req.params.id);
    if (!inventarioEliminado) return res.status(404).json({ message: "Inventario no encontrado" });
    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// productoController.js

import mongoose from 'mongoose';

export const obtenerProductosPorTienda = async (req, res) => {
  try {
    const tiendaId = req.params.id.replace(/:/g, '').trim(); // Limpiamos el ID

    // Validar el ID
    if (!mongoose.Types.ObjectId.isValid(tiendaId)) {
      return res.status(400).json({ message: "ID de tienda inválido" });
    }

    const productos = await Producto.find({ tiendaId }).populate("tiendaId");
    if (productos.length === 0) {
      return res.status(404).json({ message: "No se encontraron productos para esta tienda" });
    }
    return res.json(productos);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
