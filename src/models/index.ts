// Import the models into the local scope
import { User } from './User';
import { Category } from './Category';
import { Article } from './Article';
import { Source } from './Source';
import { Ticker } from './Ticker';
import { JobLog } from './JobLog';

// Re-export them for convenience
export { User, Category, Article, Source, Ticker, JobLog };

// Now, the types are available for use in the interface
export interface IModels {
  User: typeof User;
  Category: typeof Category;
  Article: typeof Article;
  Source: typeof Source;
  Ticker: typeof Ticker;
  JobLog: typeof JobLog;
}