import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

// rutas
import auth from "./routes/auth.routes.js";
import empleados from "./routes/empleados.routes.js";
import pacientes from "./routes/pacientes.routes.js";
import citas from "./routes/citas.routes.js";
import pacienteSelf from "./routes/paciente.self.routes.js";

dotenv.config();

const app = express();

// dominios permitidos (configurable por .env). IMPORTANTE: usa tu dominio real de Netlify
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "https://clinicafront1.netlify.app,http://localhost:5173,http://localhost:5500")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(morgan("dev"));
app.use(express.json());

// CORS manual (responde también OPTIONS)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  }
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Origin, Accept");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ping
app.get("/", (_, res) => res.json({ ok: true, msg: "API" }));

// montar rutas
app.use("/api/auth", auth);
app.use("/api/empleados", empleados);
app.use("/api/pacientes", pacientes);
app.use("/api/citas", citas);
app.use("/api/mipaciente", pacienteSelf);

// manejador de errores básico
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ ok: false, msg: "Error interno del servidor" });
});

const PORT = process.env.PORT || 4000;
const URI = process.env.MONGODB_URI || "mongodb://localhost:27017/app_db";

// Render: evitar EADDRINUSE
let serverStarted = false;

async function start() {
  try {
    await connectDB(URI);
    console.log("DB conectada");
    if (!serverStarted) {
      app.listen(PORT, () => {
        console.log("Servidor en http://localhost:" + PORT);
      });
      serverStarted = true;
    }
  } catch (err) {
    console.error("Error iniciando servidor:", err.message);
    process.exit(1);
  }
}

start();
export default app;
