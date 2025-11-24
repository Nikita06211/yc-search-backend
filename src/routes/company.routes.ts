import express from "express";
import { importYCCompanies } from "../controllers/company.controller";

const router = express.Router();

router.get("/import-yc", async (req, res) => {
    const result = await importYCCompanies();
    res.json(result);
});

export default router;
