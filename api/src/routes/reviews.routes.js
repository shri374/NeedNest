import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(300).optional()
});

router.post("/", requireRole("USER", "ADMIN"), async (req, res, next) => {
  try {
    const data = reviewSchema.parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: {
        service: true,
        review: true
      }
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.customerId !== req.user.id) {
      return res.status(403).json({ message: "Not your booking" });
    }

    if (booking.status !== "COMPLETED") {
      return res.status(400).json({ message: "Only completed bookings can be reviewed" });
    }

    if (booking.review) {
      return res.status(409).json({ message: "Review already submitted" });
    }

    const review = await prisma.review.create({
      data: {
        bookingId: data.bookingId,
        rating: data.rating,
        comment: data.comment,
        userId: req.user.id,
        serviceId: booking.serviceId
      }
    });

    return res.status(201).json(review);
  } catch (error) {
    return next(error);
  }
});

export default router;
