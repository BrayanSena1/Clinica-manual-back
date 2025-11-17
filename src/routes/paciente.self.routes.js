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
  crearMiCita,        // <- ya lo exportas así en tu controller
  slotsPorDiaSelf,    // <- usamos la versión "self"
} from "../controllers/pacienteSelf.controller.js";

const r = Router();
r.use(needAuth);

// perfil propio
r.get("/", needRole("paciente"), miPerfilPaciente);
r.put("/", needRole("paciente"), actualizarMiPaciente);

// citas propias
r.get("/citas", needRole("paciente"), misCitas);
r.post("/citas", needRole("paciente"), crearMiCita);
r.patch("/citas/:id/cancelar", needRole("paciente"), cancelarMiCita);
r.get("/citas/:id/documentos", needRole("paciente"), documentosDeMiCita);

// certificados propios
r.get("/certificados/afiliacion", needRole("paciente"), miCertAfiliacion);
r.get("/certificados/historial", needRole("paciente"), miCertHistorial);

// disponibilidad (endpoint que espera el front)
r.get("/slots", needRole("paciente"), slotsPorDiaSelf);

export default r;
