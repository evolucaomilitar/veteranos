# 🔥 Como Conectar o Firebase Realtime Database (Opcional)
### Sistema dos Veteranos 5º BE Cmb Bld — Batalhão Juarez Távora

O Firebase Realtime Database é uma alternativa da Google extremamente rápida (sub-segundo) e 100% gratuita no plano Spark.

---

## 🚀 Passo a Passo (2 Minutos)

1. **Acessar o Firebase Console**:
   - Entre em: [https://console.firebase.google.com](https://console.firebase.google.com)
   - Clique em **Adicionar projeto** e dê o nome: `veteranos-5be`.
   - Pode desativar o Google Analytics e clicar em **Criar projeto**.

2. **Criar o Realtime Database**:
   - No menu lateral esquerdo, em **Build (Construção)**, clique em **Realtime Database**.
   - Clique em **Criar banco de dados**.
   - Escolha o local (ex: `Estados Unidos us-central1`).
   - Escolha **Iniciar no modo de teste** (ou vá em Regras e defina `.read: true` e `.write: true`).
   - Clique em **Ativar**.

3. **Copiar a URL do Banco**:
   - No topo do painel do Realtime Database, você verá a URL do seu banco, parecida com:
     `https://veteranos-5be-default-rtdb.firebaseio.com`
   - Copie esse link.

4. **Colar no Painel do Administrador**:
   - Abra o site dos veteranos, entre no modo Administrador (`104832`), clique no botão **Nuvem** e cole a URL do Firebase.
   - Clique em **Testar Conexão** e depois em **Salvar & Ativar**!

Pronto! Os dados serão sincronizados instantaneamente em tempo real.
