import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";

dotenv.config();

const URI = process.env.MONGODB_URI || "mongodb://localhost:27017/app_db";

async function upsert(email, nombre, role, password) {
  const found = await User.findOne({ email });
  const passwordHash = await bcrypt.hash(password, 10);

  if (!found) {
    await User.create({ email, nombre, role, passwordHash });
    console.log("creado:", email);
  } else {
    await User.updateOne(
      { _id: found._id },
      { $set: { nombre, role, passwordHash } }
    );
    console.log("actualizado:", email);
  }
}

try {
  await connectDB(URI);
  await upsert("admin@app.com", "Admin", "admin", "Admin123");
  await upsert("empleado@app.com", "Empleado", "empleado", "Empleado123");
  await upsert("medico@app.com", "Médico", "medico", "Medico123");
  await upsert("paciente@app.com", "Paciente", "paciente", "Paciente123");
  console.log("seed listo");
  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}
