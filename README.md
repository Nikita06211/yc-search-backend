# YC Search Backend

A backend service for searching Y Combinator companies using vector embeddings and semantic search powered by Pinecone and OpenAI.

## Features

- 🧠 **AI-Powered Query Interpretation** - Uses GPT tool calling to understand semantic meaning of queries (e.g., "recently funded startups" → understands intent, not just keywords)
- 🔍 **Semantic Search** - Vector-based similarity search using Pinecone
- 🎯 **Intelligent Filtering** - Automatically extracts filters (batch, industry) from natural language queries
- 📊 **Vector Embeddings** - OpenAI embeddings for intelligent query understanding
- 📦 **Batch Import** - Import YC companies from public API with automatic embedding generation

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

Performs intelligent semantic search on Y Combinator companies using AI-powered query interpretation and vector similarity.

**How it works:**
1. **Query Interpretation** - GPT analyzes your natural language query to understand semantic intent
2. **Query Cleaning** - Removes temporal/conditional words and focuses on core meaning
3. **Filter Extraction** - Automatically extracts metadata filters (batch, industry) when mentioned
4. **Vector Search** - Uses cleaned query for embedding and similarity search
5. **Filtered Results** - Applies extracted filters to Pinecone query for precise results

**Endpoint:** `POST /api/search`

**Request:**
```http
POST /api/search
Content-Type: application/json
```

**Request Body:**
```json
{
  "query": "recently funded fintech startups",
  "page": 1,
  "limit": 10
}
```

**Request Fields:**
- `query` (string, required): Natural language search query. The AI will interpret semantic meaning.
- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Number of results per page (default: 10)

**Query Examples:**
- `"recently funded fintech startups"` → Interprets as fintech companies (filters by industry)
- `"AI companies from W24 batch"` → Searches for AI companies, filters by batch W24
- `"healthcare startups"` → Searches healthcare domain, filters by industry
- `"YC companies in SaaS"` → Searches SaaS companies, filters by industry

**Response Format:**

**Success Response:**
```json
{
  "success": true,
  "page": 1,
  "limit": 10,
  "total": 45,
  "interpretedQuery": "fintech startups",
  "filters": {
    "industry": "fintech"
  },
  "matches": [
    {
      "score": 0.8923,
      "name": "Company Name",
      "description": "Company description...",
      "website": "https://example.com",
      "batch": "W24",
      "industry": "fintech"
    },
    {
      "score": 0.8756,
      "name": "Another Company",
      "description": "Another description...",
      "website": "https://another.com",
      "batch": "S23",
      "industry": "fintech"
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
- `interpretedQuery` (string): The cleaned query used for vector search (for transparency)
- `filters` (object | null): Extracted metadata filters applied to the search
- `matches` (array): Array of matching companies
  - `score` (number): Similarity score (0-1, higher is better)
  - `name` (string): Company name
  - `description` (string): Company description
  - `website` (string): Company website URL
  - `batch` (string): YC batch identifier (e.g., "W24", "S23")
  - `industry` (string): Company industry
- `error` (string, error only): Error message if search failed

**Example Requests:**

```bash
# Search for fintech startups
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "recently funded fintech startups",
    "page": 1,
    "limit": 5
  }'

# Search for AI companies from specific batch
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "AI companies from W24 batch",
    "page": 1,
    "limit": 10
  }'

# General semantic search
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "healthcare AI solutions",
    "page": 1,
    "limit": 10
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
│       ├── query-interpretation.service.ts  # AI query interpretation with tool calling
│       └── search.service.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Technologies Used

- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **Pinecone** - Vector database for similarity search
- **OpenAI GPT-4o-mini** - AI-powered query interpretation using tool calling
- **OpenAI Embeddings** - Vector embedding generation (text-embedding-3-small)
- **Axios** - HTTP client
- **CORS** - Cross-origin resource sharing

## How AI Query Interpretation Works

The search endpoint uses **GPT tool calling** to convert natural language queries into structured search instructions. This solves the problem of pure vector similarity matching keywords instead of understanding semantic meaning.

### Example Transformation

**User Query:** `"recently funded fintech startups"`

**Without Tool Calling (old behavior):**
- Embeds: `"recently funded fintech startups"`
- Matches companies whose descriptions contain these words
- ❌ Returns irrelevant results

**With Tool Calling (new behavior):**
- GPT interprets: `{ query: "fintech startups", filters: { industry: "fintech" } }`
- Embeds: `"fintech startups"` (cleaned query)
- Applies filter: `industry = "fintech"`
- ✅ Returns semantically relevant fintech companies

### Supported Filter Fields

- **batch** - YC batch identifier (e.g., "W24", "S23")
- **industry** - Company industry (e.g., "Fintech", "AI", "Healthcare")

The AI automatically extracts these filters from natural language queries when mentioned.
