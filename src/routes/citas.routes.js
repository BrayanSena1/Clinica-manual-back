// src/routes/citas.routes.js
import { Router } from "express";
import { needAuth, needRole } from "../middleware/auth.js";
import {
  listarCitas,
  crearCita,
  cancelarCita,
  marcarRealizada,
  documentosDeCita,
  crearDocumentoDeCita,
} from "../controllers/citas.controller.js";

const r = Router();

// todos estos pueden ver y crear citas
r.use(needAuth, needRole("empleado", "medico", "admin"));

r.get("/", listarCitas);
r.post("/", crearCita);
r.patch("/:id/cancelar", cancelarCita);
r.patch("/:id/realizar", marcarRealizada);
r.get("/:id/documentos", documentosDeCita);

// pero aquí solo médico y admin deberían escribir evolución
r.post("/:id/documentos", needRole("medico", "admin"), crearDocumentoDeCita);

export default r;
