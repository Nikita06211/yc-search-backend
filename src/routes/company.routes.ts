import { Router } from "express";
import { getCompanies, createCompany } from "../controllers/company.controller";
import { searchCompanies } from "../controllers/search.controller";

const router = Router();

// get all companies
router.get("/", getCompanies);

// add a new company
router.post("/", createCompany);

// search companies
router.post("/search", searchCompanies);

export default router;
