# Environment Variables for Backend Deployment

## Required Environment Variables for Render

### Database Configuration
```
DB_USERNAME=florism_db_user
DB_PASSWORD=kZ2vDOaXY9OK8rOw0KXVQy7k3Eel6iNp
```

### JWT Configuration
```
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRATION=86400000
```

### CORS Configuration
```
CORS_ORIGINS=https://your-frontend-domain.onrender.com
```

### Optional Configuration
```
SHOW_SQL=false
SERVER_PORT=8080
APP_NAME=Medical SWP
CONTACT_PHONE=1900 1234
CONTACT_EMAIL=contact@medicalswp.com
CONTACT_ADDRESS=123 Medical Street, City
```

### Email Configuration (Optional)
```
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=info@florism.site
MAIL_PASSWORD=Sontungmtp!23
```

## Instructions for Render Dashboard

1. Go to your Render service dashboard
2. Navigate to "Environment" tab
3. Add each variable above
4. Click "Save Changes"
5. Service will automatically redeploy 