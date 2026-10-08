import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";
import { createAgent, tool } from "langchain";

import {
  ChatOllama,
  OllamaEmbeddings,
} from "@langchain/ollama";

import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { z } from "zod";

// ============================================================
// PATH SETUP
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// MONGODB CLIENT
// ============================================================

let mongoClient: MongoClient | null = null;

const getMongoClient = async (): Promise<MongoClient> => {
  if (!mongoClient) {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is not set in .env");
    }

    mongoClient = new MongoClient(mongoUri);

    await mongoClient.connect();

    console.log("MongoDB Connected");
  }

  return mongoClient;
};

// ============================================================
// OLLAMA EMBEDDINGS
// Model: nomic-embed-text:latest
// ============================================================

const getEmbeddings = () => {
  return new OllamaEmbeddings({
    model: "nomic-embed-text:latest",
    baseUrl: "http://localhost:11434",
  });
};

// ============================================================
// VECTOR STORE
// ============================================================

const getVectorStore = async () => {
  const client = await getMongoClient();

  const collection = client
    .db("edureach_db")
    .collection("knowledge_docs");

  return new MongoDBAtlasVectorSearch(getEmbeddings(), {
    collection: collection as any,

    // Your Atlas Vector Search index name
    indexName: "edureach_vector_index",

    // Text field
    textKey: "text",

    // Embedding field
    embeddingKey: "embedding",
  });
};

// ============================================================
// INITIALIZE KNOWLEDGE BASE
// ============================================================

export const initializeKnowledgeBase = async (): Promise<void> => {
  const client = await getMongoClient();

  const collection = client
    .db("edureach_db")
    .collection("knowledge_docs");

  // ----------------------------------------------------------
  // IMPORTANT:
  // Delete old Gemini embeddings.
  //
  // Gemini embedding = 3072 dimensions
  // Nomic embedding = 768 dimensions
  //
  // Therefore old vectors cannot be reused.
  // ----------------------------------------------------------

  const existingCount = await collection.countDocuments();

  if (existingCount > 0) {
    console.log(
      `Found ${existingCount} old chunks. Deleting them for Nomic re-indexing...`
    );

    await collection.deleteMany({});
  }

  console.log("Starting Ollama knowledge-base indexing...");

  // ----------------------------------------------------------
  // Test Ollama embedding
  // ----------------------------------------------------------

  const embeddings = getEmbeddings();

  try {
    const testResult = await embeddings.embedQuery("test");

    console.log(
      `Ollama embedding working - dimensions: ${testResult.length}`
    );

    console.log("Embedding model: nomic-embed-text:latest");
  } catch (error: any) {
    console.error("Ollama embedding test failed!");

    console.error(
      "Error:",
      error?.message || error
    );

    console.error(
      "Make sure Ollama is running and nomic-embed-text is installed."
    );

    throw error;
  }

  // ----------------------------------------------------------
  // LOAD KNOWLEDGE BASE
  // ----------------------------------------------------------

  const filePath = path.join(
    __dirname,
    "../../knowledge-base/edureach-knowledge.txt"
  );

  console.log("Loading knowledge base:");
  console.log(filePath);

  const loader = new TextLoader(filePath);

  const docs = await loader.load();

  if (docs.length === 0) {
    throw new Error(
      "No documents found in knowledge base file"
    );
  }

  const totalCharacters = docs.reduce(
    (sum, doc) => sum + doc.pageContent.length,
    0
  );

  console.log(
    `Loaded ${totalCharacters} characters`
  );

  // ----------------------------------------------------------
  // SPLIT DOCUMENTS
  // ----------------------------------------------------------

  const splitter =
    new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

  const allSplits =
    await splitter.splitDocuments(docs);

  console.log(
    `Split knowledge base into ${allSplits.length} chunks`
  );

  // ----------------------------------------------------------
  // VECTOR STORE
  // ----------------------------------------------------------

  const vectorStore =
    new MongoDBAtlasVectorSearch(
      embeddings,
      {
        collection: collection as any,

        indexName:
          "edureach_vector_index",

        textKey: "text",

        embeddingKey: "embedding",
      }
    );

  // ----------------------------------------------------------
  // CREATE EMBEDDINGS + STORE IN MONGODB
  // ----------------------------------------------------------

  console.log(
    "Creating Nomic embeddings..."
  );

  await vectorStore.addDocuments(
    allSplits
  );

  console.log(
    "Documents successfully stored in MongoDB."
  );

  // ----------------------------------------------------------
  // VERIFY
  // ----------------------------------------------------------

  const verifyDoc =
    await collection.findOne({
      embedding: {
        $exists: true,
        $not: {
          $size: 0,
        },
      },
    });

  if (
    verifyDoc &&
    Array.isArray(verifyDoc.embedding) &&
    verifyDoc.embedding.length > 0
  ) {
    console.log(
      `${allSplits.length} chunks stored`
    );

    console.log(
      `Embedding dimensions: ${verifyDoc.embedding.length}`
    );

    console.log(
      "IMPORTANT: Atlas Vector Search must use the same dimensions."
    );
  } else {
    await collection.deleteMany({});

    throw new Error(
      "Embeddings are empty! Ollama did not return vectors."
    );
  }

  console.log(
    "Knowledge base initialization completed."
  );
};

