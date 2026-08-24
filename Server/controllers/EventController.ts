import { Request, Response, NextFunction } from "express";

// using in-memory storage
let clients: Array<{ id: number; userId: string; res: Response }> = [];

export const eventController = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders(); // send the header immediately

  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).end("Missing userId");
    return;
  }

  const clientId = Date.now(); // for uniqueness between different sessions
  const newClient = { id: clientId, userId, res };

  clients.push(newClient);
  console.log(
    `User ${userId} - [${clientId}] connected via SSE. Total clients: ${clients.length}`
  );

  req.on("close", () => {
    clients = clients.filter(c => c.id !== clientId);
    console.log(
      `User ${userId} - [${clientId}] disconnected. Total clients: ${clients.length}`
    );
  });
};

// helper function for sending event to clients
export const sendEventToUser = (userId: string, data: any): void => {
  clients.forEach((client) => {
    if (client.userId === userId) {
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  });
};

