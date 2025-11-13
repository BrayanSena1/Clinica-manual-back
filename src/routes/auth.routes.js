import { Router } from "express";
import { login, me, register } from "../controllers/auth.controller.js";
import { needAuth } from "../middleware/auth.js";

const r = Router();

r.post("/login", login);
r.post("/register", register);
r.get("/me", needAuth, me);

export default r;
