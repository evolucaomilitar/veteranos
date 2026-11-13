# 📊 Como Conectar a Planilha Google para Sincronização Automática em Tempo Real
### Sistema dos Veteranos 5º BE Cmb Bld — Batalhão Juarez Távora

Este guia ensina a conectar o site à sua própria **Planilha Google Sheets** em menos de **2 minutos**. É **100% gratuito**, não expira e não precisa de cartão de crédito.

---

## 🎯 Por que usar a Planilha Google?

1. **Sincronização Automática em Tempo Real**: Sempre que qualquer veterano preencher o formulário ou aderir ao almoço em seu celular, o cadastro aparece **instantaneamente** na planilha e no seu painel de Administrador!
2. **Você é o Dono dos Dados**: Toda a lista de veteranos, telefones, anos e almoços fica salva no seu próprio Google Drive pessoal.
3. **Sem Servidores Complexos**: A Google cuida da hospedagem e da segurança para você.

---

## 🚀 Passo a Passo (2 Minutos)

### Passo 1: Criar a Planilha no Google Drive
1. Acesse: [https://sheets.new](https://sheets.new) (ou abra seu Google Drive e crie uma nova Planilha).
2. Dê o nome para a planilha: `Veteranos 5 BE - Banco de Dados`.

---

### Passo 2: Abrir o Editor de Scripts
1. No menu superior da planilha, clique em **Extensões** ➔ **Apps Script**.
2. Uma nova aba do Google Apps Script será aberta com um arquivo chamado `Código.gs`.

---

### Passo 3: Colar o Código do Sistema
1. **Apague tudo** o que estiver escrito no editor (o `function myFunction() { ... }`).
2. Abra o arquivo [`google_apps_script.js`](file:///C:/Users/Usuario/.gemini/antigravity/scratch/veteranos_5be/google_apps_script.js) deste projeto, copie todo o seu conteúdo e **cole dentro do editor do Google Apps Script**.
3. Clique no ícone de **Salvar** (disquete 💾) ou pressione `Ctrl + S`.

---

### Passo 4: Fazer a Implantação como App da Web
1. No canto superior direito da tela do Apps Script, clique no botão azul **Implantar** ➔ **Nova implantação**.
2. Na janela que abrir, clique no ícone de **engrenagem ⚙️** ao lado de "Selecionar tipo" e escolha **App da Web**.
3. Configure exatamente assim:
   - **Descrição**: `API Veteranos 5 BE`
   - **Executar como**: `Eu (seu email do Google)`
   - **Quem tem acesso**: `Qualquer pessoa` *(MUITO IMPORTANTE: se deixar como restrito, os veteranos não conseguirão enviar os cadastros pelo celular)*.
4. Clique no botão azul **Implantar**.
5. O Google pedirá autorização na primeira vez:
   - Clique em **Autorizar acesso**;
   - Escolha sua conta Google;
   - Se aparecer "O Google não verificou este app", clique em **Avançado** (canto inferior esquerdo) e depois em **Acessar API Veteranos 5 BE (não seguro)**;
   - Clique em **Permitir**.

---

### Passo 5: Copiar o Link e Colar no Painel do Site
1. Na janela de confirmação, o Google exibirá a **URL do App da Web** (um link longo que termina com `/exec`, exemplo: `https://script.google.com/macros/s/AKfycb.../exec`).
2. Clique em **Copiar**.
3. Agora abra o site dos veteranos, faça o login de Administrador (`104832`), clique no botão **Nuvem** (ou **Configurar Nuvem** no topo) e cole o link no campo correspondente.
4. Clique em **Salvar & Conectar**!

---

## ✅ O Que Acontece Agora?

- O site cria automaticamente duas abas bonitas e organizadas na sua planilha:
  - 📋 **Cadastros**: Todos os novos veteranos com Nome, Guerra, Companhia, Ano, WhatsApp e Endereço.
  - 🍽️ **Almoco**: Todas as adesões ao almoço com quantidade de refeições, valor em R$ e comprovantes PIX.
- Quando o Administrador abrir a aba no computador ou no celular, o sistema já busca e mostra todos os novos cadastros automaticamente sem você precisar fazer nada!
