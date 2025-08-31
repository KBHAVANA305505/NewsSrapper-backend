import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../utils/validation';
import { logger } from '../utils/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response) => {
    try {
      // Validate input
      const validatedData = registerSchema.parse(req.body);

      // Register user
      const result = await this.authService.register(validatedData);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Registration controller error:', error);

      if (error instanceof Error) {
        if (error.message === 'User already exists with this email') {
          return res.status(409).json({
            success: false,
            error: 'Conflict',
            message: error.message,
          });
        }
      }

      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to register user',
      });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      // Validate input
      const validatedData = loginSchema.parse(req.body);

      // Login user
      const result = await this.authService.login(validatedData);

      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      logger.error('Login controller error:', error);

      if (error instanceof Error) {
        if (error.message === 'Invalid credentials') {
          return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: error.message,
          });
        }
      }

      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to login',
      });
    }
  };

  getProfile = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const profile = await this.authService.getProfile(req.user.userId);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      logger.error('Get profile controller error:', error);

      if (error instanceof Error) {
        if (error.message === 'User not found') {
          return res.status(404).json({
            success: false,
            error: 'Not Found',
            message: error.message,
          });
        }
      }

      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get profile',
      });
    }
  };

  saveArticle = async (req: Request, res: Response) => {
    try {
      const { articleId } = req.params;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const user = await this.authService.saveArticle(req.user.userId, articleId);

      res.json({
        success: true,
        message: 'Article saved successfully',
        data: user,
      });
    } catch (error) {
      logger.error('Save article controller error:', error);

      if (error instanceof Error) {
        if (error.message === 'User not found') {
          return res.status(404).json({
            success: false,
            error: 'Not Found',
            message: error.message,
          });
        }
      }

      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to save article',
      });
    }
  };

  addToHistory = async (req: Request, res: Response) => {
    try {
      const { articleId } = req.params;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const user = await this.authService.addToHistory(req.user.userId, articleId);

      res.json({
        success: true,
        message: 'Article added to history',
        data: user,
      });
    } catch (error) {
      logger.error('Add to history controller error:', error);

      if (error instanceof Error) {
        if (error.message === 'User not found') {
          return res.status(404).json({
            success: false,
            error: 'Not Found',
            message: error.message,
          });
        }
      }

      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to add to history',
      });
    }
  };
}