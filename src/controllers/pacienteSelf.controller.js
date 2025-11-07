// src/controllers/pacienteSelf.controller.js
import User from "../models/User.js";
import Paciente from "../models/Paciente.js";
import Cita from "../models/Cita.js";
import DocCita from "../models/DocCita.js";

// helper: trae o crea el paciente que corresponde a este usuario
async function getOrCreatePacienteForUser(userId) {
  // 1. ¿ya hay un paciente ligado a este user?
  let paciente = await Paciente.findOne({ user: userId });
  if (paciente) return paciente;

  // 2. buscamos el user
  const user = await User.findById(userId).lean();
  if (!user) throw new Error("Usuario no encontrado");

  // 3. si hay paciente con mismo email, lo ligamos
  if (user.email) {
    const existente = await Paciente.findOne({ email: user.email });
    if (existente) {
      existente.user = userId;
      await existente.save();
      return existente;
    }
  }

  // 4. si no existe, lo creamos rápido
  const nuevo = await Paciente.create({
    user: userId,
    nombre: user.nombre || user.email || "Paciente",
    email: user.email,
    docNumero: Date.now().toString(), // luego lo puede editar
  });
  return nuevo;
}

// GET /api/mipaciente
export async function miPerfilPaciente(req, res) {
  try {
    const paciente = await getOrCreatePacienteForUser(req.userId);
    res.json({ ok: true, paciente });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al obtener mis datos" });
  }
}

// PUT /api/mipaciente
export async function actualizarMiPaciente(req, res) {
  try {
    const paciente = await getOrCreatePacienteForUser(req.userId);

    // solo dejamos cambiar algunos campos
    const campos = ["docTipo", "docNumero", "nombre", "telefono", "direccion", "fechaNacimiento"];
    campos.forEach((c) => {
      if (req.body[c] !== undefined) paciente[c] = req.body[c];
    });

    await paciente.save();
    res.json({ ok: true, paciente });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al actualizar mis datos" });
  }
}

// GET /api/mipaciente/citas
export async function misCitas(req, res) {
  try {
    const paciente = await getOrCreatePacienteForUser(req.userId);
    const citas = await Cita.find({ paciente: paciente._id })
      .sort({ fechaHora: -1 })
      .lean();
    res.json({ ok: true, citas });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al listar mis citas" });
  }
}

// PATCH /api/mipaciente/citas/:id/cancelar
export async function cancelarMiCita(req, res) {
  try {
    const paciente = await getOrCreatePacienteForUser(req.userId);
    const { id } = req.params;

    // solo puede cancelar si la cita es suya
    const cita = await Cita.findOne({ _id: id, paciente: paciente._id });
    if (!cita) return res.status(404).json({ ok: false, msg: "Cita no encontrada" });

    if (cita.estado !== "programada") {
      return res.status(400).json({ ok: false, msg: "Solo puedes cancelar citas programadas" });
    }

    cita.estado = "cancelada";
    await cita.save();

    res.json({ ok: true, cita });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al cancelar la cita" });
  }
}

// GET /api/mipaciente/citas/:id/documentos
export async function documentosDeMiCita(req, res) {
  try {
    const paciente = await getOrCreatePacienteForUser(req.userId);
    const { id } = req.params;

    // aseguramos que la cita sea suya
    const cita = await Cita.findOne({ _id: id, paciente: paciente._id }).lean();
    if (!cita) return res.status(404).json({ ok: false, msg: "Cita no encontrada" });

    const docs = await DocCita.find({ cita: id }).sort({ createdAt: -1 }).lean();
    res.json({ ok: true, documentos: docs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al traer documentos" });
  }
}

// GET /api/mipaciente/certificados/afiliacion
export async function miCertAfiliacion(req, res) {
  try {
    const paciente = await getOrCreatePacienteForUser(req.userId);
    res.json({
      ok: true,
      tipo: "certificado_afiliacion",
      data: {
        nombre: paciente.nombre,
        documento: paciente.docNumero,
        estado: paciente.estado,
        fecha: new Date().toISOString().slice(0, 10),
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al generar certificado" });
  }
}

// GET /api/mipaciente/certificados/historial
export async function miCertHistorial(req, res) {
  try {
    const paciente = await getOrCreatePacienteForUser(req.userId);
    const citas = await Cita.find({ paciente: paciente._id })
      .sort({ fechaHora: -1 })
      .lean();

    res.json({
      ok: true,
      tipo: "certificado_historial",
      data: {
        paciente: {
          nombre: paciente.nombre,
          documento: paciente.docNumero,
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
