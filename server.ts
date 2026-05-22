import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";

async function startServer() {
  const app = express();
  const PORT = 3000;

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Game State
  const players: Record<string, { id: string, position: [number, number, number], rotation: number, color: string, carModel?: string, customization?: any }> = {};

  io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);
    
    // Add new player
    players[socket.id] = {
      id: socket.id,
      position: [0, 0, 0],
      rotation: 0,
      color: `hsl(${Math.random() * 360}, 80%, 50%)`,
      carModel: 'default',
      customization: undefined
    };
    
    // Send current players to the new player
    socket.emit("currentPlayers", players);
    
    // Broadcast to everyone else
    socket.broadcast.emit("playerJoined", players[socket.id]);

    socket.on("updateLocation", (data: { position: [number, number, number], rotation: number, carModel?: string, customization?: any }) => {
      if (players[socket.id]) {
        players[socket.id].position = data.position;
        players[socket.id].rotation = data.rotation;
        if (data.carModel) players[socket.id].carModel = data.carModel;
        if (data.customization) players[socket.id].customization = data.customization;
        
        socket.broadcast.emit("playerMoved", {
          id: socket.id,
          position: data.position,
          rotation: data.rotation,
          carModel: players[socket.id].carModel,
          customization: players[socket.id].customization
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("Player disconnected:", socket.id);
      delete players[socket.id];
      io.emit("playerLeft", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
