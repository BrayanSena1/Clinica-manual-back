// src/models/DocCita.js
import mongoose from "mongoose";

const docCitaSchema = new mongoose.Schema(
  {
    cita: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cita",
      required: true,
    },
    tipo: {
      type: String,
      enum: ["evolucion", "formula", "incapacidad", "otro"],
      default: "evolucion",
    },
    titulo: { type: String, default: "Evolución médica" },
    // aquí guardamos lo que escribió el médico (texto o JSON string)
    contenido: { type: String, default: "" },
    creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("DocCita", docCitaSchema);
