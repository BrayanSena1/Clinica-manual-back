import jwt from "jsonwebtoken";
export function needAuth(req,res,next){
  const header = req.headers.authorization || "";
  const [,token] = header.split(" ");
  if(!token) return res.status(401).json({ok:false,msg:"Token faltante"});
  try{
    const p = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = p.sub; req.userRole = p.role;
    next();
  }catch{ return res.status(401).json({ok:false,msg:"Token inválido o expirado"}); }
}
export function needRole(...roles){
  return (req,res,next)=>{
    if(!roles.includes(req.userRole)) return res.status(403).json({ok:false,msg:"No autorizado"});
    next();
  }
}