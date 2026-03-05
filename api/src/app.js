import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import servicesRoutes from "./routes/services.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";
import reviewsRoutes from "./routes/reviews.routes.js";
import providersRoutes from "./routes/providers.routes.js";
import { errorHandler, notFound } from "./middleware/error.js";

const app = express();
const configuredOrigins =
  process.env.CLIENT_URL?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const isLocalDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (isLocalDevOrigin || configuredOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ name: "NeedNest API", status: "ok" });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/providers", providersRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
