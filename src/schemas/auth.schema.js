import { z } from "zod";

export const registerSchema = z.object({
  username: z.string({
    required_error: "Username is required",
  }),
  email: z
    .string({
      required_error: "Email is required",
    })
    .email({
      message: "Email is not valid",
    }),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(6, {
      message: "Password must be at least 6 characters",
    }),
    tipo: z.enum(["normal", "vendedor"]).optional(), 
    telefono: z.string().optional(),
    direccion: z.string({
      message: "direccion is required",
    }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});



export const registerTiendaSchema = z.object({
  nombre: z.string().nonempty("El nombre es requerido"),
  direccion: z.string().nonempty("La dirección es requerida"),
  logo: z.string().url("El logo debe ser una URL válida"),
  email: z.string().email("El email no es válido"), // Email obligatorio para validación
  telefono: z.string().min(1, "El teléfono es requerido"), // Teléfono obligatorio
  descripcion: z.string().min(1, "La descripción debe tener al menos 10 caracteres").optional(),
  redesSociales: z.object({
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
  }).optional(),
  horario: z.array(z.string()).optional(), // Permite horarios múltiples, opcional
  fechaCreacion: z.date().optional(), // Campo opcional
  valoraciones: z.object({
    promedio: z.number().default(0),
    total: z.number().default(0),
  }).optional(),
  estadisticas: z.object({
    totalVentas: z.number().default(0),
    totalProductos: z.number().default(0),
    visitasMensuales: z.number().default(0),
  }).optional(),
});


export const loginTiendaSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});