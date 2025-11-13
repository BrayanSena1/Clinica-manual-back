import { Router } from "express";
import { needAuth, needRole } from "../middleware/auth.js";
import {
  slotsPorDia,
  listarCitas,
  crearCita,
  cancelarCita,
  marcarRealizada,
  documentosDeCita,
  crearDocumentoDeCita
} from "../controllers/citas.controller.js";

const r = Router();
r.use(needAuth);

// disponibilidad (paciente/empleado/medico/admin)
r.get("/slots", needRole("paciente","empleado","medico","admin"), slotsPorDia);

// empleado/admin
r.get("/", needRole("empleado","medico","admin"), listarCitas);
r.post("/", needRole("empleado","admin"), crearCita);
r.patch("/:id/cancelar", needRole("empleado","admin"), cancelarCita);
r.patch("/:id/realizar", needRole("empleado","medico","admin"), marcarRealizada);

// documentos
r.get("/:id/documentos", needRole("empleado","medico","admin"), documentosDeCita);
r.post("/:id/documentos", needRole("medico"), crearDocumentoDeCita);

export default r;
