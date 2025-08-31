import { User } from '../models/User';
import { generateToken } from '../utils/jwt';
import { RegisterInput, LoginInput } from '../utils/validation';
import { logger } from '../utils/logger';

export class AuthService {
  async register(input: RegisterInput) {
    try {
      const existingUser = await User.findOne({ email: input.email });
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      const user = new User({
        email: input.email,
        passwordHash: input.password,
        role: input.role,
      });

      await user.save();

      const token = generateToken(user);

      const userResponse = user.toObject();
      delete (userResponse as any).passwordHash;

      return { user: userResponse, token };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(input: LoginInput) {
    try {
      const user = await User.findOne({ email: input.email }).select('+passwordHash');
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await user.comparePassword(input.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      const token = generateToken(user);

      const userResponse = user.toObject();
      delete (userResponse as any).passwordHash;

      return { user: userResponse, token };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async getProfile(userId: string) {
    try {
      const user = await User.findById(userId).populate('savedArticles readingHistory');
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Get profile error:', error);
      throw error;
    }
  }

  async saveArticle(userId: string, articleId: string) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.savedArticles.includes(articleId as any)) {
        user.savedArticles.push(articleId as any);
        await user.save();
      }

      return user;
    } catch (error) {
      logger.error('Save article error:', error);
      throw error;
    }
  }

  async addToHistory(userId: string, articleId: string) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.readingHistory = user.readingHistory.filter(
        (id) => id.toString() !== articleId
      );

      user.readingHistory.unshift(articleId as any);

      if (user.readingHistory.length > 50) {
        user.readingHistory = user.readingHistory.slice(0, 50);
      }

      await user.save();
      return user;
    } catch (error) {
      logger.error('Add to history error:', error);
      throw error;
    }
  }
}
