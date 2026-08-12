import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { chatWithAI } from '../controllers/ai.controller';

const router = express.Router();

router.post('/chat', authenticateJWT, chatWithAI);

export default router;
