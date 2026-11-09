---
name: gestao-veteranos-5be
description: Procedimentos operacionais, consulta ao efetivo de 658 veteranos do 5º Batalhão de Engenharia de Combate Blindado, filtragem por companhia e turma, gestão financeira de almoço e elaboração de despachos e convites no padrão militar.
---

# Gestão de Veteranos - 5º BE Cmb Bld (Batalhão Juarez Távora)

Esta skill orienta o agente na execução de consultas táticas, organização de turmas, controle de tesouraria de almoço e elaboração de mensagens oficiais para os veteranos do 5º Batalhão de Engenharia de Combate Blindado (Porto União - SC / União da Vitória - PR).

---

## 1. Estrutura do Efetivo e Fontes de Dados

A base de dados oficial e higienizada reside no arquivo [`dados.js`](file:///C:/Users/Usuario/.gemini/antigravity/scratch/veteranos_5be/dados.js) e contém 658 veteranos.

### Formato de Registro
```javascript
{
  id: 1,
  nome: "NOME COMPLETO DO MILITAR",
  tel: "42999999999",
  cia: "1ª Cia E Cmb Bld", // 1ª Cia, 2ª Cia, CCAp, CEP, EM, NPOR
  ano: "1988",             // Ano de incorporação / prestação de serviço
  mascote: "🦁",           // Símbolo heráldico da subunidade
  foto: "animal_leao.svg"  // Emblema vetorial tático
}
```

### Arquivos Complementares no Repositório
- `veteranos_5be_contatos.vcf`: Arquivo vCard completo para importação instantânea de todos os 658 veteranos na agenda do celular da comissão.
- `veteranos_5be_google_contacts.csv`: Planilha formatada para importação direta no Google Contatos.
- `veteranos_5be_planilha.csv`: Planilha de controle tático em formato tabular.
- `exportados_por_companhia/`: Subdiretório contendo as listas separadas por subunidade militar.

---

## 2. Companhias e Mascotes Heráldicos

| Subunidade | Mascote | Emblema | Arquivo SVG | Lema / Característica |
| :--- | :---: | :---: | :--- | :--- |
| **1ª Cia E Cmb Bld** | Leão | 🦁 | `animal_leao.svg` | Bravura, Força, Vanguarda Blindada |
| **2ª Cia E Cmb Bld** | Onça | 🐆 | `animal_onca.svg` | Agilidade, Selva, Rusticidade Operacional |
| **CCAp** | Pantera | 🐾 | `animal_pantera.svg` | Coordenação, Logística, Saúde, Comando |
| **CEP** | Águia | 🦅 | `animal_aguia.svg` | Visão Tática, Pontes, Transposição de Vias |
| **Estado-Maior / NPOR** | Estrela / Castelo | ⭐ / 🏰 | `logo.svg` | Tradição, Liderança e Doutrina |

---

## 3. Gestão Financeira e Regras do Almoço

Ao calcular valores ou instruir veteranos sobre a adesão ao almoço de confraternização:

1. **Valores Oficiais**:
   - **Adulto** (11 anos ou mais): **R$ 50,00**
   - **Meio-Almoço** (crianças de 6 a 10 anos): **R$ 25,00**
   - **Isento / Infantil** (crianças até 5 anos): **Gratuito** (não pagam)
2. **Dados Oficiais de Pagamento PIX**:
   - **Chave PIX**: `42999378607` (Tipo: Celular / Telefone)
   - **Favorecido**: Glaucio Érico Almeida Silva
   - **WhatsApp para Envio de Comprovante**: `(42) 99904-3839`
3. **Formas de Pagamento Válidas**:
   - Transferência via PIX para a chave oficial.
   - Dinheiro em espécie na tesouraria do evento.
   - *Nota*: A opção de pagamento com cartão foi descontinuada e removida.
4. **Mural Público de Participantes Confirmados**:
   - Conforme diretriz da comissão, os participantes do almoço podem ser visualizados por todos os veteranos agrupados por companhia e turma militar.
   - A exibição pública contém: **Nome do Veterano**, **Companhia**, **Mascote Heráldico** e **Ano de Incorporação**. Os telefones permanecem em sigilo.

---

## 4. Modelos Oficiais de Mensagem WhatsApp

### Modelo A: Convocação e Convite Individual
```text
🎖️ *5º BATALHÃO DE ENGENHARIA DE COMBATE BLINDADO*
*Batalhão Juarez Távora | Porto União - SC*

Prezado Veterano {{NOME}}, da {{COMPANHIA}} (Turma de {{ANO}}) {{MASCOTE}}!

A Comissão de Veteranos convoca você e sua distinta família para o nosso *Grande Reencontro e Almoço de Confraternização*.

📅 *Data do Evento:* 15 de Novembro de 2026
📍 *Local:* Grêmio das Praças / Sede dos Veteranos do 5º BE
🍽️ *Almoço Especial:* Costelão de Chão e Churrasco Tradicional

💵 *Valores:*
• Almoço Adulto: R$ 50,00
• Crianças de 6 a 10 anos: R$ 25,00 (Meio-almoço)
• Crianças até 5 anos: Gratuito

🔑 *Chave PIX Oficial:* 42999378607
👤 *Titular:* Glaucio Érico Almeida Silva
📲 *Envio do Comprovante:* (42) 99904-3839

Garanta já o seu lugar na formação!
Aço! 🇧🇷⚔️
```

### Modelo B: Confirmação de Pagamento Recebido
```text
✅ *CONFIRMAÇÃO DE ADESÃO AO ALMOÇO - 5º BE*

Prezado Camarada {{NOME}}, seu pagamento para o Almoço de Reencontro foi devidamente *CONFIRMADO* pela tesouraria!

🎖️ *Companhia:* {{COMPANHIA}} {{MASCOTE}}
📅 *Turma:* {{ANO}}
👥 *Total de Participantes Assegurados:* {{QTD_ADULTOS}} Adulto(s) + {{QTD_INFANTIL}} Criança(s)
💰 *Valor Quitado:* R$ {{VALOR_TOTAL}},00

Seu nome já consta na lista de presença oficial da sua Companhia.
Estamos honrados com a sua presença!
*Aço!* 🇧🇷
```

---

## 5. Auditoria e Operação da Plataforma Web

Ao realizar manutenções nas páginas web do sistema (`index.html`, `cadastro.html`, `reencontro.html`):
- Manter o tema **Verde-Oliva Executivo & Dourado Nobre** (`#132317`, `#d4af37`, `#0a110b`).
- Assegurar compatibilidade PWA e funcionamento offline através do Service Worker (`sw.js`).
- O Painel Administrativo conta com gráficos táticos de arrecadação financeira, contagem de participantes por companhia, distribuição de turmas por década e exportação instantânea em CSV/Excel.
