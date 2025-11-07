// src/controllers/pacientes.controller.js
import Paciente from "../models/Paciente.js";
import Cita from "../models/Cita.js";

// GET /api/pacientes?q=...
export async function listarPacientes(req, res) {
  try {
    const q = (req.query.q || "").trim();
    const filtro = q
      ? {
          $or: [
            { nombre: { $regex: q, $options: "i" } },
            { docNumero: { $regex: q, $options: "i" } },
          ],
        }
      : {};
    const pacientes = await Paciente.find(filtro)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ ok: true, pacientes });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al listar pacientes" });
  }
}

// GET /api/pacientes/:id
export async function obtenerPaciente(req, res) {
  try {
    const { id } = req.params;
    const p = await Paciente.findById(id).lean();
    if (!p) {
      return res
        .status(404)
        .json({ ok: false, msg: "Paciente no encontrado" });
    }
    res.json({ ok: true, paciente: p });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al obtener paciente" });
  }
}

// POST /api/pacientes
export async function crearPaciente(req, res) {
  try {
    const p = await Paciente.create(req.body);
    res.status(201).json({ ok: true, paciente: p });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al crear paciente" });
  }
}

// PUT /api/pacientes/:id
export async function actualizarPaciente(req, res) {
  try {
    const { id } = req.params;
    const p = await Paciente.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!p)
      return res.status(404).json({ ok: false, msg: "No encontrado" });
    res.json({ ok: true, paciente: p });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al actualizar paciente" });
  }
}

// PATCH /api/pacientes/:id/estado
export async function cambiarEstado(req, res) {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const p = await Paciente.findByIdAndUpdate(
      id,
      { estado },
      { new: true }
    );
    if (!p)
      return res.status(404).json({ ok: false, msg: "No encontrado" });
    res.json({ ok: true, paciente: p });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al cambiar estado" });
  }
}

// GET /api/pacientes/:id/citas
export async function citasDelPaciente(req, res) {
  try {
    const { id } = req.params;
    const citas = await Cita.find({ paciente: id })
      .sort({ fechaHora: -1 })
      .lean();
    res.json({ ok: true, citas });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al traer citas" });
  }
}

// GET /api/pacientes/:id/certificados/afiliacion
export async function certAfiliacion(req, res) {
  try {
    const { id } = req.params;
    const p = await Paciente.findById(id).lean();
    if (!p)
      return res
        .status(404)
        .json({ ok: false, msg: "Paciente no encontrado" });

    res.json({
      ok: true,
      tipo: "certificado_afiliacion",
      data: {
        nombre: p.nombre,
        documento: p.docNumero,
        estado: p.estado,
        fecha: new Date().toISOString().slice(0, 10),
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al generar certificado" });
  }
}

// GET /api/pacientes/:id/certificados/historial
export async function certHistorial(req, res) {
  try {
    const { id } = req.params;
    const p = await Paciente.findById(id).lean();
    if (!p)
      return res
        .status(404)
        .json({ ok: false, msg: "Paciente no encontrado" });

    const citas = await Cita.find({ paciente: id })
      .sort({ fechaHora: -1 })
      .lean();

    res.json({
      ok: true,
      tipo: "certificado_historial",
      data: {
        paciente: {
          nombre: p.nombre,
          documento: p.docNumero,
        },
        citas: citas.map((c) => ({
          fecha: c.fechaHora,
          medico: c.medico,
          motivo: c.motivo,
          estado: c.estado,
        })),
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al generar historial" });
  }
}
