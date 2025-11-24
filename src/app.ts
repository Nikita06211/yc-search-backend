import express from "express";
import cors from "cors";
import companyRoutes from "./routes/company.routes";
import ycRoutes from "./routes/yc.routes";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/companies", companyRoutes);
app.use("/yc", ycRoutes);

export default app;
