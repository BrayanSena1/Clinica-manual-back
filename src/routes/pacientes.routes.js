// src/routes/pacientes.routes.js
import { Router } from "express";
import { needAuth, needRole } from "../middleware/auth.js";
import {
  listarPacientes,
  obtenerPaciente,
  crearPaciente,
  actualizarPaciente,
  cambiarEstado,
  citasDelPaciente,
  certAfiliacion,
  certHistorial,
} from "../controllers/pacientes.controller.js";

const r = Router();

// dejamos entrar a empleado, médico y admin
r.use(needAuth, needRole("empleado", "medico", "admin"));

r.get("/", listarPacientes);
r.get("/:id", obtenerPaciente);
r.post("/", crearPaciente);
r.put("/:id", actualizarPaciente);
r.patch("/:id/estado", cambiarEstado);
r.get("/:id/citas", citasDelPaciente);
r.get("/:id/certificados/afiliacion", certAfiliacion);
r.get("/:id/certificados/historial", certHistorial);

export default r;
