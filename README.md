# 💬 ChatLab

![ChatLab Banner](https://img.shields.io/badge/ChatLab-RealTimeChat-brightgreen)

ChatLab é um **chat em tempo real** construído com Node.js e Socket.io, projetado para oferecer comunicação instantânea, suporte a **emojis**, **imagens** e **vídeos**, e técnicas avançadas de **otimização de mídia** para melhorar a experiência do usuário.  

O projeto combina **um servidor Node.js** para gerenciar usuários e eventos em tempo real, com um **front-end interativo**, usando bibliotecas modernas como **Twemoji** para emojis.

## 🚀 Funcionalidades

- **Chat em tempo real** utilizando [Socket.io](https://socket.io/)
- **Gestão de usuários online**:
  - Controla usuários distintos por navegador/dispositivo
  - Mantém a contagem correta de usuários online mesmo com múltiplas abas abertas do mesmo usuário
- **Lista de usuários online** exibida em hover
- **Envio de emojis** via [Twemoji](https://github.com/twitter/twemoji)
- **Envio de imagens e vídeos**
  - Validação de tamanho e tipo de arquivo
  - **Otimização de imagens via Canvas** antes do envio
- **Animação de usuário online** com efeito pulse
- **Temas personalizados** para personalizar o fundo do chat
- Sistema de mensagens **texto, imagem e vídeo**, todas estilizadas e responsivas

---

## 💡 Técnicas Implementadas

1. **Real-time communication:**  
   - Cada usuário conectado recebe informações de todos os outros usuários em tempo real.

2. **Gestão de múltiplas abas do mesmo usuário:**  
   - O contador de abas impede que um mesmo usuário seja contado mais de uma vez na lista de usuários online.

3. **Envio otimizado de mídia:**  
   - Imagens enviadas pelo usuário são redimensionadas e convertidas via Canvas API para reduzir tamanho sem perder qualidade perceptível.

4. **Emojis estilizados:**  
   - Emojis renderizados com Twemoji para manter consistência visual.

5. **Notificações e animações:**  
   - Efeito `pulse` para usuários online e mensagens do sistema destacadas.
