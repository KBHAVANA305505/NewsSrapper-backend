import { Request, Response, Router } from 'express';
import publicRoutes from './public.routes';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import ingestRoutes from './ingest.routes'; 

export function setupRoutes(app: any) {
  
  // Root redirect to API docs
  app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to NewsHub Backend!');
  });

  // Create the API router
  const apiRouter = Router();

  // Mount other routers to the API router
  apiRouter.use('/', publicRoutes);
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/admin', adminRoutes);
  apiRouter.use('/ingest', ingestRoutes); // Mount the ingest routes

  // Mount API router to the app
  app.use('/api', apiRouter);
}