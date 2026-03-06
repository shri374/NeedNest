import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();

const createServiceSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(2),
  workType: z.string().min(2).optional(),
  city: z.string().min(2),
  price: z.number().positive().optional(),
  minorPrice: z.number().positive(),
  smallPrice: z.number().positive(),
  majorPrice: z.number().positive(),
  imageUrl: z.url().optional()
});

function buildSearchTokens(raw) {
  if (!raw) return [];
  const value = String(raw).trim().toLowerCase();
  if (!value) return [];

  const aliases = {
    cleaner: "cleaning",
    cleaning: "cleaner",
    electrician: "electrical",
    electrical: "electrician",
    plumber: "plumbing",
    plumbing: "plumber"
  };

  return [...new Set([value, aliases[value]].filter(Boolean))];
}

router.get("/", async (req, res, next) => {
  try {
    const { city, category, q } = req.query;
    const searchTokens = buildSearchTokens(q);
    const searchConditions = searchTokens.flatMap((token) => [
      { title: { contains: token, mode: "insensitive" } },
      { description: { contains: token, mode: "insensitive" } },
      { category: { contains: token, mode: "insensitive" } },
      { workType: { contains: token, mode: "insensitive" } },
      { provider: { is: { name: { contains: token, mode: "insensitive" } } } },
      { provider: { is: { shopName: { contains: token, mode: "insensitive" } } } },
      { provider: { is: { workType: { contains: token, mode: "insensitive" } } } }
    ]);

    const services = await prisma.service.findMany({
      where: {
        isActive: true,
        ...(city ? { city: { contains: String(city), mode: "insensitive" } } : {}),
        ...(category ? { category: { contains: String(category), mode: "insensitive" } } : {}),
        ...(searchConditions.length > 0
          ? {
              OR: searchConditions
            }
          : {})
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            city: true,
            phone: true,
            shopName: true,
            shopDescription: true,
            shopAddress: true,
            workType: true
          }
        },
        reviews: {
          select: { rating: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const result = services.map((service) => {
      const count = service.reviews.length;
      const avgRating =
        count === 0
          ? null
          : Number(
              (service.reviews.reduce((sum, review) => sum + review.rating, 0) / count).toFixed(1)
            );

      return {
        ...service,
        reviews: undefined,
        avgRating,
        totalReviews: count
      };
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.get("/mine", authRequired, requireRole("PROVIDER", "ADMIN"), async (req, res, next) => {
  try {
    const where = req.user.role === "ADMIN" ? {} : { providerId: req.user.id };

    const services = await prisma.service.findMany({
      where,
      include: {
        reviews: {
          select: { rating: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const result = services.map((service) => {
      const count = service.reviews.length;
      const avgRating =
        count === 0
          ? null
          : Number(
              (service.reviews.reduce((sum, review) => sum + review.rating, 0) / count).toFixed(1)
            );

      return {
        ...service,
        reviews: undefined,
        avgRating,
        totalReviews: count
      };
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.id },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            city: true,
            phone: true,
            shopName: true,
            shopDescription: true,
            shopAddress: true,
            workType: true
          }
        },
        reviews: {
          include: {
            user: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!service || !service.isActive) {
      return res.status(404).json({ message: "Service not found" });
    }

    return res.json(service);
  } catch (error) {
    return next(error);
  }
});

router.post("/", authRequired, requireRole("PROVIDER", "ADMIN"), async (req, res, next) => {
  try {
    const data = createServiceSchema.parse(req.body);

    const service = await prisma.service.create({
      data: {
        ...data,
        price: data.smallPrice,
        providerId: req.user.id
      }
    });

    return res.status(201).json(service);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/toggle", authRequired, requireRole("PROVIDER", "ADMIN"), async (req, res, next) => {
  try {
    const existing = await prisma.service.findUnique({ where: { id: req.params.id } });

    if (!existing) {
      return res.status(404).json({ message: "Service not found" });
    }

    const isOwner = existing.providerId === req.user.id || req.user.role === "ADMIN";
    if (!isOwner) {
      return res.status(403).json({ message: "You can only manage your own service" });
    }

    const updated = await prisma.service.update({
      where: { id: req.params.id },
      data: { isActive: !existing.isActive }
    });

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

export default router;
