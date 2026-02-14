import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  getUserProfile,
  getUserScoreHistory,
  getHeatmapData,
  updateUserProfile
} from '../controllers/userController.js';

const router = express.Router();

router.use(verifyToken); 

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.get('/scores', getUserScoreHistory);
router.get('/heatmap', getHeatmapData);
router.get('/', getUserProfile); 

export default router;