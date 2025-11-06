import mongoose from "mongoose";
const schema = new mongoose.Schema({
  docTipo: { type:String, default:"CC" },
  docNumero: { type:String, required:true, unique:true, index:true },
  nombre: { type:String, required:true, trim:true },
  apellido: { type:String, trim:true },
  email: { type:String, lowercase:true, trim:true },
  telefono: { type:String, trim:true },
  cargo: { type:String, trim:true },
  salario: { type:Number, default:0 },
  estado: { type:String, enum:["activo","inactivo"], default:"activo" },
  activo: { type:Boolean, default:true },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref:"User" }
},{timestamps:true, collection:"empleados"});
export default mongoose.model("Empleado", schema);
