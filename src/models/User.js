import mongoose from "mongoose";
const schema = new mongoose.Schema({
  role: { type:String, enum:["paciente","medico","empleado","admin"], default:"paciente" },
  email: { type:String, unique:true, required:true, lowercase:true, trim:true },
  nombre: { type:String, required:true, trim:true },
  passwordHash: { type:String, required:true }
},{timestamps:true, collection:"users"});
export default mongoose.model("User", schema);
