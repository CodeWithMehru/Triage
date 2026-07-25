import "dotenv/config";
import express from "express";
import { securityTrapMiddleware } from "./middleware/securityTrap.js";
import { healthRouter } from "./routes/health.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: true, limit: "64kb" }));

app.use(healthRouter);

const requireApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Allow health checks to pass without authentication
  if (req.path === "/health") {
    next();
    return;
  }

  const apiKey = req.headers["x-triage-api-key"];
  if (!apiKey || typeof apiKey !== "string" || !apiKey.startsWith("trg_live_")) {
    res.status(401).json({ error: "Unauthorized: Missing or invalid x-triage-api-key header. Expected prefix 'trg_live_'." });
    return;
  }

  next();
};

app.use(requireApiKey);

app.use(securityTrapMiddleware);

app.get("/api/users", (_req, res) => {
  res.json({
    users: [
      { id: 1, name: "admin", role: "superuser" },
      { id: 2, name: "guest", role: "viewer" },
    ],
  });
});

app.get("/api/data", (req, res) => {
  const filter = req.query.filter ?? "all";
  res.json({ filter, records: [], total: 0 });
});

app.post("/api/search", (req, res) => {
  const query = req.body?.q ?? req.body?.query ?? "";
  res.json({ query, results: [], count: 0 });
});

app.get("/api/export", (req, res) => {
  res.json({ format: req.query.format ?? "json", status: "ready" });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.listen(port, () => {
  console.log(`[sentinel-trap-api] listening on http://localhost:${port}`);
});
