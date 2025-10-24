// --- Socket.io ---
const socket = io();

// --- Elementos do DOM ---
const messages = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input"); // seu input de mensagem
const onlineCountEl = document.getElementById("online-count");
// --- Inicialização do Nome ---
let nome = localStorage.getItem("chatUser");

let openTabs = localStorage.getItem("openTabs")
  ? parseInt(localStorage.getItem("openTabs"))
  : 0;
openTabs++;
localStorage.setItem("openTabs", openTabs);

window.addEventListener("beforeunload", () => {
  let openTabsNow = parseInt(localStorage.getItem("openTabs") || "1");
  openTabsNow--;
  if (openTabsNow <= 0) {
    // Última aba fechando, remove usuário e contador
    localStorage.removeItem("chatUser");
    localStorage.removeItem("openTabs");
  } else {
    // Apenas decrementa
    localStorage.setItem("openTabs", openTabsNow);
  }
});
window.addEventListener("storage", (e) => {
  if (e.key === "openTabs") {
    openTabs = parseInt(e.newValue || "0");
  }
});
if (!nome) {
  nome = saveName();
} else {
  socket.emit("new-user", nome, openTabs); // Emite new-user se o nome já existe no localStorage
}
socket.on("connect_error", () => {
  showError(
    "Não foi possível conectar ao servidor. Tente novamente mais tarde."
  );
});
socket.on("clear-localstorage", () => {
  localStorage.removeItem("chatUser");
  console.log("localStorage limpo por solicitação do servidor");
});
// --- Eventos socket ---

input.addEventListener("input", () => {
  if (input.value.length > 256) {
    input.value = input.value.slice(0, 256); // corta o excesso
  }
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value.trim() === "") return;
  const msgObj = { type: "text", data: input.value };
  socket.emit("chat message", msgObj);
  addMessage(nome, msgObj, true);
  input.value = "";
});

socket.on("chat message", (data) => {
  if (!data || !data.msg || !data.nome || !data.msg.type || !data.msg.data) {
    console.error("Mensagem inválida recebida:", data);
    return;
  }

  const isMe = data.nome === nome;
  addMessage(data.nome, data.msg, isMe);
});
socket.on("username-taken", (data) => {
  alert(data.message);
  saveName();
});
socket.on("user-connected", (nome) => {
  addSystemMessage(`${nome} entrou no chat`);
});

socket.on("online-users", (quantity, users) => {
  console.log("Quantidade de usuários online:", quantity, users);
  onlineCountEl.textContent = quantity;
  const usuarios = document.querySelector(".view-users-wrapper");
  usuarios.innerHTML = "";
  users.forEach((user) => {
    const p = document.createElement("p");
    p.textContent = user;
    p.className = "view-p-users";
    usuarios.appendChild(p);
  });
});

socket.on("user-disconnected", (nome) => {
  addSystemMessage(`${nome} saiu do chat`);
});

socket.on("error", (error) => {
  alert(`Erro: ${error.message}`);
  saveName();
});
// --- Funções ---

function saveName() {
  const nome = prompt("Digite seu nome:");
  if (!nome || nome.trim() === "") {
    alert("Você precisa digitar um nome!");
    return saveName();
  }
  socket.emit("new-user", nome);
  localStorage.setItem("chatUser", nome);
  return nome;
}

function addMessage(usuario, msg, isMe) {
  const li = document.createElement("li");
  const timestamp = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (msg.type === "text") {
    li.innerHTML = `<strong>${usuario}:</strong> ${twemoji.parse(msg.data, {
      folder: "svg",
      ext: ".svg",
    })} <span class="timestamp">[${timestamp}]</span>`;
  } else if (msg.type === "image") {
    li.innerHTML = `<strong>${usuario}:</strong><br><img src="${msg.data}" alt="imagem" style="max-width:200px; max-height:200px; border-radius:5px;"> <span class="timestamp">[${timestamp}]</span>`;
  } else if (msg.type === "video") {
    li.innerHTML = `<strong>${usuario}:</strong><br><video controls style="max-width:200px; max-height:200px; border-radius:5px;"><source src="${
      msg.data
    }" type="${
      msg.data.includes("data:video/mp4") ? "video/mp4" : "video/webm"
    }"></video> <span class="timestamp">[${timestamp}]</span>`;
  } else {
    li.textContent = `${usuario}: [Mensagem desconhecida] [${timestamp}]`;
  }
  li.className = isMe ? "me" : "other";
  messages.appendChild(li);
  scrollBottom();
}

function addSystemMessage(msg) {
  const li = document.createElement("li");
  li.textContent = msg;
  li.className = "system-message";
  messages.appendChild(li);
  scrollBottom();
}

function scrollBottom() {
  messages.scrollTop = messages.scrollHeight;
}

