import express from "express";
import { join } from "node:path";
import { createTrialStore, TrialError } from "./lib/trial.js";

const PORT = Number(process.env.PORT ?? 3005);

if (!process.env.TYPESAFE_API_KEY) {
  console.warn("TYPESAFE_API_KEY が未設定です。jev-ui/.env に置いてください。");
}

const app = express();
const trials = createTrialStore();

app.use(express.json());
app.use(express.static(join(import.meta.dirname, "public")));

app.post("/api/trials", async (_req, res, next) => {
  try {
    res.json(await trials.start());
  } catch (error) {
    next(error);
  }
});

app.post("/api/trials/:id/picks", async (req, res, next) => {
  try {
    res.json(await trials.pick(req.params.id, req.body ?? {}));
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (!(error instanceof TrialError)) console.error(error);
  res.status(error.status ?? 500).json({ error: error.message });
});

app.listen(PORT, () => {
  console.log(`jev-ui: http://localhost:${PORT}`);
});
