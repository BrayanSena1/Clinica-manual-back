// src/controllers/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// devolvemos lo mismo siempre
const safe = (u) => ({
  id: u._id,          // por si el front usa "id"
  _id: u._id,         // por si el front usa "_id"
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

    // normalizamos el correo
    email = email.trim().toLowerCase();

    const u = await User.findOne({ email });
    if (!u) {
      return res.status(401).json({ ok: false, msg: "Usuario o contraseña inválidos" });
    }

    // algunos la guardan en passwordHash y otros en password
    const hash = u.passwordHash || u.password;
    const ok = await bcrypt.compare(password, hash);
    if (!ok) {
      return res.status(401).json({ ok: false, msg: "Usuario o contraseña inválidos" });
    }

    const token = jwt.sign(
      { sub: u._id, role: u.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({
      ok: true,
      msg: "OK",
      token,
      user: safe(u),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, msg: "Error" });
  }
}

export async function me(req, res) {
  try {
    const u = await User.findById(req.userId);
    if (!u) {
      return res.status(404).json({ ok: false, msg: "No encontrado" });
    }
    return res.json({ ok: true, user: safe(u) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, msg: "Error" });
  }
}
