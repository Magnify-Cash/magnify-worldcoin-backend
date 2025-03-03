import { Sequelize } from "sequelize";

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
    sequelizeInstance = new Sequelize(env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        } 
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
