// src/routes/ingest.routes.ts

import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';

const router = Router();
const adminController = new AdminController();

// Manually trigger scraping job
router.post('/run', adminController.triggerIngest);

export default router;