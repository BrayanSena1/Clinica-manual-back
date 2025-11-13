// src/controllers/pacienteSelf.controller.js
import User from "../models/User.js";
import Paciente from "../models/Paciente.js";
import Cita from "../models/Cita.js";
import DocCita from "../models/DocCita.js";

// ---------- Constantes & helpers de agenda ----------
const ESPECIALIDADES = ["general", "odontologia", "psicologia"];
const HORA_INI = 8;   // 08:00
const HORA_FIN = 17;  // 17:00

function buildDateAtHour(fechaYYYYMMDD, horaInt) {
  // fecha local YYYY-MM-DDTHH:00:00
  return new Date(`${fechaYYYYMMDD}T${String(horaInt).padStart(2, "0")}:00:00`);
}

function validarEntradaCita({ especialidad, fecha, hora }) {
  if (!ESPECIALIDADES.includes(String(especialidad || "").toLowerCase())) {
    return "Especialidad inválida (general/odontologia/psicologia)";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha || ""))) {
    return "Fecha inválida (usa YYYY-MM-DD)";
  }
  const h = parseInt(hora, 10);
  if (Number.isNaN(h)) return "Hora inválida";
  if (h < HORA_INI || h > HORA_FIN) return "Hora fuera de rango (08–17)";
  return null;
}

async function medicosDe(especialidad) {
  // si no hay médicos, la "capacidad" por hora será 2
  const docs = await User.find({ role: "medico", especialidad }).select("_id").lean();
  return docs; // []
}

async function contarCitasOcupadas(especialidad, fechaHora) {
  return Cita.countDocuments({
    especialidad,
    fechaHora,
    estado: { $ne: "cancelada" },
  });
}

async function medicoDisponible(especialidad, fechaHora) {
  const docs = await medicosDe(especialidad);
  if (!docs.length) return null; // no hay médicos; se acepta cita sin médico asignado

  for (const d of docs) {
    const ya = await Cita.countDocuments({
      medico: d._id,
      fechaHora,
      estado: { $ne: "cancelada" },
    });
    if (ya === 0) return d._id;
  }
  return null;
}

// ---------- Vincular usuario -> paciente ----------
async function getOrCreatePacienteForUser(userId) {
  let paciente = await Paciente.findOne({ user: userId });
  if (paciente) return paciente;

  const user = await User.findById(userId).lean();
  if (!user) throw new Error("Usuario no encontrado");

  if (user.email) {
    const existente = await Paciente.findOne({ email: user.email });
    if (existente) {
      existente.user = userId;
      await existente.save();
      return existente;
    }
  }

  // crear uno mínimo
  const nuevo = await Paciente.create({
    user: userId,
    nombre: user.nombre || user.email || "Paciente",
    email: user.email,
    docNumero: String(Date.now()), // único
  });
  return nuevo;
}

// ---------- SELF: perfil ----------
export async function miPerfilPaciente(req, res) {
  try {
    const paciente = await getOrCreatePacienteForUser(req.userId);
    res.json({ ok: true, paciente });
  } catch (e) {
    console.error("miPerfilPaciente:", e);
    res.status(500).json({ ok: false, msg: e.message || "Error al obtener mis datos" });
  }
}

export async function actualizarMiPaciente(req, res) {
  try {
    const paciente = await getOrCreatePacienteForUser(req.userId);
    const campos = ["docTipo", "docNumero", "nombre", "telefono", "direccion", "fechaNacimiento"];
    for (const c of campos) {
      if (req.body[c] !== undefined) paciente[c] = req.body[c];
    }
    await paciente.save();
    res.json({ ok: true, paciente });
  } catch (e) {
    console.error("actualizarMiPaciente:", e);
    res.status(500).json({ ok: false, msg: e.message || "Error al actualizar mis datos" });
  }
}

