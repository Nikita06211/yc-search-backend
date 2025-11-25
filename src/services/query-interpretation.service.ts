import { OpenAI } from "openai";
import "dotenv/config";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Pinecone query object that can be directly executed
 */
export interface PineconeQuery {
    queryText: string; // Text to be embedded for vector search
    filter?: {
        batch?: { $eq?: string };
        industry?: { $eq?: string } | { $in?: string[] };
        location?: { $eq?: string } | { $in?: string[] };
        regions?: { $in?: string[] };
        stage?: { $eq?: string } | { $in?: string[] };
        team_size?: { $gte?: number } | { $lte?: number } | { $eq?: number };
        tags?: { $in?: string[] };
        isHiring?: { $eq?: boolean };
        [key: string]: any;
    };
    topK?: number; // Optional topK override (default: 100)
}

/**
 * Converts natural language queries into a Pinecone query object
 * using GPT tool calling for semantic understanding.
 * 
 * Returns a complete Pinecone query that can be directly executed.
 * 
 * Example: "recently funded fintech startups" becomes:
 * {
 *   queryText: "fintech startups",
 *   filter: { industry: { $eq: "fintech" } }
 * }
 */
export async function generatePineconeQuery(
    userQuery: string
): Promise<PineconeQuery> {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using mini for cost efficiency
        messages: [
            {
                role: "system",
                content: `You are a Pinecone query generator for a Y Combinator company database. 
Your job is to convert natural language queries into complete Pinecone query objects that can be directly executed.

Available metadata fields for filtering:
- batch: YC batch (e.g., "W24", "S23", "W23", "Winter 2012")
- industry: Company industry (e.g., "Fintech", "AI", "Healthcare", "Industrials")
- location: Company location (e.g., "London, England, United Kingdom")
- regions: Array of regions (e.g., ["United Kingdom", "Europe", "Remote"])
- stage: Company stage (e.g., "Early", "Growth", "Late")
- team_size: Number of employees (numeric, can use $gte, $lte, $eq)
- tags: Array of tags (e.g., ["Hard Tech", "Hardware", "Robotics"])
- isHiring: Boolean indicating if company is hiring (true/false)
- name: Company name
- website: Company website URL
- one_liner: Short company description
- description: Full company description

Pinecone Filter Format:
- Exact match: { field: { $eq: "value" } }
- Multiple values (OR): { field: { $in: ["value1", "value2"] } }
- Numeric comparisons: { field: { $gte: 10 } } (greater than or equal), { $lte: 100 } (less than or equal), { $eq: 50 } (equal)
- Boolean: { field: { $eq: true } } or { field: { $eq: false } }
- Multiple filters (AND): { field1: { $eq: "value1" }, field2: { $eq: "value2" } }

Instructions:
1. Extract the core semantic meaning from the user's query
2. Create a cleaned queryText string that focuses on what the user is looking for (remove temporal/conditional words like "recently", "new", "latest")
3. If the query mentions specific filters (batch, industry, etc.), create a filter object in Pinecone format
4. For temporal queries like "recently funded" or "new startups", focus the queryText on the domain/industry (we can't filter by funding date - not in metadata)
5. Return a complete Pinecone query object with queryText and optional filter

Examples:
- "recently funded fintech startups" → { queryText: "fintech startups", filter: { industry: { $eq: "fintech" } } }
- "AI companies from W24 batch" → { queryText: "AI companies", filter: { batch: { $eq: "W24" } } }
- "healthcare or fintech startups" → { queryText: "healthcare fintech startups", filter: { industry: { $in: ["healthcare", "fintech"] } } }
- "YC companies in SaaS" → { queryText: "SaaS companies", filter: { industry: { $eq: "SaaS" } } }
- "companies hiring in London" → { queryText: "companies", filter: { location: { $eq: "London" }, isHiring: { $eq: true } } }
- "early stage companies with 20+ employees" → { queryText: "early stage companies", filter: { stage: { $eq: "Early" }, team_size: { $gte: 20 } } }
- "hardware companies in Europe" → { queryText: "hardware companies", filter: { regions: { $in: ["Europe"] }, tags: { $in: ["Hardware"] } } }`,
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
                    name: "generate_pinecone_query",
                    description:
                        "Generates a complete Pinecone query object from a natural language query. Returns queryText for embedding and optional filter in Pinecone format.",
                    parameters: {
                        type: "object",
                        properties: {
                            queryText: {
                                type: "string",
                                description:
                                    "Cleaned search query text optimized for vector similarity. Remove temporal words, focus on domain/industry/functionality. This will be embedded.",
                            },
                            filter: {
                                type: "object",
                                description:
                                    "Optional Pinecone metadata filter object. Use Pinecone filter format: { field: { $eq: 'value' } } or { field: { $in: ['value1', 'value2'] } }",
                                properties: {
                                    batch: {
                                        type: "object",
                                        properties: {
                                            $eq: {
                                                type: "string",
                                                description: "YC batch identifier (e.g., 'W24', 'S23')",
                                            },
                                        },
                                        description: "Filter by YC batch using exact match",
                                    },
                                    industry: {
                                        oneOf: [
                                            {
                                                type: "object",
                                                properties: {
                                                    $eq: {
                                                        type: "string",
                                                        description: "Single industry name for exact match",
                                                    },
                                                },
                                            },
                                            {
                                                type: "object",
                                                properties: {
                                                    $in: {
                                                        type: "array",
                                                        items: { type: "string" },
                                                        description: "Array of industry names for OR matching",
                                                    },
                                                },
                                            },
                                        ],
                                        description: "Filter by industry - use $eq for single value or $in for multiple",
                                    },
                                    location: {
                                        oneOf: [
                                            {
                                                type: "object",
                                                properties: {
                                                    $eq: { type: "string", description: "Exact location match" },
                                                },
                                            },
                                            {
                                                type: "object",
                                                properties: {
                                                    $in: {
                                                        type: "array",
                                                        items: { type: "string" },
                                                        description: "Array of locations for OR matching",
                                                    },
                                                },
                                            },
                                        ],
                                        description: "Filter by company location",
                                    },
                                    regions: {
                                        type: "object",
                                        properties: {
                                            $in: {
                                                type: "array",
                                                items: { type: "string" },
                                                description: "Array of regions (e.g., ['United Kingdom', 'Europe', 'Remote'])",
                                            },
                                        },
                                        description: "Filter by regions - use $in for multiple regions",
                                    },
                                    stage: {
                                        oneOf: [
                                            {
                                                type: "object",
                                                properties: {
                                                    $eq: { type: "string", description: "Company stage (e.g., 'Early', 'Growth')" },
                                                },
                                            },
                                            {
                                                type: "object",
                                                properties: {
                                                    $in: {
                                                        type: "array",
                                                        items: { type: "string" },
                                                        description: "Array of stages for OR matching",
                                                    },
                                                },
                                            },
                                        ],
                                        description: "Filter by company stage",
                                    },
                                    team_size: {
                                        type: "object",
                                        properties: {
                                            $eq: { type: "number", description: "Exact team size" },
                                            $gte: { type: "number", description: "Team size greater than or equal to" },
                                            $lte: { type: "number", description: "Team size less than or equal to" },
                                        },
                                        description: "Filter by team size (number of employees)",
                                    },
                                    tags: {
                                        type: "object",
                                        properties: {
                                            $in: {
                                                type: "array",
                                                items: { type: "string" },
                                                description: "Array of tags (e.g., ['Hard Tech', 'Hardware', 'Robotics'])",
                                            },
                                        },
                                        description: "Filter by tags - use $in for multiple tags",
                                    },
                                    isHiring: {
                                        type: "object",
                                        properties: {
                                            $eq: { type: "boolean", description: "Filter by hiring status (true/false)" },
                                        },
                                        description: "Filter by whether company is hiring",
                                    },
                                },
                                additionalProperties: false,
                            },
                            topK: {
                                type: "number",
                                description:
                                    "Optional topK parameter override (default is 100). Only specify if user explicitly requests a different number of results.",
                            },
                        },
                        required: ["queryText"],
                    },
                },
            },
        ],
        tool_choice: { type: "function", function: { name: "generate_pinecone_query" } },
        temperature: 0.3, // Lower temperature for more consistent interpretations
    });

    const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.type !== "function" || toolCall.function.name !== "generate_pinecone_query") {
        // Fallback: use original query if tool calling fails
        return { queryText: userQuery };
    }

    try {
        const parsed = JSON.parse(toolCall.function.arguments) as PineconeQuery;
        return parsed;
    } catch (error) {
        // Fallback: use original query if parsing fails
        console.error("Error parsing tool call arguments:", error);
        return { queryText: userQuery };
    }
}

