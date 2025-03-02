import { Sequelize } from "sequelize";

interface Env {
    DATABASE_URL: string;
    NODE_ENV: string;
}

//const env: Env = process.env;

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: false
    },
});

// Test the connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Successfully connected to PostgreSQL database');
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
};

testConnection();

export default sequelize;
