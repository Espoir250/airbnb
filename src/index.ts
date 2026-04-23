import express, { Request, Response } from "express";

import  listingsRouter from "./routes/listings.routes";
import  usersRouter from "./routes/users.routes";

const app = express();
const port = 3000;

app.use(express.json());

app.use("/users", usersRouter);
app.use("/listings", listingsRouter);

app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: "route not found"});
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})