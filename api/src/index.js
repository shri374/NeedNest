import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import app from "./app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(__dirname, "../../.env");
const apiEnvPath = path.resolve(__dirname, "../.env");

// Prefer a single root .env, but keep api/.env as fallback.
dotenv.config({ path: rootEnvPath });
dotenv.config({ path: apiEnvPath, override: false });

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  console.log(`NeedNest API running at http://localhost:${port}`);
});
