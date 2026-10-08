# 🎓 EduReach — AI-Powered College Intelligence Platform

EduReach is an **AI-powered college intelligence platform** designed to make college information easier to access.

Students can ask questions about **admissions, courses, fees, departments, faculty, campus facilities, placements, events, and other college information** through an intelligent AI chatbot.

The platform uses **Retrieval-Augmented Generation (RAG)** to retrieve relevant information from the college knowledge base before generating an answer.

---

## ✨ Features

### 🤖 AI College Chatbot

Ask questions about the college in natural language.

Example:

> "What courses are available in AI & Data Science?"

> "Who are the faculty members in CSE?"

> "What is the fee structure?"

The chatbot retrieves relevant college information before generating the response.

### 🧠 RAG-Based Knowledge System

EduReach uses a RAG pipeline:

```text
User Question
      ↓
Query Embedding
      ↓
MongoDB Atlas Vector Search
      ↓
Relevant Knowledge Chunks
      ↓
LLM
      ↓
AI Response
```

This helps the chatbot answer college-specific questions using the available knowledge base instead of relying only on the LLM's general knowledge.

### 🗄️ MongoDB Atlas Vector Search

College information is divided into smaller chunks and converted into vector embeddings.

These embeddings are stored in MongoDB Atlas and searched semantically when a user asks a question.

### 🦙 Local AI with Ollama

EduReach can run the AI system locally using Ollama.

Current models:

* **Llama 3.1 8B** — response generation
* **Nomic Embed Text** — document and query embeddings

This allows the AI backend to work without depending on Gemini API quotas.

### 📚 College Knowledge Base

The knowledge base can contain information such as:

* Admissions
* Courses
* Departments
* Fees
* Faculty
* Placements
* Campus facilities
* Hostels
* Scholarships
* Events
* Student activities
* Contact information

### 📞 AI Counselor

EduReach is designed to go beyond a normal chatbot by providing an AI counselor experience where students can get assistance before contacting the college directly.

---

# 🏗️ System Architecture

```text
                         EDUReach
                            │
                            ▼
                    ┌───────────────┐
                    │  React Client │
                    └───────┬───────┘
                            │
                            │ HTTP
                            ▼
                  ┌───────────────────┐
                  │ Node.js + Express │
                  └─────────┬─────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ LangChain RAG │
                    └───────┬───────┘
                            │
                 ┌──────────┴──────────┐
                 │                     │
                 ▼                     ▼
        ┌─────────────────┐   ┌─────────────────┐
        │ Nomic Embedding │   │  Llama 3.1 8B  │
        │     Ollama      │   │     Ollama      │
        └────────┬────────┘   └────────┬────────┘
                 │                     │
                 ▼                     │
        ┌─────────────────────┐        │
        │ MongoDB Atlas       │◄───────┘
        │ Vector Search       │
        └─────────────────────┘
```

---

# 🔄 RAG Workflow

### 1. Knowledge Base

College information is stored in:

```text
knowledge-base/
└── edureach-knowledge.txt
```

### 2. Document Splitting

The document is divided into smaller chunks.

```text
College Document
       ↓
Text Splitter
       ↓
Multiple Chunks
```

Current configuration:

```text
Chunk Size: 1000
Chunk Overlap: 200
```

### 3. Embedding Generation

Each chunk is converted into a vector using:

```text
nomic-embed-text:latest
```

The embedding model generates **768-dimensional vectors**.

### 4. Vector Storage

The vectors are stored in:

```text
MongoDB Atlas
       ↓
edureach_db
       ↓
knowledge_docs
```

### 5. User Query

When a student asks a question, the question is converted into an embedding.

MongoDB Atlas Vector Search finds the most relevant chunks.

### 6. AI Generation

The retrieved information is provided to:

```text
llama3.1:8b
```

The model generates the final answer.

---

# 🛠️ Tech Stack

| Layer         | Technology                  |
| ------------- | --------------------------- |
| Frontend      | React / TypeScript          |
| Backend       | Node.js                     |
| API           | Express.js                  |
| AI Framework  | LangChain                   |
| LLM           | Llama 3.1 8B                |
| Embeddings    | Nomic Embed Text            |
| Local AI      | Ollama                      |
| Database      | MongoDB Atlas               |
| Vector Search | MongoDB Atlas Vector Search |
| Validation    | Zod                         |
| Language      | TypeScript                  |

---

# 📁 Project Structure

