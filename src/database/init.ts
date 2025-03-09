import { Sequelize } from "sequelize";
import pg from 'pg';
import { Env } from '../config/interface';

export async function getConnection(env: Env): Promise<Sequelize> {
  // Create a new connection for each request
  const sequelize = new Sequelize(env.DATABASE_URL, {
    dialect: 'postgres',
    dialectModule: pg, // Use the statically imported pg module
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true
      },
      // Add statement timeout to prevent hanging queries
      statement_timeout: 10000, // 10 seconds
      query_timeout: 10000, // 10 seconds
      idle_in_transaction_session_timeout: 10000, // 10 seconds
    },
    // Important: Don't pool connections in serverless
    pool: {
      max: 1, // Only use one connection per request
      min: 0,
      idle: 5000, // Release idle connections quickly
      acquire: 10000, // Don't wait too long to acquire a connection
      evict: 1000, // Check for idle connections more frequently
    },
    // Set query timeout
    retry: {
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ],
      max: 2, // Don't retry too many times
    }
  });
  
  try {
    // Set a timeout for the authentication to prevent hanging
    const authPromise = sequelize.authenticate();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Authentication timeout')), 5000);
    });
    
    // Race between authentication and timeout
    await Promise.race([authPromise, timeoutPromise]);
    return sequelize;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    
    // Make sure to close the connection on error
    try {
      await sequelize.close();
    } catch (closeError) {
      console.error('Error closing connection:', closeError);
    }
    
    throw error;
  }
}

// Helper to safely close a connection
export async function closeConnection(connection: Sequelize | null): Promise<void> {
  if (connection) {
    try {
      await connection.close();
    } catch (error) {
      console.error('Error closing connection:', error);
    }
  }
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
