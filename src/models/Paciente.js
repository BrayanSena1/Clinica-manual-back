// src/models/Paciente.js
import mongoose from "mongoose";

const pacienteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // 👈 nuevo
    docTipo: { type: String, default: "CC" },
    docNumero: { type: String, required: true, unique: true },
    nombre: { type: String, required: true },
    email: { type: String, trim: true, lowercase: true },
    telefono: { type: String, trim: true },
    estado: {
      type: String,
      enum: ["activo", "inactivo"],
      default: "activo",
    },
    direccion: String,
    fechaNacimiento: Date,
    observaciones: String,
  },
  { timestamps: true }
);

export default mongoose.model("Paciente", pacienteSchema);
