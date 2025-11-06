import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import auth from "./routes/auth.routes.js";
import empleados from "./routes/empleados.routes.js";

dotenv.config();

const app = express();

// 👇 CORS bien abierto para tu front en Netlify
app.use(cors({
  origin: ["https://clinicafront1.netlify.app", "http://localhost:5173", "http://localhost:5500"],
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

// por si el navegador manda OPTIONS primero
app.options("*", cors());

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
