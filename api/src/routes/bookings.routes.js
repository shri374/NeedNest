import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

const createBookingSchema = z.object({
  serviceId: z.string().min(1),
  scheduledAt: z.iso.datetime(),
  notes: z.string().max(300).optional()
});

const updateStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "COMPLETED", "CANCELLED"])
});

router.post("/", requireRole("USER", "ADMIN"), async (req, res, next) => {
  try {
    const data = createBookingSchema.parse(req.body);

    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service || !service.isActive) {
      return res.status(404).json({ message: "Service not found" });
    }

    const booking = await prisma.booking.create({
      data: {
        serviceId: data.serviceId,
        customerId: req.user.id,
        scheduledAt: new Date(data.scheduledAt),
        notes: data.notes
      },
      include: {
        service: {
          select: { id: true, title: true, city: true, price: true, providerId: true }
        }
      }
    });

    return res.status(201).json(booking);
  } catch (error) {
    return next(error);
  }
});

router.get("/my", requireRole("USER", "ADMIN"), async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { customerId: req.user.id },
      include: {
        review: true,
        service: {
          include: {
            provider: {
              select: { id: true, name: true, phone: true, city: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json(bookings);
  } catch (error) {
    return next(error);
  }
});

router.get("/provider", requireRole("PROVIDER", "ADMIN"), async (req, res, next) => {
  try {
    const where = req.user.role === "ADMIN" ? {} : { service: { providerId: req.user.id } };

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, phone: true, city: true }
        },
        service: {
          select: { id: true, title: true, price: true, city: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json(bookings);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/status", requireRole("PROVIDER", "ADMIN"), async (req, res, next) => {
  try {
    const data = updateStatusSchema.parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        service: {
          select: { providerId: true }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const isOwner = booking.service.providerId === req.user.id || req.user.role === "ADMIN";
    if (!isOwner) {
      return res.status(403).json({ message: "You can only update your own booking requests" });
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: data.status }
    });

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

export default router;
