import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e7, // Aumenta o limite para 10MB (ajuste conforme necessário)
});
const userSockets = new Map();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir arquivos estáticos da pasta public
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  console.log("Novo socket conectado:", socket.id);

  socket.on("new-user", (nome, openTabs) => {
    if (!nome || typeof nome !== "string" || nome.trim() === "") {
      socket.emit("error", { message: "Nome inválido" });
      return;
    }

    if (openTabs === 1) {
      if (userSockets.has(nome) && userSockets.get(nome).size > 0) {
        socket.emit("username-taken", { message: "Nome de usuário em uso" });
        return;
      }
    }

    const isFirstConnection =
      !userSockets.has(nome) || userSockets.get(nome).size === 0;
    if (!userSockets.has(nome)) {
      userSockets.set(nome, new Set());
    }
    userSockets.get(nome).add(socket.id);
    if (isFirstConnection) {
      for (const [user, sockets] of userSockets.entries()) {
        if (user !== nome) {
          sockets.forEach((socketId) => {
            io.to(socketId).emit("user-connected", nome);
          });
        }
      }
    }
    io.emit("online-users", userSockets.size, [...userSockets.keys()]);
  });

  socket.on("chat message", (msg) => {
    const nome = Array.from(userSockets.keys()).find((user) =>
      userSockets.get(user).has(socket.id)
    );
    if (!nome) {
      socket.emit("error", { message: "Usuário não identificado" });
      return;
    }
    if (!msg || !msg.type || !msg.data) {
      socket.emit("error", { message: "Mensagem inválida" });
      return;
    }

    // Validação para imagens e vídeos
    if (msg.type === "image" || msg.type === "video") {
      const MAX_DATAURL_SIZE = 15 * 1024 * 1024; // 15MB para dataURL
      if (msg.data.length > MAX_DATAURL_SIZE) {
        console.error(
          `Arquivo muito grande de ${nome}: ${msg.data.length} bytes`
        );
        socket.emit("error", {
          message: `${
            msg.type === "image" ? "Imagem" : "Vídeo"
          } muito grande. Tamanho máximo: 10MB`,
        });
        return;
      }
    }

    // Envia a todos, incluindo o remetente
    socket.broadcast.emit("chat message", { nome, msg });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    let disconnectedUser = null;

    for (const [user, sockets] of userSockets.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          disconnectedUser = user;
          sockets.forEach((socketId) => {
            io.to(socketId).emit("clear-localstorage");
          });
          userSockets.delete(user);
        }
        break;
      }
    }

    if (disconnectedUser) {
      io.emit("user-disconnected", disconnectedUser);
    }

    io.emit("online-users", userSockets.size, [...userSockets.keys()]);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
