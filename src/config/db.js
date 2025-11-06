import mongoose from "mongoose";
export async function connectDB(uri){
  try{ mongoose.set("strictQuery", true);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log("MongoDB OK:", mongoose.connection.name);
  }catch(e){ console.error("MongoDB error:", e.message); process.exit(1); }
}