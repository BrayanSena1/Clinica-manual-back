import { Router } from "express";
import { needAuth, needRole } from "../middleware/auth.js";
import {
  miPaciente,
  actualizarMiPaciente,
  misCitas,
  cancelarMiCita,
  documentosDeMiCita,
  certAfiliacionSelf,
  certHistorialSelf,
  crearMiCita
} from "../controllers/pacienteSelf.controller.js";

const r = Router();
r.use(needAuth, needRole("paciente"));

// Perfil
r.get("/", miPaciente);
r.put("/", actualizarMiPaciente);

// Citas propias
r.get("/citas", misCitas);
r.post("/citas", crearMiCita);                 // 👈 nuevo
r.patch("/citas/:id/cancelar", cancelarMiCita);
r.get("/citas/:id/documentos", documentosDeMiCita);

// Certificados
r.get("/certificados/afiliacion", certAfiliacionSelf);
r.get("/certificados/historial", certHistorialSelf);

export default r;
