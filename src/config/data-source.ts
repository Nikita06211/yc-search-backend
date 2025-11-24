import { DataSource } from "typeorm";
import { Company } from "../entities/Company";
import "dotenv/config";

export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    synchronize: true,
    logging: false,
    entities: [Company],
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
});
