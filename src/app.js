import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import router from './routes/index.api.js';
import globalErrorHandler from './utils/globalErrorHandler.js';
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// Importing Routes
app.use('/api/v1', router);

// Error Handling Middleware
app.use(globalErrorHandler);



export default app;
