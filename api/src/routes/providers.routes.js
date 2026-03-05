import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);
router.use(requireRole("PROVIDER", "ADMIN"));

const shopSchema = z.object({
  shopName: z.string().min(2),
  shopDescription: z.string().min(10).optional(),
  shopAddress: z.string().min(5).optional(),
  city: z.string().min(2).optional(),
  phone: z.string().min(8).optional()
});

router.get("/me/shop", async (req, res, next) => {
  try {
    const provider = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        city: true,
        phone: true,
        shopName: true,
        shopDescription: true,
        shopAddress: true
      }
    });

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    return res.json(provider);
  } catch (error) {
    return next(error);
  }
});

router.put("/me/shop", async (req, res, next) => {
  try {
    const data = shopSchema.parse(req.body);

    const provider = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true,
        name: true,
        city: true,
        phone: true,
        shopName: true,
        shopDescription: true,
        shopAddress: true
      }
    });

    return res.json(provider);
  } catch (error) {
    return next(error);
  }
});

export default router;
