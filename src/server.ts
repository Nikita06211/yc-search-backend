import app from "./app";
import { AppDataSource } from "./config/data-source";
import "dotenv/config";
import "reflect-metadata";

const PORT = process.env.PORT || 5000;

AppDataSource.initialize().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
