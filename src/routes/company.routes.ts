import { Router } from "express";
import { getCompanies, createCompany } from "../contollers/company.controller";

const router = Router();

// get all companies
router.get("/", getCompanies);

// add a new company
router.post("/", createCompany);

export default router;
