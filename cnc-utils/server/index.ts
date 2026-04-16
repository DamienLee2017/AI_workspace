import express from "express";
import { setup } from "@lark-apaas/express-core";
import { registerRoutes } from "./routes/index";

const port = Number(process.env.FORCE_SERVER_PORT) || 3000;
const host = process.env.FORCE_SERVER_HOST || "localhost";
const basePath = process.env.CLIENT_BASE_PATH || "/";

const app = express();

// Platform middleware
const { close } = setup(app);

// All routes under basePath
const router = express.Router();
registerRoutes(router);

app.use(basePath, router);

const server = app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}${basePath}`);
});

process.on("SIGTERM", async () => {
  server.close();
  await close();
});
