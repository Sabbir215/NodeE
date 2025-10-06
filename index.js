import 'dotenv/config';
import app from './src/app.js';
import { connectDatabase } from './src/database/db.config.js';


// Connecting Databases
connectDatabase().then( () => {
    app.listen(process.env.PORT, () => {
        console.log(`Server listening through https://localhost:${process.env.PORT}`)
    })
}).catch((error) => {
    console.error('Failed to start server:', error);
});