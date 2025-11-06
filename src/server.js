import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import auth from "./routes/auth.routes.js";
import empleados from "./routes/empleados.routes.js";

dotenv.config();

const app = express();

// dominios permitidos
const allowedOrigins = [
  "https://clinicafront1.netlify.app",
  "http://localhost:5173",
  "http://localhost:5500"
];

// CORS manual para que responda también al preflight
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Vary", "Origin");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// puedes dejar cors() básico también
app.use(cors());

app.use(morgan("dev"));
app.use(express.json());

app.get("/", (_, res) => {
  res.json({ ok: true, msg: "API" });
});

app.use("/api/auth", auth);
app.use("/api/empleados", empleados);

const PORT = process.env.PORT || 4000;
const URI = process.env.MONGODB_URI || "mongodb://localhost:27017/app_db";

// ⚠️ seguro para no hacer listen dos veces (el error que te salió)
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
    console.error("Error iniciando la app:", err.message);
    process.exit(1);
  }
}

start();


