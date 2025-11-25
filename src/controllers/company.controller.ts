import axios from "axios";
import { pinecone } from "../services/pinecone.service";
import { generateEmbedding } from "../services/embedding.service";

export async function importYCCompanies() {
    const url = "https://yc-oss.github.io/api/companies/all.json";

    const { data } = await axios.get(url);

    console.log("Total companies fetched:", data.length);

    const CHUNK_SIZE = 50;
    let totalInserted = 0;

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);

        // generate embeddings
        const embeddings = await Promise.all(
            chunk.map((company) =>
                generateEmbedding(
                    `${company.name ?? ""}. ${company.one_liner ?? ""}. ${company.long_description ?? ""}`
                )
            )
        );

        // sanitize metadata
        const vectors = chunk.map((company, index) => ({
            id: company.id.toString(),
            values: embeddings[index],
            metadata: {
                name: company.name || "",
                website: company.website || "",
                batch: company.batch || "",
                industry: company.industry || "",
                one_liner: company.one_liner || "",
                description: company.long_description || "",
                location: company.all_locations || "",
                regions: Array.isArray(company.regions) ? company.regions : [],
                stage: company.stage || "",
                team_size: company.team_size || 0,
                tags: Array.isArray(company.tags) ? company.tags : [],
                isHiring: company.isHiring || false,
            },
        }));

        await pinecone.upsert(vectors);

        totalInserted += vectors.length;
        console.log(`Inserted so far: ${totalInserted}`);
    }

    console.log("Import completed:", totalInserted);
    return { success: true, count: totalInserted };
}
