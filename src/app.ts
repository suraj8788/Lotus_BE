import cors from "cors";
import express from "express";
import { errorMiddleware } from "./middlewares/errorMiddleware";
import keyShowEntryRouter from "./routes/keyShowEntryRoutes";
import luckyDrawRouter from "./routes/luckyDrawRoutes";
import userRouter from "./routes/userRoutes";

const app = express();

app.use(cors());
// Base64-encoded profile pictures are sent inside the JSON request body.
app.use(express.json({ limit: "5mb" }));

app.get("/", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.use("/api/users", userRouter);
app.use("/api/key-show-entry", keyShowEntryRouter);
app.use("/api/lucky-draw", luckyDrawRouter);

app.use((_request, response) => {
  response.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorMiddleware);

export default app;
