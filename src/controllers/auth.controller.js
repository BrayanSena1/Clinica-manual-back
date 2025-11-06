import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
const safe = (u)=>({id:u._id,email:u.email,nombre:u.nombre,role:u.role});
export async function login(req,res){
  try{
    const {email,password} = req.body||{};
    if(!email||!password) return res.status(400).json({ok:false,msg:"Faltan credenciales"});
    const u = await User.findOne({email: email.toLowerCase()});
    if(!u) return res.status(401).json({ok:false,msg:"Usuario o contraseña inválidos"});
    const ok = await bcrypt.compare(password, u.passwordHash);
    if(!ok) return res.status(401).json({ok:false,msg:"Usuario o contraseña inválidos"});
    const token = jwt.sign({sub:u._id,role:u.role}, process.env.JWT_SECRET, {expiresIn:"2h"});
    res.json({ok:true,msg:"OK",token,user:safe(u)});
  }catch(e){ console.error(e); res.status(500).json({ok:false,msg:"Error"}); }
}
export async function me(req,res){
  try{
    const u = await User.findById(req.userId);
    if(!u) return res.status(404).json({ok:false,msg:"No encontrado"});
    res.json({ok:true,user:safe(u)});
  }catch(e){ res.status(500).json({ok:false,msg:"Error"}); }
}