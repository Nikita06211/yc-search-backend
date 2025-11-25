import { OpenAI } from "openai";
import { pinecone } from "../services/pinecone.service";

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
        const queryEmbedding = await embedQuery(query);

        const offset = (page - 1) * limit;

        const result = await pinecone.query({
            vector: queryEmbedding,
            topK: 100,
            includeMetadata: true,
        });

        const allMatches = result.matches || [];
        const paginated = allMatches.slice(offset, offset + limit);

        return {
            success: true,
            page,
            limit,
            total: allMatches.length,
            matches: paginated.map((m: any) => ({
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
