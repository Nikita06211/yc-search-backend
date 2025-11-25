import express from "express";
import { searchCompanies } from "../services/search.service";

const router = express.Router();

router.post("/search", async (req, res) => {
    const { query, page = 1, limit = 10 } = req.body;

    const response = await searchCompanies(query, Number(page), Number(limit));
    res.json(response);
});


export default router;
