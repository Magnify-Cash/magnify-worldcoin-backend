CREATE TABLE mag_user_roles (
    user_id UUID REFERENCES mag_users(user_id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES mag_roles(role_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);