document.querySelector(".openDiv").addEventListener("click", () => {
  const iconsDivFlex = document.querySelector(".icons-div-flex");
  iconsDivFlex.classList.toggle("active");
  document.querySelector(".openDiv").classList.toggle("open");
});
// --- Funcionalidades fullscreen ---
const btn = document.querySelector("#fullscreen");
btn.addEventListener("click", () => {
  const container = document.querySelector(".chat-container");
  const chat = document.querySelector("#chat");
  chat.classList.toggle("fullscreen");
  container.classList.toggle("fullscreen");
});

// --- Funcionalidades enviar imagem ---
const imageButton = document.getElementById("image-button");
const imageInput = document.getElementById("image-input");
imageButton.addEventListener("click", () => {
  imageInput.click();
});
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;

  // Validação de tipo de arquivo
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (!allowedTypes.includes(file.type)) {
    alert("Tipo de arquivo não suportado! Use apenas JPEG, PNG, GIF ou WebP.");
    imageInput.value = "";
    return;
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    alert(
      `A imagem é muito grande! O tamanho máximo permitido é 10MB.\nTamanho atual: ${(
        file.size /
        (1024 * 1024)
      ).toFixed(2)}MB`
    );
    imageInput.value = ""; // Limpa o input
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.src = reader.result;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Define um tamanho máximo (exemplo: 300px)
      const MAX_WIDTH = 300;
      const MAX_HEIGHT = 300;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Converte para dataURL com qualidade reduzida (0.7)
      const compressedImage = canvas.toDataURL("image/jpeg", 0.7);
      const msgObj = { type: "image", data: compressedImage };
      socket.emit("chat message", msgObj);
      addMessage(nome, msgObj, true);
    };
  };
  reader.readAsDataURL(file);

  imageInput.value = "";
});

// --- Funcionalidades enviar vídeo ---
const videoButton = document.getElementById("video-button");
const videoInput = document.getElementById("video-input");
videoButton.addEventListener("click", () => videoInput.click());
videoInput.addEventListener("change", () => {
  const file = videoInput.files[0];
  if (!file) return;

  // Validação de tipo de arquivo
  const allowedTypes = ["video/mp4", "video/webm"];
  if (!allowedTypes.includes(file.type)) {
    alert("Tipo de arquivo não suportado! Use apenas MP4 ou WebM.");
    videoInput.value = "";
    return;
  }

  // Validação de tamanho: 10MB
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    alert(
      `O vídeo é muito grande! O tamanho máximo permitido é 10MB.\nTamanho atual: ${(
        file.size /
        (1024 * 1024)
      ).toFixed(2)}MB`
    );
    videoInput.value = "";
    return;
  }

  // Mostrar indicador de carregamento
  const loadingMsg = addLoadingMessage(nome);

  const reader = new FileReader();
  reader.onload = () => {
    const msgObj = { type: "video", data: reader.result };
    socket.emit("chat message", msgObj);
    addMessage(nome, msgObj, true);
    loadingMsg.remove();
  };

  reader.onerror = () => {
    loadingMsg.remove();
    alert("Erro ao processar o vídeo. Tente novamente.");
    videoInput.value = "";
  };

  reader.readAsDataURL(file);
  videoInput.value = "";
});

// Função para mensagem de carregamento
function addLoadingMessage(usuario) {
  const li = document.createElement("li");
  li.innerHTML = `<strong>${usuario}:</strong> Enviando vídeo...`;
  li.className = "me loading-message";
  messages.appendChild(li);
  scrollBottom();
  return li;
}

// --- Funcionalidades do tema ---
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".theme-card").forEach((card) => {
    card.addEventListener("click", () => {
      document
        .querySelectorAll(".theme-card")
        .forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      const themeImage = card.dataset.image;
      const chatDiv = document.querySelector("#chat");
      if (themeImage === "none") {
        chatDiv.style.backgroundImage = "none";
        chatDiv.style.backgroundColor = "var(--bg-color)";
      } else {
        chatDiv.style.backgroundImage = `url(${themeImage})`;
        chatDiv.style.backgroundSize = "cover";
        chatDiv.style.backgroundPosition = "center";
        chatDiv.style.backgroundRepeat = "no-repeat";
        chatDiv.style.imageRendering = "optimizeQuality";
      }
      document.querySelector(".themes-panel").classList.remove("active");
      console.log(`Imagem aplicada: ${themeImage}`);
    });
  });

  // Toggle para abrir/fechar a galeria de temas
  document.getElementById("themes-toggle").addEventListener("click", () => {
    document.querySelector(".themes-panel").classList.toggle("active");
    emojiPanel.classList.remove("active"); // Fecha o painel de emojis
  });

  document.querySelector(".close-themes").addEventListener("click", () => {
    document.querySelector(".themes-panel").classList.remove("active");
  });
});
