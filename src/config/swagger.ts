import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { Request, Response } from 'express';

const swaggerDocument = YAML.load('./src/config/swagger.yaml');

// This function sets up all Swagger-related routes and should be exported once.
export const setupSwagger = (app: any) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Swagger in JSON format
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });
};