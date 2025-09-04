import express from 'express';
import user from './api/user.api.js';
export const _ = express.Router();

_.use("/auth", user);


export default _;