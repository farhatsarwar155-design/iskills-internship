import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { globalSearch } from '../controllers/search.controller';

const router = express.Router();

router.get('/global', authenticateJWT, globalSearch);

export default router;
