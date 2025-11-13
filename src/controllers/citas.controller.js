// src/controllers/citas.controller.js
import Cita from "../models/Cita.js";
import DocCita from "../models/DocCita.js";
import User from "../models/User.js";
import Paciente from "../models/Paciente.js";

// helpers --------------------------------------------
const ESPECIALIDADES = ["general","odontologia","psicologia"];
const HORA_INI = 8;   // 08:00
const HORA_FIN = 17;  // 17:00 (último inicio permitido)

function buildDateAtHour(fechaYYYYMMDD, horaInt) {
  // crea fecha local YYYY-MM-DDTHH:00:00 (sin "Z")
  return new Date(`${fechaYYYYMMDD}T${String(horaInt).padStart(2, "0")}:00:00`);
}

async function contarCitasOcupadas(especialidad, fechaHora) {
  return Cita.countDocuments({
    especialidad,
    fechaHora,
    estado: { $ne: "cancelada" }
  });
}

async function medicosDe(especialidad) {
  // si hay médicos en BD, se usan; si no, capacidad por defecto 2
  const docs = await User.find({ role: "medico", especialidad }).select("_id").lean();
  return docs; // []
}

async function medicoDisponible(especialidad, fechaHora) {
  const docs = await medicosDe(especialidad);
  if (!docs.length) return null; // no hay médicos creados -> asignación nula (capacidad por defecto se valida aparte)

  for (const d of docs) {
    const ya = await Cita.countDocuments({
      medico: d._id,
      fechaHora,
      estado: { $ne: "cancelada" }
    });
    if (ya === 0) return d._id;
  }
  return null;
}

function validarEntradaCita({ especialidad, fecha, hora }) {
  if (!ESPECIALIDADES.includes(especialidad)) return "Especialidad inválida";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return "Fecha inválida (YYYY-MM-DD)";
  const h = parseInt(hora, 10);
  if (Number.isNaN(h) || h < HORA_INI || h > HORA_FIN) return "Hora fuera de rango (08–17)";
  return null;
}

// slots / disponibilidad ------------------------------
export async function slotsPorDia(req, res) {
  try {
    const especialidad = String(req.query.especialidad || "").toLowerCase();
    const fecha = String(req.query.fecha || "");
    if (!ESPECIALIDADES.includes(especialidad)) {
      return res.status(400).json({ ok: false, msg: "Especialidad inválida" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ ok: false, msg: "Fecha inválida (YYYY-MM-DD)" });
    }

    const docs = await medicosDe(especialidad);
    const capacidad = docs.length > 0 ? docs.length : 2; // 2 por especialidad si no hay médicos creados

    const slots = [];
    for (let h = HORA_INI; h <= HORA_FIN; h++) {
      const fh = buildDateAtHour(fecha, h);
      const ocupadas = await contarCitasOcupadas(especialidad, fh);
      const cupos = Math.max(capacidad - ocupadas, 0);
      slots.push({
        hora: `${String(h).padStart(2,"0")}:00`,
        fechaHora: fh,
        disponible: cupos > 0,
        cupos
      });
    }
    res.json({ ok: true, capacidad, especialidad, fecha, slots });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al calcular disponibilidad" });
  }
}

// listado ------------------------------------------------
export async function listarCitas(req, res) {
  try {
    const { estado } = req.query;
    const filtro = {};
    if (estado) filtro.estado = estado;
    const citas = await Cita.find(filtro).sort({ fechaHora: -1 }).limit(100).lean();
    res.json({ ok: true, citas });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al listar citas" });
  }
}

// crear por EMPLEADO/ADMIN --------------------------------
export async function crearCita(req, res) {
  try {
    const { pacienteId, docNumero, especialidad, fecha, hora, motivo } = req.body || {};

    // validar entrada base
    const err = validarEntradaCita({ especialidad, fecha, hora });
    if (err) return res.status(400).json({ ok: false, msg: err });

    // resolver paciente
    let paciente = null;
    if (pacienteId) {
      paciente = await Paciente.findById(pacienteId);
    } else if (docNumero) {
      paciente = await Paciente.findOne({ docNumero });
    }
    if (!paciente) return res.status(404).json({ ok: false, msg: "Paciente no encontrado" });

    const fh = buildDateAtHour(fecha, parseInt(hora, 10));
    // capacidad
    const docs = await medicosDe(especialidad);
    const capacidad = docs.length > 0 ? docs.length : 2;
    const ocupadas = await contarCitasOcupadas(especialidad, fh);
    if (ocupadas >= capacidad) return res.status(409).json({ ok: false, msg: "Ese horario ya está lleno" });

    // asignar médico si existen
    let medico = null;
    if (docs.length) {
      const m = await medicoDisponible(especialidad, fh);
      if (!m) return res.status(409).json({ ok: false, msg: "Todos los médicos ocupados en esa hora" });
      medico = m;
    }

    const c = await Cita.create({
      paciente: paciente._id,
      medico,
      especialidad,
      motivo: motivo || "",
      fechaHora: fh,
      duracionMin: 60,
      estado: "programada",
      creadoPor: req.userId,
    });

    res.status(201).json({ ok: true, cita: c });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al crear cita" });
  }
}

// cancelar / realizar ------------------------------------
export async function cancelarCita(req, res) {
  try {
    const { id } = req.params;
    const c = await Cita.findByIdAndUpdate(id, { estado: "cancelada" }, { new: true });
    if (!c) return res.status(404).json({ ok: false, msg: "Cita no encontrada" });
    res.json({ ok: true, cita: c });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al cancelar cita" });
  }
}

export async function marcarRealizada(req, res) {
  try {
    const { id } = req.params;
    const c = await Cita.findByIdAndUpdate(id, { estado: "realizada" }, { new: true });
    if (!c) return res.status(404).json({ ok: false, msg: "Cita no encontrada" });
    res.json({ ok: true, cita: c });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al actualizar cita" });
  }
}

// documentos --------------------------------------------
export async function documentosDeCita(req, res) {
  try {
    const { id } = req.params;
    const docs = await DocCita.find({ cita: id }).sort({ createdAt: -1 }).lean();
    res.json({ ok: true, documentos: docs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al listar documentos" });
  }
}

export async function crearDocumentoDeCita(req, res) {
  try {
    const { id } = req.params; // id cita
    const { tipo, titulo, contenido } = req.body || {};
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
    res.status(500).json({ ok: false, msg: "Error al crear documento de la cita" });
  }
}

// 👇 **Alias para que tu ruta pueda importar slotsDisponibles**
export { slotsPorDia as slotsDisponibles };
