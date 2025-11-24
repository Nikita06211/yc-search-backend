import { Request, Response } from "express";
import { pinecone } from "../config/pinecone";
import { generateEmbedding } from "../services/embedding.service";

interface SearchRequestBody {
    query: string;
}

export const searchCompanies = async (
    req: Request<{}, {}, SearchRequestBody>,
    res: Response
) => {
    try {
        const { query } = req.body;

        if (!query || typeof query !== "string") {
            return res.status(400).json({ message: "Query is required" });
        }

        const queryVector = await generateEmbedding(query);

        // Pinecone index instance
        const index = pinecone.index("yc-companies");

        const results = await index.query({
            vector: queryVector as number[],
            topK: 5,
            includeMetadata: true
        });

        return res.json({
            success: true,
            data: results.matches || []
        });

    } catch (err) {
        console.error("Search Error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
