import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import auth from "./routes/auth.routes.js";
import empleados from "./routes/empleados.routes.js";

dotenv.config();

const app = express();

// ✅ orígenes permitidos
const allowedOrigins = [
  "https://clinicafront1.netlify.app",
  "http://localhost:5173",
  "http://localhost:5500"
];

// ✅ middleware manual de CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  // para que los navegadores no cacheen el CORS
  res.header("Vary", "Origin");

  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  // si es el preflight (OPTIONS) respondemos aquí mismo
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// puedes dejar cors() básico por si acaso
app.use(cors());

app.use(morgan("dev"));
app.use(express.json());

app.get("/", (_, res) => res.json({ ok: true, msg: "API" }));

app.use("/api/auth", auth);
app.use("/api/empleados", empleados);

const PORT = process.env.PORT || 4000;
const URI = process.env.MONGODB_URI || "mongodb://localhost:27017/app_db";

connectDB(URI).then(() =>
  app.listen(PORT, () => console.log("http://localhost:" + PORT))
);


connectDB(URI).then(() =>
  app.listen(PORT, () => console.log("http://localhost:" + PORT))
);
