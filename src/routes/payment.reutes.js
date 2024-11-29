import express from 'express';
import Stripe from 'stripe';
import { Compra } from "../models/Pedidos.model.js";
import { Producto } from '../models/Productos.model.js';
import { Tienda } from '../models/venderos.model.js';
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Usa variabrrle de entorno

// Crear un Payment Intent
router.post('/payments', async (req, res) => {
  try {
    const { token } = req.cookies;

    // Verificar si el token existe
    if (!token) {
      return res.status(401).json({ message: "Token no proporcionado." });
    }

    let usuarioId;
    try {
      // Decodificar el token
      const decodedToken = jwt.verify(token, TOKEN_SECRET);
      usuarioId = decodedToken.id;
    } catch (error) {
      return res.status(401).json({ message: "Token no válido o expirado." });
    }

    const { productos, metodoPago, paymentDetails, direccionEnvio } = req.body;

    // Validar datos necesarios
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ message: "No se enviaron productos para la compra." });
    }

    if (!direccionEnvio) {
      return res.status(400).json({ message: "La dirección de envío es obligatoria." });
    }

    let totalCompra = 0;
    const productosCompra = [];

    for (const item of productos) {
      // Buscar producto en la base de datos
      const producto = await Producto.findById(item.productoId);
      if (!producto) {
        return res.status(404).json({ message: `Producto con ID ${item.productoId} no existe.` }), console.log({ message: `Producto con ID ${item.productoId} no existe.` })
      }

      // Verificar disponibilidad de stock
      if (producto.cantidad < item.cantidad) {
        return res.status(400).json({
          message: `Stock insuficiente para "${producto.nombre}". Disponibles: ${producto.cantidad}.`,
        });
      }

      // Actualizar stock y calcular subtotal
      producto.cantidad -= item.cantidad;
      await producto.save();

      const subtotal = producto.precio * item.cantidad;
      totalCompra += subtotal;

      productosCompra.push({
        productoId: producto._id,
        tiendaId: producto.tiendaId,
        cantidad: item.cantidad,
        precioUnitario: producto.precio,
        subtotal,
      });
    }

    let paymentIntent;

    if (metodoPago === "tarjeta") {
      // Validar que la tienda tenga cuenta financiera configurada
      const vendedor = await Tienda.findById(productosCompra[0].tiendaId);
      const sellerId = vendedor.stripeAccountId || "acct_1QORwpPAYrTft3XD"; // Reemplazar con la lógica correcta
      if (!sellerId) {
        return res.status(400).json({
          message: "La tienda no tiene una cuenta financiera configurada.",
        });
      }

      try {
        // Crear Payment Intent en Stripe
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalCompra * 100),
          currency: "mxn",
          payment_method: paymentDetails.paymentMethodId,
          confirm: true,
          return_url: "http://localhost:5173/exito", // URL donde redirigir tras el pago
          transfer_data: {
            destination: sellerId,
          },
          metadata: {
            usuarioId,
            direccionEnvio,
            totalCompra,
          },
        });
        
        
      } catch (error) {
        console.error("Error al crear el Payment Intent:", error.message);
        return res.status(500).json({ message: "No se pudo crear el Payment Intent en Stripe." });
      }

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
          message: "El pago no se pudo completar. Estado: " + paymentIntent.status,
        });
      }
    }

    // Guardar la compra en la base de datos
    const nuevaCompra = new Compra({
      usuarioId,
      productos: productosCompra,
      metodoPago,
      direccionEnvio,
      totalCompra,
      paymentIntentId: metodoPago === "tarjeta" ? paymentIntent.id : null,
    });

    const compraGuardada = await nuevaCompra.save();

    res.status(201).json({
      message: "Compra realizada con éxito.",
      clientSecret: metodoPago === "tarjeta" ? paymentIntent.client_secret : null,
      compra: compraGuardada,
    });
  } catch (error) {
    console.error("Error en registrarPedido:", error.message);
    res.status(500).json({ message: "Error al realizar la compra.", error: error.message });
  }
});

// Obtener detalles de los Payment Intents
router.get('/api/payments', async (req, res) => {
  try {
    const paymentIntents = await stripe.paymentIntents.list({ limit: 10 });

    const payments = paymentIntents.data.map((intent) => ({
      id: intent.id,
      amount: intent.amount / 100,
      currency: intent.currency,
      status: intent.status,
      receipt_email: intent.receipt_email,
      metadata: intent.metadata,
      created: new Date(intent.created * 1000),
    }));

    res.json(payments);
  } catch (error) {
    console.error("Error al obtener los Payment Intents:", error.message);
    res.status(500).json({ message: "Error al obtener los Payment Intents." });
  }
});

export default router;
