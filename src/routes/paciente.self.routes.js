// src/routes/paciente.self.routes.js
import { Router } from "express";
import { needAuth, needRole } from "../middleware/auth.js";
import {
  miPerfilPaciente,
  actualizarMiPaciente,
  misCitas,
  cancelarMiCita,
  documentosDeMiCita,
  miCertAfiliacion,
  miCertHistorial,
  crearMiCita
} from "../controllers/pacienteSelf.controller.js";
import { slotsDisponibles } from "../controllers/citas.controller.js";

const r = Router();

r.use(needAuth);

// perfil
r.get("/", needRole("paciente"), miPerfilPaciente);
r.put("/", needRole("paciente"), actualizarMiPaciente);

// citas propias
r.get("/citas", needRole("paciente"), misCitas);
r.patch("/citas/:id/cancelar", needRole("paciente"), cancelarMiCita);
r.get("/citas/:id/documentos", needRole("paciente"), documentosDeMiCita);

// nuevos: disponibilidad y crear cita (para el front de paciente)
r.get("/citas/slots", needRole("paciente"), slotsDisponibles);
r.post("/citas", needRole("paciente"), crearMiCita);

// certificados del propio paciente
r.get("/certificados/afiliacion", needRole("paciente"), miCertAfiliacion);
r.get("/certificados/historial", needRole("paciente"), miCertHistorial);

export default r;