```text
edureach-platform/
│
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── server.ts
│   │   └── ...
│   │
│   ├── knowledge-base/
│   │   └── edureach-knowledge.txt
│   │
│   ├── package.json
│   └── .env
│
├── README.md
└── package.json
```

---

# ⚙️ Prerequisites

Install the following:

* Node.js
* npm
* MongoDB Atlas account
* Ollama

Ollama provides a local API that applications can use to communicate with locally running models.

---

# 🦙 Ollama Setup

Install Ollama and download the required models.

### Pull Llama 3.1

```bash
ollama pull llama3.1:8b
```

### Pull Nomic Embeddings

```bash
ollama pull nomic-embed-text
```

### Verify

```bash
ollama list
```

You should see:

```text
llama3.1:8b
nomic-embed-text:latest
```

Test the LLM:

```bash
ollama run llama3.1:8b
```

---

# 📦 Backend Installation

Navigate to the server directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Install Ollama LangChain integration:

```bash
npm install @langchain/ollama
```

---

# 🔐 Environment Variables

Create:

```text
.env
```

Add:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

Example:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
PORT=5000
```

> Never commit `.env` or expose your MongoDB credentials publicly.

---

# 🗄️ MongoDB Configuration

Create the database:

```text
edureach_db
```

Create the collection:

```text
knowledge_docs
```

The application stores the knowledge chunks and embeddings inside this collection.

### Vector Search Index

Create an Atlas Vector Search index named:

```text
edureach_vector_index
```

Use:

```text
Path: embedding
Type: vector
Dimensions: 768
Similarity: cosine
```

The **768 dimensions are required because the project uses `nomic-embed-text`**.

---

# ▶️ Run the Backend

Start the development server:

```bash
npm run dev
```

Expected output:

```text
MongoDB Connected
Ollama embedding working - dimensions: 768
Knowledge base initialization completed
EduReach Server is running!
URL: http://localhost:5000
```

---

# 💬 Example Questions

Users can ask:

```text
What courses does AIHT offer?
```

```text
What is the AI & Data Science department?
```

```text
Who are the faculty members in CSE?
```

```text
What are the admission details?
```

```text
What facilities are available on campus?
```

```text
Tell me about placements.
```

```text
Who is the principal?
```

The chatbot retrieves relevant information from the knowledge base before generating the response.

---

# 🛡️ Anti-Hallucination Approach

EduReach is designed to reduce hallucinations for college-specific questions.

The AI follows this workflow:

```text
Question
   ↓
Retrieve Knowledge
   ↓
Relevant Information Found?
   │
   ├── YES → Generate Answer
   │
   └── NO → Tell User Information
              is unavailable
```

If information is not available, the chatbot responds:

> "I don't have that information right now. Click Talk to Us to speak with a counselor."

This prevents the model from confidently inventing college-specific information.

---

# 🚀 Future Improvements

EduReach can be extended into a complete **AI Digital Campus**.

### Planned Features

* 🎙️ Voice AI College Counselor
* 📞 AI phone calling
* 🧭 AI Campus Navigator
* 🎓 AI Admission Counselor
* 📊 Placement Intelligence
* 📅 Student Personal Assistant
* 📚 AI Study Assistant
* 📝 AI Application Assistant
* 🔎 Advanced semantic search
* 💬 Conversation memory
* 📄 PDF/DOCX knowledge ingestion
* 👨‍💼 Admin knowledge-base management
* 📈 Chat analytics
* 🌐 Multilingual Tamil + English support

---

# 🔮 Vision

EduReach aims to transform a traditional college website into an **AI-powered digital campus**.

Instead of students searching through multiple pages, documents, and notices, they can simply ask:

```text
"Tell me what I need to know."
```

and interact with the college through an intelligent AI assistant.

---

# 🤝 Contributing

Contributions and ideas are welcome.

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature/new-feature
```

3. Make your changes
4. Commit your changes

```bash
git commit -m "Add new feature"
```

5. Push the branch

```bash
git push origin feature/new-feature
```

6. Open a Pull Request

---

# 📄 License

This project is intended for educational and development purposes.

---

## 👨‍💻 Developer

**Sudharsan V**

AI & Data Science Developer

Interested in:

* Artificial Intelligence
* Machine Learning
* Generative AI
* RAG Systems
* AI Agents
* Full-Stack Development

---

⭐ If you find EduReach useful, consider giving the repository a star!
