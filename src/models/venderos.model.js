// Importamos mongoose para crear esquemas y modelos
import mongoose from "mongoose";

// Esquema de Tienda
const tiendaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  propietarioId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  descripcion: {
    type: String,
    default: '' ,
  },
  logo: {
    type: String,
    required: true,
  },
  telefono: {
    type: String,
    required: true,
    trim: true,
  },  
  stripeAccountId: {
    type: String,
    trim: true,
  },
  onboardingLink: {
    type: String,
    trim: true
  },
  direccion: {
    type: String,
    required: true,
    trim: true,
  },
  redesSociales: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
  },
  horario: {
    type: [String], // Permite múltiples horarios en forma de array
    default: [], // Ejemplo: ["Lunes a Viernes - 10 am a 11 pm", "Sábado - 12 pm a 8 pm"]
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
});

// Exportamos el modelo
export const Tienda = mongoose.model("Tienda", tiendaSchema);
