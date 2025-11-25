import { OpenAI } from "openai";
import { pinecone } from "../services/pinecone.service";
import { generatePineconeQuery, PineconeQuery } from "./query-interpretation.service";

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

export const searchCompanies = async (
    query: string,
    page: number = 1,
    limit: number = 10
) => {
    try {
        // Step 1: Use GPT tool calling to generate complete Pinecone query object
        const pineconeQuery: PineconeQuery = await generatePineconeQuery(query);
        
        // Step 2: Embed the queryText from the Pinecone query
        const queryEmbedding = await embedQuery(pineconeQuery.queryText);

        const offset = (page - 1) * limit;

        // Step 3: Build Pinecone query options directly from OpenAI-generated query
        const queryOptions: any = {
            vector: queryEmbedding,
            topK: pineconeQuery.topK || 100, // Use OpenAI-specified topK or default to 100
            includeMetadata: true,
        };

        // Add filter if OpenAI generated one
        if (pineconeQuery.filter && Object.keys(pineconeQuery.filter).length > 0) {
            queryOptions.filter = pineconeQuery.filter;
        }

        // Step 4: Execute the Pinecone query (directly from OpenAI)
        const result = await pinecone.query(queryOptions);

        const allMatches = result.matches || [];
        const paginated = allMatches.slice(offset, offset + limit);

        return {
            success: true,
            page,
            limit,
            total: allMatches.length,
            pineconeQuery: {
                queryText: pineconeQuery.queryText,
                filter: pineconeQuery.filter || null,
                topK: pineconeQuery.topK || 100,
            }, // Include the generated Pinecone query for transparency
            matches: paginated.map((m: any) => ({
                score: m.score,
                name: m.metadata?.name,
                description: m.metadata?.description,
                website: m.metadata?.website,
                batch: m.metadata?.batch,
                industry: m.metadata?.industry,
                location: m.metadata?.location,
                regions: m.metadata?.regions || [],
                stage: m.metadata?.stage,
                team_size: m.metadata?.team_size,
                tags: m.metadata?.tags || [],
                isHiring: m.metadata?.isHiring || false,
            })),
        };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
};
