// src/middleware/auth.js
import jwt from "jsonwebtoken";

export function needAuth(req, res, next) {
  const header = req.headers.authorization || "";
  // puede venir "Bearer token" o solo "token"
  const parts = header.split(" ");
  const token = parts.length === 2 ? parts[1] : parts[0];

  if (!token) {
    return res.status(401).json({ ok: false, msg: "Token faltante" });
  }

  try {
    const p = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = p.sub;
    req.userRole = p.role;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, msg: "Token inválido o expirado" });
  }
}

export function needRole(...roles) {
  return (req, res, next) => {
    const userRole = (req.userRole || "").toLowerCase();
    const allowed = roles.map((r) => r.toLowerCase());
    if (!allowed.includes(userRole)) {
      return res.status(403).json({ ok: false, msg: "No autorizado" });
    }
    next();
  };
}
