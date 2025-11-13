// src/controllers/pacienteSelf.controller.js
import User from "../models/User.js";
import Paciente from "../models/Paciente.js";
import Cita from "../models/Cita.js";
import DocCita from "../models/DocCita.js";

// --- helper: trae o crea el paciente asociado al usuario que hace la petición ---
async function getOrCreatePacienteForUser(userId) {
  // ¿ya hay un Paciente ligado al user?
  let paciente = await Paciente.findOne({ user: userId });
  if (paciente) return paciente;

  // buscamos el user
  const user = await User.findById(userId).lean();
  if (!user) throw new Error("Usuario no encontrado");

  // ¿existe un paciente con el mismo email? si sí, lo ligamos
  if (user.email) {
    const existente = await Paciente.findOne({ email: user.email });
    if (existente) {
      existente.user = userId;
      await existente.save();
      return existente;
    }
  }

  // si no existe, creamos uno básico
  const nuevo = await Paciente.create({
    user: userId,
    nombre: user.nombre || user.email || "Paciente",
    email: user.email,
    docNumero: Date.now().toString(), // luego puede editarlo
    estado: "activo",
  });
  return nuevo;
}

// --- PERFIL ---
export async function miPerfilPaciente(req, res) {
  try {
    const paciente = await getOrCreatePacienteForUser(req.userId);
    res.json({ ok: true, paciente });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al obtener mis datos" });
  }
}

export async function actualizarMiPaciente(req, res) {
  try {
    const paciente = await getOrCreatePacienteForUser(req.userId);
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

// --- MIS CITAS ---
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

export async function cancelarMiCita(req, res) {
  try {
    const paciente = await getOrCreatePacienteForUser(req.userId);
    const { id } = req.params;

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

export async function documentosDeMiCita(req, res) {
  try {
    const paciente = await getOrCreatePacienteForUser(req.userId);
    const { id } = req.params;

    const cita = await Cita.findOne({ _id: id, paciente: paciente._id }).lean();
    if (!cita) return res.status(404).json({ ok: false, msg: "Cita no encontrada" });

    const docs = await DocCita.find({ cita: id }).sort({ createdAt: -1 }).lean();
    res.json({ ok: true, documentos: docs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al traer documentos" });
  }
}

// --- CERTIFICADOS ---
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

// --- CREAR MI CITA (PACIENTE) ---
export async function crearMiCita(req, res) {
  try {
    const paciente = await getOrCreatePacienteForUser(req.userId);
    const { especialidad, fecha, hora, motivo } = req.body || {};

    if (!especialidad || !fecha || !hora) {
      return res.status(400).json({ ok: false, msg: "especialidad, fecha (YYYY-MM-DD) y hora (HH) son obligatorios" });
    }

    const hh = parseInt(hora, 10);
    if (Number.isNaN(hh) || hh < 8 || hh > 17) {
      return res.status(400).json({ ok: false, msg: "Hora fuera de horario (08 a 17)" });
    }

    // construir ventana [start, end) de esa hora (local)
    const [y, m, d] = fecha.split("-").map(Number);
    const start = new Date(y, (m || 1) - 1, d || 1, hh, 0, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);

    // contamos citas no canceladas en ese bloque y especialidad
    const ocupadas = await Cita.countDocuments({
      especialidad,
      fechaHora: { $gte: start, $lt: end },
      estado: { $ne: "cancelada" },
    });

    const cuposPorHora = 2; // dos médicos por especialidad
    if (ocupadas >= cuposPorHora) {
      return res.status(409).json({ ok: false, msg: "No hay disponibilidad a esa hora" });
    }

    // asignación simple de médico (medico-1 o medico-2)
    const medico = `medico-${ocupadas + 1}`;

    const cita = await Cita.create({
      paciente: paciente._id,
      especialidad,
      fechaHora: start,
      motivo: motivo || "",
      estado: "programada",
      medico,
      creadoPor: req.userId,
    });

    res.status(201).json({ ok: true, cita });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al crear cita" });
  }
}
