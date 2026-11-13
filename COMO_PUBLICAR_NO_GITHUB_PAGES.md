# 🌐 Guia Oficial: Como Publicar o Sistema no GitHub Pages (100% Gratuito)
### Sistema dos Veteranos 5º BE Cmb Bld — Batalhão Juarez Távora

Este guia explica como publicar o sistema oficial no **GitHub Pages** para que todos os 658 veteranos possam acessar no celular ou computador com link mundial seguro HTTPS e suporte a PWA (aplicativo instalável).

---

## 🚀 Como Ativar o GitHub Pages (1 Minuto)

1. **Acessar seu Repositório no GitHub**:
   - Abra o seu repositório no GitHub pelo navegador: `https://github.com/SEU-USUARIO/veteranos_5be`
2. **Abrir as Configurações**:
   - No menu superior do repositório, clique na aba **Settings ⚙️** (Configurações).
3. **Ir na Seção Pages**:
   - Na barra lateral esquerda, clique em **Pages** (dentro da seção *Code and automation*).
4. **Definir a Origem da Publicação (Build and deployment)**:
   - Em **Source**, selecione: **Deploy from a branch**.
   - Em **Branch**, selecione a branch principal (geralmente **main** ou **master**) e a pasta **/ (root)**.
   - Clique em **Save** (Salvar).
5. **Pronto!**:
   - Em cerca de 30 a 60 segundos, o GitHub gerará o link oficial:
     `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`
   - O link possui certificado digital SSL/HTTPS automático e gratuito para sempre!

---

## ☁️ Como Funciona a Sincronização em Nuvem Automática (Estilo Biriba / Tempo Real)

O sistema utiliza a mesma tecnologia em nuvem do **Simulador Biriba**:
- **Zero Configuração de Servidores**: Não requer Vercel, Node.js, nem bancos de dados complexos. Funciona nativamente em sites estáticos como o GitHub Pages!
- **Transmissão Instantânea**: Quando um veterano preenche a ficha ou reserva o almoço no celular dele, os dados chegam **em menos de 1 segundo** no computador ou celular do Administrador via WebSockets / SSE.
- **Sinal Sonoro Militar**: O sistema toca um sino harmonioso nativo (`Web Audio API`) e emite aviso em verde na tela a cada nova inscrição recebida.
- **Histórico Automático**: Ao abrir o site em qualquer computador ou celular, o sistema busca na nuvem todas as inscrições feitas nos últimos dias e atualiza a lista automaticamente.
- **Sincronização de Exclusão**: Quando o Administrador exclui um cadastro digitando a senha `104832`, a exclusão é replicada na nuvem para todos os aparelhos.

---

## 📲 Compartilhando no WhatsApp dos Veteranos

Cole o link do GitHub Pages nos grupos do 5º BE:
```text
🎖️ *Reencontro & Almoço dos Veteranos 5º BE Cmb Bld*
Portal oficial do Batalhão Juarez Távora. Consulte seu nome no efetivo, confirme seu almoço e reencontre sua turma!
```

---

## 📱 Instalação no Celular (PWA)

- **Android (Chrome)**: O veterano clica no botão dourado de instalação ou no menu do navegador ➔ **"Instalar aplicativo"**.
- **iPhone / iOS (Safari)**: O veterano clica no botão **Compartilhar** do Safari ➔ **"Adicionar à Tela de Início"**.
- O ícone do Batalhão Juarez Távora é adicionado na tela inicial do aparelho e funciona com carregamento instantâneo.
