import express from "express";
import cors from "cors";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

export const createServiceApp = ({ serviceName, routes = [] }) => {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
        : true,
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: serviceName });
  });

  for (const { path, router } of routes) {
    app.use(path, router);
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
