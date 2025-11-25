# YC Search Backend

A backend service for searching Y Combinator companies using vector embeddings and semantic search powered by Pinecone and OpenAI.

## Features

- Semantic search for Y Combinator companies
- Vector-based similarity search using Pinecone
- OpenAI embeddings for intelligent query understanding
- Batch import of YC companies from public API

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- OpenAI API key
- Pinecone API key and index named `yc-companies`

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/Nikita06211/yc-search-backend.git
cd yc-search-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
PORT=5000
OPENAI_API_KEY=your_openai_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
```

**Note:** Make sure you have a Pinecone index named `yc-companies` created in your Pinecone project.

### 4. Run the development server

```bash
npm run dev
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

### 5. Build for production

```bash
npm run build
```

The compiled JavaScript files will be in the `dist` directory.

## API Endpoints

### Base URL

```
http://localhost:5000/api
```

---

### 1. Import YC Companies

Imports all Y Combinator companies from the public API, generates embeddings, and stores them in Pinecone.

**Endpoint:** `GET /api/company/import-yc`

**Request:**
```http
GET /api/company/import-yc
```

**Response Format:**

**Success Response:**
```json
{
  "success": true,
  "count": 1234
}
```

**Response Fields:**
- `success` (boolean): Indicates if the import was successful
- `count` (number): Total number of companies imported

**Example:**
```bash
curl http://localhost:5000/api/company/import-yc
```

**Note:** This endpoint processes companies in batches of 50 and may take several minutes to complete depending on the total number of companies.

---

### 2. Search Companies

Performs semantic search on Y Combinator companies using vector similarity.

**Endpoint:** `POST /api/search`

**Request:**
```http
POST /api/search
Content-Type: application/json
```

**Request Body:**
```json
{
  "query": "AI-powered healthcare solutions",
  "page": 1,
  "limit": 10
}
```

**Request Fields:**
- `query` (string, required): Search query text
- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Number of results per page (default: 10)

**Response Format:**

**Success Response:**
```json
{
  "success": true,
  "page": 1,
  "limit": 10,
  "total": 45,
  "matches": [
    {
      "score": 0.8923,
      "name": "Company Name",
      "description": "Company description...",
      "website": "https://example.com"
    },
    {
      "score": 0.8756,
      "name": "Another Company",
      "description": "Another description...",
      "website": "https://another.com"
    }
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

**Response Fields:**
- `success` (boolean): Indicates if the search was successful
- `page` (number): Current page number
- `limit` (number): Number of results per page
- `total` (number): Total number of matches found
- `matches` (array): Array of matching companies
  - `score` (number): Similarity score (0-1, higher is better)
  - `name` (string): Company name
  - `description` (string): Company description
  - `website` (string): Company website URL
- `error` (string, error only): Error message if search failed

**Example:**
```bash
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "artificial intelligence healthcare",
    "page": 1,
    "limit": 5
  }'
```

---

## Project Structure

```
yc-search-backend/
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── server.ts              # Server entry point
│   ├── controllers/
│   │   └── company.controller.ts
│   ├── routes/
│   │   ├── company.routes.ts
│   │   └── search.routes.ts
│   └── services/
│       ├── embedding.service.ts
│       ├── pinecone.service.ts
│       └── search.service.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Technologies Used

- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **Pinecone** - Vector database for similarity search
- **OpenAI** - Embedding generation
- **Axios** - HTTP client
- **CORS** - Cross-origin resource sharing
