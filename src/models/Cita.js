// src/models/Cita.js
import mongoose from "mongoose";

const citaSchema = new mongoose.Schema(
  {
    paciente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paciente",
      required: true,
    },
    // por ahora solo guardamos el nombre del médico
    medico: { type: String, required: true },
    fechaHora: { type: Date, required: true },
    motivo: { type: String },
    estado: {
      type: String,
      enum: ["programada", "cancelada", "realizada"],
      default: "programada",
    },
    documentos: [
      { type: mongoose.Schema.Types.ObjectId, ref: "DocCita" },
    ],
    creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Cita", citaSchema);
