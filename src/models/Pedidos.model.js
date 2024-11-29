import mongoose from "mongoose";

const compraSchema = new mongoose.Schema(
  {
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productos: [
      {
        productoId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Producto",
          required: true,
        },
        cantidad: {
          type: Number,
          required: true,
          min: 1,
        },
        precioUnitario: {
          type: Number,
          required: true,
        },
        subtotal: {
          type: Number,
          required: true,
        },
        tiendaId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Tienda",
          required: true,
        },
      },
    ],
    metodoPago: {
      type: String,
      enum: ["tarjeta", "PayPal", "transferencia", "efectivo, Tarjeta de Crédito"],
      required: true,
    },
    estado: {
      type: String,
      enum: ["pendiente", "pagado", "cancelado", "enviado", "completado"],
      default: "pendiente",
    },
    direccionEnvio: {
      type: String,
      required: true,
    },
    totalCompra: {
      type: Number,
      required: true,
      min: 0,
    },
    fechaCompra: {
      type: Date,
      default: Date.now,
    },
    comentarios: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Usar mongoose.models para evitar redefinir el modelo
export const Compra = mongoose.models.Compra || mongoose.model("Compra", compraSchema);