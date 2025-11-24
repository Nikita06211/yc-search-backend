import { AppDataSource } from "../config/data-source";
import { Company } from "../entities/Company";
import { fetchAllYCCompanies } from "./ycApi.service";
import { generateEmbedding } from "./embedding.service";
import { pinecone } from "../config/pinecone";

export async function syncYCData() {
    const repo = AppDataSource.getRepository(Company);

    const companies = await fetchAllYCCompanies();

    for (const c of companies) {
        const mapped = {
            name: c.name,
            batch: c.batch,
            industry: c.industry,
            description: c.long_description,
            website: c.website
        };

        // Save to DB
        let company = await repo.findOne({ where: { name: c.name } });

        if (!company) {
            company = repo.create(mapped);
        } else {
            repo.merge(company, mapped);
        }

        await repo.save(company);

        // Create embedding
        const embed = await generateEmbedding(
            `${mapped.name}. ${mapped.description}`
        );

        company.embedding = JSON.stringify(embed);
        await repo.save(company);

        // Save to Pinecone
        await pinecone.index("yc-companies").upsert([{
            id: company.id.toString(),
            values: embed,
            metadata: {
                name: company.name,
                batch: company.batch,
                industry: company.industry,
            }
        }]);
    }

    return { message: "Sync completed", count: companies.length };
}
