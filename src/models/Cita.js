import mongoose from "mongoose";

const citaSchema = new mongoose.Schema(
  {
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: "Paciente", required: true },
    medico: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // asignado si hay médicos en esa especialidad
    especialidad: { type: String, enum: ["general","odontologia","psicologia"], required: true },
    motivo: { type: String, trim: true },
    fechaHora: { type: Date, required: true },  // inicio de la hora (08:00, 09:00, etc.)
    duracionMin: { type: Number, default: 60 },
    estado: { type: String, enum: ["programada","realizada","cancelada","no_asistio"], default: "programada" },
    creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// para búsquedas rápidas
citaSchema.index({ especialidad: 1, fechaHora: 1 });
citaSchema.index({ medico: 1, fechaHora: 1 });
citaSchema.index({ paciente: 1, fechaHora: 1 });

export default mongoose.model("Cita", citaSchema);
