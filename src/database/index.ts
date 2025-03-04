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
 * @param env Environment variables
 * @returns Sequelize instance
 */
export async function getConnection(env: Env): Promise<Sequelize> {
  if (!sequelizeInstance) {
    // Explicitly set pg for Sequelize
    sequelizeInstance = new Sequelize(env.DATABASE_URL, {
      dialect: 'postgres',
      dialectModule: pg, // Use the statically imported pg module
      dialectOptions: {
        ssl: false
      },
    });
    
    // Authenticate the connection when it's first created
    try {
      await sequelizeInstance.authenticate();
      console.log('Database connection has been established successfully.');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      // Reset the instance so that future calls can try to reconnect
      sequelizeInstance = null;
      throw error;
    }
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
