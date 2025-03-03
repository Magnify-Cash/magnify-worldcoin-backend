import { Sequelize } from "sequelize";
// Add explicit static import for pg
import pg from 'pg';

interface Env {
    DATABASE_URL: string;
    NODE_ENV: string;
}

let sequelizeInstance: Sequelize | null = null;

/**
 * Initialize and get the database connection
 * @returns Sequelize instance
 */
export function getConnection(env: Env): Sequelize {
  if (!sequelizeInstance) {
    // Explicitly set pg for Sequelize
    sequelizeInstance = new Sequelize(env.DATABASE_URL, {
      dialect: 'postgres',
      dialectModule: pg, // Use the statically imported pg module
      dialectOptions: {
        ssl: false
      },
      logging: process.env.NODE_ENV !== 'production'
    });
  }
  return sequelizeInstance;
}


// Test the connection
// export const testConnection = async (): Promise<void> => {
//   try {
//     const env = {
//       DATABASE_URL: process.env.DATABASE_URL || '',
//       NODE_ENV: process.env.NODE_ENV || 'development'
//     };
//     const sequelize = getConnection(env);
//     await sequelize.authenticate();
//     console.log('Successfully connected to PostgreSQL database');
//   } catch (error) {
//     console.error('Error connecting to the database:', error);
//   }
// };

export default getConnection;
