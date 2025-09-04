const log = console.log;
import 'dotenv/config';
import app from './src/app.js';
import { connectDatabase } from './src/database/db.config.js';


// Connecting Databases
connectDatabase().then( () => {
    app.listen(process.env.PORT, () => {
        log(`Server listening through https://localhost:${process.env.PORT}`)
    })
}).catch();