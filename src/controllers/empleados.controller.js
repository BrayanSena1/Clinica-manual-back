import Empleado from "../models/Empleado.js";
export async function list(req,res){
  try{
    const {q} = req.query; const f={activo:true};
    if(q){ const rx=new RegExp(q,"i");
      f.$or=[{nombre:rx},{apellido:rx},{email:rx},{cargo:rx},{docNumero:rx}]; }
    const data = await Empleado.find(f).sort({createdAt:-1}).limit(500);
    res.json({ok:true, empleados:data});
  }catch(e){console.error(e);res.status(500).json({ok:false,msg:"Error al listar"});}
}
export async function create(req,res){
  try{
    const body = req.body||{}; body.creadoPor = req.userId;
    const x = await Empleado.create(body);
    res.status(201).json({ok:true, empleado:x});
  }catch(e){ if(e.code===11000) return res.status(409).json({ok:false,msg:"Duplicado"});
    console.error(e); res.status(500).json({ok:false,msg:"Error al crear"});}
}
export async function one(req,res){
  try{
    const x = await Empleado.findById(req.params.id);
    if(!x||!x.activo) return res.status(404).json({ok:false,msg:"No encontrado"});
    res.json({ok:true, empleado:x});
  }catch(e){res.status(500).json({ok:false,msg:"Error"});}
}
export async function update(req,res){
  try{
    const x = await Empleado.findByIdAndUpdate(req.params.id, req.body, {new:true});
    if(!x) return res.status(404).json({ok:false,msg:"No encontrado"});
    res.json({ok:true, empleado:x});
  }catch(e){res.status(500).json({ok:false,msg:"Error al actualizar"});}
}
export async function remove(req,res){
  try{
    const x = await Empleado.findByIdAndUpdate(req.params.id, {activo:false}, {new:true});
    if(!x) return res.status(404).json({ok:false,msg:"No encontrado"});
    res.json({ok:true,msg:"Eliminado"});
  }catch(e){res.status(500).json({ok:false,msg:"Error al eliminar"});}
}