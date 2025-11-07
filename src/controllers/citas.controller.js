// src/controllers/citas.controller.js
import Cita from "../models/Cita.js";
import DocCita from "../models/DocCita.js";

// GET /api/citas?estado=programada
export async function listarCitas(req, res) {
  try {
    const { estado } = req.query;
    const filtro = {};
    if (estado) filtro.estado = estado;

    const citas = await Cita.find(filtro)
      .sort({ fechaHora: -1 })
      .limit(100)
      .lean();

    res.json({ ok: true, citas });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al listar citas" });
  }
}

// POST /api/citas
export async function crearCita(req, res) {
  try {
    const body = req.body || {};
    const c = await Cita.create({
      ...body,
      creadoPor: req.userId,
    });
    res.status(201).json({ ok: true, cita: c });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al crear cita" });
  }
}

// PATCH /api/citas/:id/cancelar
export async function cancelarCita(req, res) {
  try {
    const { id } = req.params;
    const c = await Cita.findByIdAndUpdate(
      id,
      { estado: "cancelada" },
      { new: true }
    );
    if (!c)
      return res.status(404).json({ ok: false, msg: "Cita no encontrada" });
    res.json({ ok: true, cita: c });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al cancelar cita" });
  }
}

// PATCH /api/citas/:id/realizar
export async function marcarRealizada(req, res) {
  try {
    const { id } = req.params;
    const c = await Cita.findByIdAndUpdate(
      id,
      { estado: "realizada" },
      { new: true }
    );
    if (!c)
      return res.status(404).json({ ok: false, msg: "Cita no encontrada" });
    res.json({ ok: true, cita: c });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al actualizar cita" });
  }
}

// GET /api/citas/:id/documentos
export async function documentosDeCita(req, res) {
  try {
    const { id } = req.params;
    const docs = await DocCita.find({ cita: id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ ok: true, documentos: docs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al listar documentos" });
  }
}

// POST /api/citas/:id/documentos  (médico escribe evolución)
export async function crearDocumentoDeCita(req, res) {
  try {
    const { id } = req.params; // id de la cita
    const { tipo, titulo, contenido } = req.body || {};

    // ✅ mejora: validar que la cita exista y sea de verdad
    const cita = await Cita.findById(id);
    if (!cita) {
      return res.status(404).json({ ok: false, msg: "Cita no encontrada" });
    }

    const doc = await DocCita.create({
      cita: id,
      tipo: tipo || "evolucion",
      titulo: titulo || "Evolución médica",
      contenido: contenido || "",
      creadoPor: req.userId,
    });

    res.status(201).json({ ok: true, documento: doc });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ ok: false, msg: "Error al crear documento de la cita" });
  }
}