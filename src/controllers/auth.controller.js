// src/controllers/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Paciente from "../models/Paciente.js";

const safe = (u) => ({
  id: u._id,
  _id: u._id,
  email: u.email,
  nombre: u.nombre,
  role: u.role,
});

export async function login(req, res) {
  try {
    let { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, msg: "Faltan credenciales" });
    }

    email = email.trim().toLowerCase();
    const u = await User.findOne({ email });
    if (!u) return res.status(401).json({ ok: false, msg: "Usuario o contraseña inválidos" });

    const hash = u.passwordHash || u.password;
    const ok = await bcrypt.compare(password, hash);
    if (!ok) return res.status(401).json({ ok: false, msg: "Usuario o contraseña inválidos" });

    const token = jwt.sign({ sub: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: "2h" });
    return res.json({ ok: true, msg: "OK", token, user: safe(u) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, msg: "Error" });
  }
}

export async function register(req, res) {
  try {
    const { nombre, email, password, docNumero, telefono } = req.body || {};
    if (!nombre || !email || !password) {
      return res.status(400).json({ ok: false, msg: "Faltan datos obligatorios" });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, msg: "La contraseña debe tener al menos 6 caracteres" });
    }

    const emailNorm = email.trim().toLowerCase();
    const exists = await User.findOne({ email: emailNorm });
    if (exists) return res.status(409).json({ ok: false, msg: "El correo ya está registrado" });

    const passwordHash = await bcrypt.hash(password, 10);

    // role forzado a "paciente"
    const user = await User.create({
      email: emailNorm,
      nombre: nombre.trim(),
      role: "paciente",
      passwordHash,
    });

    // crea (si no existe) la ficha de paciente y la liga al user
    let p = await Paciente.findOne({ docNumero: docNumero || "" });
    if (!p) {
      p = await Paciente.create({
        user: user._id,
        docTipo: "CC",
        docNumero: docNumero || `USR-${user._id.toString().slice(-6)}`,
        nombre: nombre.trim(),
        email: emailNorm,
        telefono: telefono || "",
        estado: "activo",
      });
    } else if (!p.user) {
      p.user = user._id;
      await p.save();
    }

    const token = jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "2h" });
    return res.status(201).json({ ok: true, msg: "Registrado", token, user: safe(user) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, msg: "Error registrando" });
  }
}

export async function me(req, res) {
  try {
    const u = await User.findById(req.userId);
    if (!u) return res.status(404).json({ ok: false, msg: "No encontrado" });
    return res.json({ ok: true, user: safe(u) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, msg: "Error" });
  }
}
