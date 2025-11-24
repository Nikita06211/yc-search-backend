import { OpenAI } from "openai";
import { pinecone } from "../services/pinecone.service";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

// ----------- Create embedding for user query -----------
async function embedQuery(query: string) {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
    });

    return response.data[0].embedding;
}

// ----------- Search Service -----------
export const searchCompanies = async (query: string) => {
    try {
        // 1. Embed the query
        const queryEmbedding = await embedQuery(query);

        // 2. Query Pinecone index
        const result = await pinecone.query({
            topK: 5,
            vector: queryEmbedding,
            includeMetadata: true,
        });

        // 3. Format response
        return {
            success: true,
            matches: result.matches?.map((m: any) => ({
                score: m.score,
                name: m.metadata?.name,
                description: m.metadata?.description,
                website: m.metadata?.website,
            })),
        };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
};
