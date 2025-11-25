import { OpenAI } from "openai";
import { pinecone } from "../services/pinecone.service";
import { interpretSearchQuery } from "./query-interpretation.service";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

async function embedQuery(query: string) {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
    });

    return response.data[0].embedding;
}

/**
 * Converts filter object to Pinecone metadata filter format
 */
function buildPineconeFilter(filters: any): any {
    if (!filters || Object.keys(filters).length === 0) {
        return undefined;
    }

    const pineconeFilter: any = {};

    if (filters.batch) {
        pineconeFilter.batch = { $eq: filters.batch };
    }

    if (filters.industry) {
        if (typeof filters.industry === "string") {
            // Exact match for single industry
            pineconeFilter.industry = { $eq: filters.industry };
        } else if (filters.industry.$in && Array.isArray(filters.industry.$in)) {
            // OR match for multiple industries
            pineconeFilter.industry = { $in: filters.industry.$in };
        }
    }

    return Object.keys(pineconeFilter).length > 0 ? pineconeFilter : undefined;
}

export const searchCompanies = async (
    query: string,
    page: number = 1,
    limit: number = 10
) => {
    try {
        // Step 1: Use GPT tool calling to interpret the query semantically
        const searchInstructions = await interpretSearchQuery(query);
        
        // Step 2: Embed the cleaned query (not the raw user query)
        const queryEmbedding = await embedQuery(searchInstructions.query);

        // Step 3: Build Pinecone filter from structured filters
        const pineconeFilter = buildPineconeFilter(searchInstructions.filters);

        const offset = (page - 1) * limit;

        // Step 4: Query Pinecone with vector + optional filters
        const queryOptions: any = {
            vector: queryEmbedding,
            topK: 100,
            includeMetadata: true,
        };

        if (pineconeFilter) {
            queryOptions.filter = pineconeFilter;
        }

        const result = await pinecone.query(queryOptions);

        const allMatches = result.matches || [];
        const paginated = allMatches.slice(offset, offset + limit);

        return {
            success: true,
            page,
            limit,
            total: allMatches.length,
            interpretedQuery: searchInstructions.query, // Include for debugging/transparency
            filters: searchInstructions.filters || null, // Include for debugging/transparency
            matches: paginated.map((m: any) => ({
                score: m.score,
                name: m.metadata?.name,
                description: m.metadata?.description,
                website: m.metadata?.website,
                batch: m.metadata?.batch,
                industry: m.metadata?.industry,
            })),
        };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
};
