# ArtShare Backend API

Express.js backend for ArtShare platform with Azure Cosmos DB and Blob Storage integration.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Fill in your Azure credentials in `.env`:
- `COSMOS_DB_ENDPOINT` - Azure Cosmos DB endpoint
- `COSMOS_DB_KEY` - Azure Cosmos DB key
- `COSMOS_DB_NAME` - Database name (default: CloudPixDB)
- `AZURE_COSMOS_CONNECTION_STRING` - Azure Cosmos DB connection string (optional)
- `AZURE_BLOB_CONNECTION_STRING` - Azure Blob Storage connection string
- `BLOB_CONTAINER_NAME` - Container name (default: cloudpix-files)
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRY` - JWT token expiry (default: 24h)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `APPLICATIONINSIGHTS_CONNECTION_STRING` - Application Insights connection string (optional)
- `APPLICATION_INSIGHT_API_KEY` - Application Insights API key (optional)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5173)

## Run

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Media
- `POST /api/media/request-upload` - Get SAS URL for direct upload
- `POST /api/media` - Create media item after upload
- `GET /api/media` - List media (feed or by artistId)
- `GET /api/media/:id?artistId=xxx` - Get single media item
- `PUT /api/media/:id` - Update media metadata
- `DELETE /api/media/:id` - Soft delete media

### Users
- `GET /api/users/:id` - Get user profile

### Discovery
- `GET /api/discovery/search?q=query` - Search media and users
- `GET /api/discovery/trending` - Get trending tags and media

### Moderation
- `POST /api/moderation/flag` - Flag content for review
- `GET /api/moderation/pending` - Get pending flags

### Portfolios
- `GET /api/portfolios/:artistId` - Get portfolio
- `PUT /api/portfolios/:artistId` - Update portfolio

## Database Schema

### Users Container
- Partition Key: `id`
- Fields: id, name, handle, email, passwordHash, artistType, contact, socialLinks, createdAt, updatedAt

### MediaItems Container
- Partition Key: `artistId`
- Fields: id, artistId, title, description, blobUri, thumb, type, duration, tags, visibility, status, author, uploadedAt, createdAt, updatedAt

### Portfolios Container
- Partition Key: `artistId`
- Fields: artistId, collectionIds, visibility, featuredItems, createdAt, updatedAt

### ModerationFlags Container
- Partition Key: `mediaId`
- Fields: id, mediaId, reporterId, reason, status, createdAt, reviewedAt