// ---------- SELF: citas ----------
export async function misCitas(req, res) {
  try {
    const paciente = await getOrCreatePacienteForUser(req.userId);
    const citas = await Cita.find({ paciente: paciente._id }).sort({ fechaHora: -1 }).lean();
    res.json({ ok: true, citas });
  } catch (e) {
    console.error("misCitas:", e);
    res.status(500).json({ ok: false, msg: e.message || "Error al listar mis citas" });
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
    console.error("cancelarMiCita:", e);
    res.status(500).json({ ok: false, msg: e.message || "Error al cancelar la cita" });
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
    console.error("documentosDeMiCita:", e);
    res.status(500).json({ ok: false, msg: e.message || "Error al traer documentos" });
  }
}

// ---------- SELF: certificados ----------
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
    console.error("miCertAfiliacion:", e);
    res.status(500).json({ ok: false, msg: e.message || "Error al generar certificado" });
  }
}

export async function miCertHistorial(req, res) {
  try {
    const paciente = await getOrCreatePacienteForUser(req.userId);
    const citas = await Cita.find({ paciente: paciente._id }).sort({ fechaHora: -1 }).lean();

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
    console.error("miCertHistorial:", e);
    res.status(500).json({ ok: false, msg: e.message || "Error al generar historial" });
  }
}

// ---------- SELF: slots & creación de cita ----------
export async function slotsPorDiaSelf(req, res) {
  try {
    const especialidad = String(req.query.especialidad || "").toLowerCase();
    const fecha = String(req.query.fecha || "");

    const err = validarEntradaCita({ especialidad, fecha, hora: HORA_INI });
    if (err && !err.startsWith("Hora")) {
      return res.status(400).json({ ok: false, msg: err });
    }

    const docs = await medicosDe(especialidad);
    const capacidad = docs.length > 0 ? docs.length : 2;

    const slots = [];
    for (let h = HORA_INI; h <= HORA_FIN; h++) {
      const fh = buildDateAtHour(fecha, h);
      const ocupadas = await contarCitasOcupadas(especialidad, fh);
      const cupos = Math.max(capacidad - ocupadas, 0);
      slots.push({
        hora: `${String(h).padStart(2, "0")}:00`,
        fechaHora: fh,
        disponible: cupos > 0,
        cupos,
      });
    }

    res.json({ ok: true, capacidad, especialidad, fecha, slots });
  } catch (e) {
    console.error("slotsPorDiaSelf:", e);
    res.status(500).json({ ok: false, msg: e.message || "Error al calcular disponibilidad" });
  }
}

export async function crearMiCita(req, res) {
  try {
    const { especialidad, fecha, hora, motivo } = req.body || {};
    const err = validarEntradaCita({ especialidad, fecha, hora });
    if (err) return res.status(400).json({ ok: false, msg: err });

    const paciente = await getOrCreatePacienteForUser(req.userId);
    const hInt = parseInt(hora, 10);
    const fh = buildDateAtHour(fecha, hInt);

    // capacidad por hora
    const docs = await medicosDe(especialidad);
    const capacidad = docs.length > 0 ? docs.length : 2;
    const ocupadas = await contarCitasOcupadas(especialidad, fh);
    if (ocupadas >= capacidad) {
      return res.status(409).json({ ok: false, msg: "Ese horario ya está lleno" });
    }

    // asignar médico si hay
    let medico = null;
    if (docs.length) {
      const m = await medicoDisponible(especialidad, fh);
      if (!m) return res.status(409).json({ ok: false, msg: "Todos los médicos ocupados en esa hora" });
      medico = m;
    }

    const cita = await Cita.create({
      paciente: paciente._id,
      medico, // puede ser null
      especialidad,
      motivo: motivo || "",
      fechaHora: fh,
      duracionMin: 60,
      estado: "programada",
      creadoPor: req.userId,
    });

    res.status(201).json({ ok: true, cita });
  } catch (e) {
    console.error("crearMiCita:", e);
    res.status(500).json({ ok: false, msg: e.message || "Error al crear la cita" });
  }
}
