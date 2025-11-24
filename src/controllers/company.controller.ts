import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Company } from "../entities/Company";
import { generateEmbedding } from "../services/embedding.service";
import { pinecone } from "../config/pinecone";

// GET /companies
export const getCompanies = async (req: Request, res: Response) => {
    try {
        const repo = AppDataSource.getRepository(Company);
        const companies = await repo.find();
        return res.json({ success: true, data: companies });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// POST /companies

export const createCompany = async (req: Request, res: Response) => {
    try {
        const repo = AppDataSource.getRepository(Company);
        const { name, batch, industry, description, website } = req.body;

        const textToEmbed = `${name} ${industry} ${batch} ${description}`;
        const vector = await generateEmbedding(textToEmbed);

        // Save in Postgres
        const company = repo.create({
            name,
            batch,
            industry,
            description,
            website
        });

        await repo.save(company);

        // Push embedding to Pinecone
        const index = pinecone.index("yc-companies");

        await index.upsert([
            {
                id: company.id.toString(),
                values: vector,
                metadata: {
                    name,
                    batch,
                    industry,
                    description,
                    website
                }
            }
        ]);

        return res.status(201).json({ success: true, data: company });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
