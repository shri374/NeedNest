import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authRequired } from "../middleware/auth.js";
import { signToken } from "../utils/token.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(["USER", "PROVIDER"]).optional(),
  city: z.string().min(2).optional(),
  phone: z.string().min(8).optional()
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6)
});

router.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role ?? "USER",
        city: data.city,
        phone: data.phone
      }
    });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        phone: user.phone,
        shopName: user.shopName,
        shopDescription: user.shopDescription,
        shopAddress: user.shopAddress
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const matches = await bcrypt.compare(data.password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        phone: user.phone,
        shopName: user.shopName,
        shopDescription: user.shopDescription,
        shopAddress: user.shopAddress
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", authRequired, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        city: true,
        phone: true,
        shopName: true,
        shopDescription: true,
        shopAddress: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
});

export default router;
