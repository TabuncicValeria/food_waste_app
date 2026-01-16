import express from 'express';
import env from 'dotenv';
import cors from "cors";

import createDBRouter from './routes/createDBRouter.js';
import userRouter from './routes/userRouter.js';
import categoryRouter from './routes/categoryRouter.js';
import foodItemRouter from './routes/foodItemRouter.js';
import availabilityRouter from './routes/availabilityRouter.js';
import claimRouter from './routes/claimRouter.js';
import friendGroupRouter from './routes/friendGroupRouter.js';
import groupMemberRouter from './routes/groupMemberRouter.js';
import expirationAlertRouter from './routes/expirationAlertRouter.js';
import socialPostRouter from './routes/socialPostRouter.js';

env.config();

const app = express();

app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/create', createDBRouter);

app.use('/api/users', userRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/fooditems', foodItemRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/claims', claimRouter);
app.use('/api/friendgroups', friendGroupRouter);
app.use('/api/groupmembers', groupMemberRouter);
app.use('/api/expirationalerts', expirationAlertRouter);
app.use('/api/socialposts', socialPostRouter);

const port = process.env.PORT || 3000;
app.listen(port);

console.log(`Server running on port ${port}`);
