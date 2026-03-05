export function notFound(_req, res) {
  return res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err, _req, res, _next) {
  if (err?.name === "ZodError") {
    return res.status(400).json({
      message: "Validation failed",
      errors: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  if (err?.message?.startsWith("CORS blocked origin:")) {
    return res.status(403).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
}
