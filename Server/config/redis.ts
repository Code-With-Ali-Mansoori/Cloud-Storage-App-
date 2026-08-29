import { createClient } from "redis";

const redisClient: any = createClient({
  url: process.env.REDIS_URI,
  socket: {
    connectTimeout: 10000, // 10s timeout
    reconnectStrategy: (retries: number) => {
      if (retries > 5) {
        console.error("Redis reconnect failed after 5 retries");
        return new Error("Redis reconnet failed");
      }
      console.log(`🔁 Redis retry #${retries}`);
      return 1000 * retries;
    },
  },
});

async function ensureUserSessionIndex() {
  try {
    await redisClient.ft.create(
      "userIdIdx",
      {
        "$.userId": { type: "TAG", AS: "userId" },
      },
      {
        ON: "JSON",
        PREFIX: "session:",
      }
    );
    console.log("✅ Redis search index userIdIdx created");
  } catch (err: any) {
    const message = err?.message || String(err);
    if (!message.toLowerCase().includes("already exists")) {
      console.error("Failed to create Redis search index:", message);
    }
  }
}

// Handle connection errors gracefully
redisClient.on("error", (err: any) => {
  console.error("❗ Redis Client Error:", err.message);
  // Do not exit here; let reconnectStrategy try to recover
});

// Initial connection
try {
  await redisClient.connect();
  console.log("✅ Redis Connected");
  await ensureUserSessionIndex();
} catch (err: any) {
  console.error("Initial Redis connection failed:", err.message);
}

// Custom function to delete multiple sessions by userId
redisClient.deleteManySessions = async function (userId: string): Promise<void> {
  try {
    const userSessions = await this.ft.search(
      "userIdIdx",
      `@userId:{${userId}}`,
      { RETURN: [] }
    );

    for (const { id } of userSessions.documents) {
      await this.del(id);
    }
  } catch (err: any) {
    console.error("Error deleting sessions for user:", err.message);
  }
};

// Custom function to count redis user Sessions by userId
redisClient.countUserSessions = async function (userId: string): Promise<number | undefined> {
  try {
    const result = await this.ft.search("userIdIdx", `@userId:{${userId}}`, {
      LIMIT: { from: 0, size: 0 },
    });
    return result.total;
  } catch (error: any) {
    console.error("Error counting sessions of user:", error.message);
  }
};

export default redisClient;
