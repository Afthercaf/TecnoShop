import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import venderosRoutes from  "./routes/venderos.routes.js";
import authRoutes from "./routes/auth.routes.js";
import PaymentRoutes from "./routes/payment.reutes.js";
import { FRONTEND_URL } from "./config.js";


const app = express();

app.use(
  cors({
    credentials: true,
    origin: FRONTEND_URL,
  })
);

app.use(express.json());

app.use(morgan("dev"));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api", venderosRoutes);
app.use("/api", PaymentRoutes);

if (process.env.NODE_ENV === "production") {
  const path = await import("path");
  app.use(express.static("client/dist"));

  app.get("*", (req, res) => {
    console.log(path.resolve("client", "dist", "index.html") );
    res.sendFile(path.resolve("client", "dist", "index.html"));
  });
}


export default app;
