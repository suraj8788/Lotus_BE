import app from "./app";
import { AppDataSource } from "./config/data-source";

const port = Number(process.env.PORT ?? 3000);

const startServer = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log("Database connected successfully");

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  }
};

void startServer();
