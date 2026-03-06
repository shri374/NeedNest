import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

const createBookingSchema = z.object({
  serviceId: z.string().min(1),
  scheduledAt: z.iso.datetime(),
  notes: z.string().max(300).optional(),
  issueLevel: z.enum(["MINOR", "SMALL", "MAJOR", "CUSTOM"]),
  problemText: z.string().max(500).optional()
});

const quoteSchema = z.object({
  quotedPrice: z.number().positive(),
  quoteNote: z.string().max(300).optional()
});

const quoteResponseSchema = z.object({
  accepted: z.boolean()
});

const updateStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "COMPLETED", "CANCELLED"])
});

function resolveRequestedPrice(service, issueLevel) {
  if (issueLevel === "MINOR") return service.minorPrice ?? service.price;
  if (issueLevel === "SMALL") return service.smallPrice ?? service.price;
  if (issueLevel === "MAJOR") return service.majorPrice ?? service.price;
  return null;
}

router.post("/", requireRole("USER", "ADMIN"), async (req, res, next) => {
  try {
    const data = createBookingSchema.parse(req.body);

    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service || !service.isActive) {
      return res.status(404).json({ message: "Service not found" });
    }

    const requestedPrice = resolveRequestedPrice(service, data.issueLevel);

    const booking = await prisma.booking.create({
      data: {
        serviceId: data.serviceId,
        customerId: req.user.id,
        scheduledAt: new Date(data.scheduledAt),
        notes: data.notes,
        issueLevel: data.issueLevel,
        problemText: data.problemText,
        requestedPrice
      },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            city: true,
            price: true,
            minorPrice: true,
            smallPrice: true,
            majorPrice: true,
            providerId: true
          }
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
              select: {
                id: true,
                name: true,
                phone: true,
                city: true,
                shopName: true,
                shopAddress: true,
                workType: true
              }
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
          select: {
            id: true,
            title: true,
            city: true,
            minorPrice: true,
            smallPrice: true,
            majorPrice: true
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

router.patch("/:id/quote", requireRole("PROVIDER", "ADMIN"), async (req, res, next) => {
  try {
    const data = quoteSchema.parse(req.body);

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
      return res.status(403).json({ message: "You can only quote your own booking requests" });
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        quotedPrice: data.quotedPrice,
        quoteNote: data.quoteNote,
        status: "QUOTE_SENT"
      }
    });

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/quote-response", requireRole("USER", "ADMIN"), async (req, res, next) => {
  try {
    const data = quoteResponseSchema.parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id }
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.customerId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not your booking" });
    }

    if (booking.status !== "QUOTE_SENT") {
      return res.status(400).json({ message: "Quote response is only allowed after provider quote" });
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: data.accepted
        ? {
            status: "ACCEPTED",
            requestedPrice: booking.quotedPrice ?? booking.requestedPrice
          }
        : {
            status: "QUOTE_REJECTED"
          }
    });

    return res.json(updated);
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

    if (booking.issueLevel === "CUSTOM" && data.status === "ACCEPTED") {
      return res
        .status(400)
        .json({ message: "Custom issue bookings must be accepted by user via quote response" });
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
