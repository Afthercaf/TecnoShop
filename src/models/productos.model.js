// Producto Schema

import mongoose from 'mongoose'; 

const comentarioSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  calificacion: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comentario: {
    type: String,
    trim: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

const productoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  tiendaId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  precio: {
    type: Number,
    required: true,
    min: 0
  },
  cantidad: {
    type: Number,
    required: true,
    min: 0
  },
  categoria: {
    type: String,
    required: true,
    trim: true
  },
  imagenes: [{
    type: String,
    trim: true
  }],
  ofertas: {
    type: String,
    trim: true
  },
  estado: {
    type: String,
    enum: ["activo", "inactivo", "agotado"],
    default: "activo"
  },
  especificaciones: [{
    titulo: { type: String, required: false },
    descripcion: { type: String, required: false }
  }],
  valoraciones: {
    promedio: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    comentarios: [comentarioSchema]
  }
}, {
  timestamps: true
});

export const Producto = mongoose.model("Producto", productoSchema);
