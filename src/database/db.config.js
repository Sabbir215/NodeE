import 'dotenv/config';
import mongoose from 'mongoose';
import { dbName } from '../constants/constant.js';
const log = console.log;

export const connectDatabase = async () => {
    try {
        const db = await mongoose.connect(`${process.env.MONGODB_URL}/${dbName}`);
        log(`Database connection successfull .. ${db.connection.host}`);
        return db;
    } catch (err) {
        log(`Error from Database Connection ${err}`)
    }
}