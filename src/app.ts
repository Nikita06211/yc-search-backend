import express from "express";
import cors from "cors";
import companyRoutes from "./routes/company.routes";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/companies", companyRoutes);

export default app;
