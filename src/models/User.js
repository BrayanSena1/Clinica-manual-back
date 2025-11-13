import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    nombre: { type: String, required: true, trim: true },
    role: { type: String, enum: ["admin","empleado","medico","paciente"], required: true },
    passwordHash: { type: String, required: true },

    // solo para médicos
    especialidad: { type: String, enum: ["general","odontologia","psicologia"], default: undefined },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
