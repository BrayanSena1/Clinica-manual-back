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
} from "../controllers/pacienteSelf.controller.js";

const r = Router();

r.use(needAuth, needRole("paciente", "admin"));

r.get("/", miPerfilPaciente);
r.put("/", actualizarMiPaciente);

r.get("/citas", misCitas);
r.patch("/citas/:id/cancelar", cancelarMiCita);
r.get("/citas/:id/documentos", documentosDeMiCita);

r.get("/certificados/afiliacion", miCertAfiliacion);
r.get("/certificados/historial", miCertHistorial);

export default r;
