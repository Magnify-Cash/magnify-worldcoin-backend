import { getConnection, closeConnection } from "../init";
import { Env } from "../../config/interface";

export async function getAnnouncements(env: Env) {
    let connection = null;
    try {
        connection = await getConnection(env);
        const result = await connection.query(
            `SELECT * FROM announcements`
        );
        return result[0];
    } catch (err) {
        console.error('Error getting announcements:', err);
        throw err;
    } finally {
        if (connection) {
            await closeConnection(connection);
        }
    }
}