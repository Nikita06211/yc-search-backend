import express from "express";
import cors from "cors";
import companyRoutes from "./routes/company.routes";
import searchRoutes from "./routes/search.routes";
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/company", companyRoutes);
app.use("/api/search", searchRoutes);

export default app;
