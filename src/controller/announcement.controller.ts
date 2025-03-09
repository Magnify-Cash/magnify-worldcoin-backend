import { getAnnouncements } from "../database/queries/announcement.queries";
import { apiResponse, errorResponse } from "../utils/apiResponse.utils";
import { Env } from "../config/interface";



export async function getAnnouncementsController(request: Request, env: Env) {
    try {
        const announcements = await getAnnouncements(env);
        return apiResponse(200, 'Announcements fetched successfully', announcements);
    } catch(err) {
        return errorResponse(500, 'Error fetching announcements');
    }
}


// update announcement
/* 
-- title
-- content 
-- type
- action
-- is_highlighted
-  is_new

*/