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

// empleado/medico/admin pueden **ver**
r.use(needAuth);

r.get("/", needRole("empleado","medico","admin"), listarPacientes);
r.get("/:id", needRole("empleado","medico","admin"), obtenerPaciente);
r.get("/:id/citas", needRole("empleado","medico","admin"), citasDelPaciente);

// crear/editar/cambiar estado: sólo empleado/admin
r.post("/", needRole("empleado","admin"), crearPaciente);
r.put("/:id", needRole("empleado","admin"), actualizarPaciente);
r.patch("/:id/estado", needRole("empleado","admin"), cambiarEstado);

// certificados: típicamente empleado/admin
r.get("/:id/certificados/afiliacion", needRole("empleado","admin"), certAfiliacion);
r.get("/:id/certificados/historial", needRole("empleado","admin"), certHistorial);

export default r;