// ============================================================
// RETRIEVAL TOOL
// ============================================================

const createRetrieveTool = (
  vectorStore: MongoDBAtlasVectorSearch
) => {

  return tool(
    async ({ query }: { query: string }) => {

      console.log(
        `Searching knowledge base: ${query}`
      );

      const retrievedDocs =
        await vectorStore.similaritySearch(
          query,
          3
        );

      if (
        !retrievedDocs ||
        retrievedDocs.length === 0
      ) {
        return "No relevant information found in the knowledge base.";
      }

      console.log(
        `Retrieved ${retrievedDocs.length} documents`
      );

      return retrievedDocs
        .map(
          (doc, index) =>
            `Source ${index + 1}:
${doc.metadata?.source || "Knowledge Base"}

Content:
${doc.pageContent}`
        )
        .join("\n\n");
    },

    {
      name: "retrieve",

      description:
        "Retrieve information from the AIHT College knowledge base. " +
        "Use this tool for questions about courses, fees, admissions, " +
        "faculty, campus, placements, facilities, departments, events, " +
        "students and other college-related information.",

      schema: z.object({
        query: z.string(),
      }),
    }
  );
};

// ============================================================
// RAG RESPONSE
// ============================================================

export const getRAGResponse = async (
  question: string
): Promise<string> => {

  try {

    // --------------------------------------------------------
    // GET VECTOR STORE
    // --------------------------------------------------------

    const vectorStore =
      await getVectorStore();

    // --------------------------------------------------------
    // CREATE RETRIEVAL TOOL
    // --------------------------------------------------------

    const retrieve =
      createRetrieveTool(vectorStore);

    // --------------------------------------------------------
    // LOCAL OLLAMA LLM
    // --------------------------------------------------------

    const model = new ChatOllama({

      model: "llama3.1:8b",

      baseUrl:
        "http://localhost:11434",

      temperature: 0.7,
    });

    // --------------------------------------------------------
    // CREATE AGENT
    // --------------------------------------------------------

    const agent = createAgent({

      model,

      tools: [
        retrieve
      ],

      systemPrompt:
        `
You are AIHT Bot, a helpful AI counselor
for Anand Institute of Higher Technology (AIHT), Chennai.

IMPORTANT RULES:

1. ALWAYS use the retrieve tool before answering
   any question about AIHT.

2. Use ONLY the information returned by the
   retrieve tool for college-specific questions.

3. Do not invent college information.

4. If the required information is not available
   in the knowledge base, say:

"I don't have that information right now.
Click Talk to Us to speak with a counselor."

5. Keep answers concise and easy to understand.

6. Be friendly and professional.

7. If the user asks a general question that is
   not related to AIHT, you may answer normally.

8. For AIHT-specific questions, prioritize the
   knowledge base information.
        `,
    });

    // --------------------------------------------------------
    // ASK AGENT
    // --------------------------------------------------------

    console.log(
      `User question: ${question}`
    );

    const result =
      await agent.invoke({
        messages: [
          {
            role: "user",
            content: question,
          },
        ],
      });

    // --------------------------------------------------------
    // GET LAST MESSAGE
    // --------------------------------------------------------

    const messages =
      result.messages;

    const lastMessage =
      messages[messages.length - 1];

    if (!lastMessage) {
      return "I couldn't generate a response. Please try again.";
    }

    // --------------------------------------------------------
    // RETURN RESPONSE
    // --------------------------------------------------------

    if (
      typeof lastMessage.content ===
      "string"
    ) {
      return lastMessage.content;
    }

    return JSON.stringify(
      lastMessage.content
    );

  } catch (error: any) {

    console.error(
      "RAG Agent Error:",
      error
    );

    console.error(
      "Error message:",
      error?.message
    );

    return (
      "I'm having trouble right now. " +
      "Please try again or click 'Talk to Us'."
    );
  }
};