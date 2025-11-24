import express from "express";
import { searchCompanies } from "../services/search.service";

const router = express.Router();

router.post("/", async (req, res) => {
    const query = req.body.query;
    const results = await searchCompanies(query);
    res.json(results);
});


export default router;
