// src/models/Paciente.js
import mongoose from "mongoose";

const pacienteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // vínculo 1:1 con el usuario (rol "paciente")

    docTipo:   { type: String, default: "CC" },
    docNumero: { type: String, required: true, unique: true, trim: true },
    nombre:    { type: String, required: true, trim: true },
    email:     { type: String, trim: true, lowercase: true },
    telefono:  { type: String, trim: true },

    estado: { type: String, enum: ["activo","inactivo"], default: "activo" },

    direccion:       { type: String, trim: true },
    fechaNacimiento: Date,
    observaciones:   String,
  },
  { timestamps: true }
);

// para enlazar paciente ↔ user cuando el paciente inicia sesión
pacienteSchema.index({ user: 1 }, { sparse: true });

export default mongoose.model("Paciente", pacienteSchema);
