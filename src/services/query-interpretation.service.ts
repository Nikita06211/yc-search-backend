import { OpenAI } from "openai";
import "dotenv/config";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

interface SearchInstructions {
    query: string;
    filters?: {
        batch?: string | { $in?: string[] };
        industry?: string | { $in?: string[] };
        [key: string]: any;
    };
}

/**
 * Converts natural language queries into structured search instructions
 * using GPT tool calling for semantic understanding.
 * 
 * Example: "recently funded fintech startups" becomes:
 * {
 *   query: "fintech startups",
 *   filters: { industry: "fintech" }
 * }
 */
export async function interpretSearchQuery(
    userQuery: string
): Promise<SearchInstructions> {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using mini for cost efficiency
        messages: [
            {
                role: "system",
                content: `You are a search query interpreter for a Y Combinator company database. 
Your job is to convert natural language queries into structured search instructions.

Available metadata fields for filtering:
- batch: YC batch (e.g., "W24", "S23", "W23")
- industry: Company industry (e.g., "Fintech", "AI", "Healthcare")
- name: Company name
- website: Company website URL
- one_liner: Short company description
- description: Full company description

Instructions:
1. Extract the core semantic meaning from the user's query
2. Create a cleaned query string that focuses on what the user is looking for (remove temporal/conditional words like "recently", "new", "latest")
3. If the query mentions specific filters (batch, industry, etc.), extract them into the filters object
4. For temporal queries like "recently funded" or "new startups", focus the query on the domain/industry and note that we can't filter by funding date (not in metadata)
5. Return a clean query optimized for vector similarity search

Examples:
- "recently funded fintech startups" → { query: "fintech startups", filters: { industry: "fintech" } }
- "AI companies from W24 batch" → { query: "AI companies", filters: { batch: "W24" } }
- "healthcare startups" → { query: "healthcare startups", filters: { industry: "healthcare" } }
- "YC companies in SaaS" → { query: "SaaS companies", filters: { industry: "SaaS" } }`,
            },
            {
                role: "user",
                content: userQuery,
            },
        ],
        tools: [
            {
                type: "function",
                function: {
                    name: "create_search_instructions",
                    description:
                        "Converts a natural language search query into structured search instructions with a cleaned query string and optional metadata filters.",
                    parameters: {
                        type: "object",
                        properties: {
                            query: {
                                type: "string",
                                description:
                                    "Cleaned search query optimized for vector similarity. Remove temporal words, focus on domain/industry/functionality.",
                            },
                            filters: {
                                type: "object",
                                description:
                                    "Optional metadata filters for Pinecone. Use exact matches for batch and industry fields.",
                                properties: {
                                    batch: {
                                        type: "string",
                                        description:
                                            "YC batch identifier (e.g., 'W24', 'S23'). Use exact match.",
                                    },
                                    industry: {
                                        oneOf: [
                                            {
                                                type: "string",
                                                description:
                                                    "Single industry name for exact match",
                                            },
                                            {
                                                type: "object",
                                                properties: {
                                                    $in: {
                                                        type: "array",
                                                        items: { type: "string" },
                                                        description:
                                                            "Array of industry names for OR matching",
                                                    },
                                                },
                                            },
                                        ],
                                        description:
                                            "Industry filter - can be a single string or object with $in for multiple industries",
                                    },
                                },
                                additionalProperties: false,
                            },
                        },
                        required: ["query"],
                    },
                },
            },
        ],
        tool_choice: { type: "function", function: { name: "create_search_instructions" } },
        temperature: 0.3, // Lower temperature for more consistent interpretations
    });

    const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.type !== "function" || toolCall.function.name !== "create_search_instructions") {
        // Fallback: use original query if tool calling fails
        return { query: userQuery };
    }

    try {
        const parsed = JSON.parse(toolCall.function.arguments) as SearchInstructions;
        return parsed;
    } catch (error) {
        // Fallback: use original query if parsing fails
        console.error("Error parsing tool call arguments:", error);
        return { query: userQuery };
    }
}

