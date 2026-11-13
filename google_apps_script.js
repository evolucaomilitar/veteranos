/**
 * =========================================================================
 * SISTEMA DOS VETERANOS 5º BE CMB BLD - BATALHÃO JUAREZ TÁVORA
 * SERVIÇO DE SINCRONIZAÇÃO EM NUVEM (GOOGLE APPS SCRIPT WEB APP)
 * =========================================================================
 * 
 * INSTRUÇÕES RÁPIDAS (Leva 1 minuto):
 * 1. Abra uma nova planilha no Google Sheets: https://sheets.new
 * 2. Dê o nome: "Veteranos 5 BE - Banco de Dados"
 * 3. No menu superior, clique em "Extensões" > "Apps Script"
 * 4. Apague tudo o que estiver lá e COLE TODO ESTE CÓDIGO.
 * 5. Clique no ícone de Salvar (Disquete).
 * 6. Clique no botão azul "Implantar" (canto superior direito) > "Nova Implantação".
 * 7. Clique na engrenagem ao lado de "Selecionar tipo" e escolha "App da Web".
 * 8. Preencha:
 *    - Descrição: "API Veteranos 5 BE"
 *    - Executar como: "Eu (seu email)"
 *    - Quem tem acesso: "Qualquer pessoa" (MUITO IMPORTANTE!)
 * 9. Clique em "Implantar", autorize o acesso com sua conta Google.
 * 10. Copie a "URL do App da Web" gerada (termina com /exec) e cole no Painel do Administrador do site!
 */

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetCadastros = obterOuCriarAba(ss, "Cadastros", [
      "ID", "Data Cadastro", "Nome Completo", "Nome de Guerra", "Graduação", 
      "Companhia", "Ano", "WhatsApp", "Cidade", "UF", "Bairro", "Rua", "Endereço", "Status"
    ]);
    const sheetAlmoco = obterOuCriarAba(ss, "Almoco", [
      "ID", "Data", "Hora", "Nome", "Nome de Guerra", "Companhia", "Ano", 
      "WhatsApp", "Qtd Adulto", "Qtd Meio", "Total Pessoas", "Valor Total (R$)", 
      "Forma Pagamento", "Status Pagamento"
    ]);

    const cadastros = lerDadosAba(sheetCadastros);
    const almoco = lerDadosAba(sheetAlmoco);

    return ContentService.createTextOutput(JSON.stringify({
      sucesso: true,
      timestamp: new Date().toISOString(),
      cadastros: cadastros,
      almoco: almoco
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      sucesso: false,
      erro: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const acao = payload.acao || payload.action || 'salvar_cadastro';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (acao === 'salvar_cadastro' || acao === 'cadastrar_veterano') {
      const sheet = obterOuCriarAba(ss, "Cadastros", [
        "ID", "Data Cadastro", "Nome Completo", "Nome de Guerra", "Graduação", 
        "Companhia", "Ano", "WhatsApp", "Cidade", "UF", "Bairro", "Rua", "Endereço", "Status"
      ]);
      const item = payload.dados || payload.payload || payload;
      salvarOuAtualizarLinha(sheet, item.id, [
        item.id || Date.now(),
        item.dataCadastro || new Date().toLocaleDateString('pt-BR'),
        item.nome || '',
        item.guerra || '',
        item.grad || '',
        item.cia || '',
        item.ano || '',
        item.tel || '',
        item.cidade || '',
        item.uf || '',
        item.bairro || '',
        item.rua || '',
        item.endereco || '',
        item.isAtualizado ? 'Atualizado' : 'Novo'
      ]);
      return jsonRetorno({ sucesso: true, mensagem: "Cadastro salvo na planilha com sucesso!", id: item.id });

    } else if (acao === 'salvar_almoco' || acao === 'cadastrar_almoco') {
      const sheet = obterOuCriarAba(ss, "Almoco", [
        "ID", "Data", "Hora", "Nome", "Nome de Guerra", "Companhia", "Ano", 
        "WhatsApp", "Qtd Adulto", "Qtd Meio", "Total Pessoas", "Valor Total (R$)", 
        "Forma Pagamento", "Status Pagamento"
      ]);
      const item = payload.dados || payload.payload || payload;
      salvarOuAtualizarLinha(sheet, item.id, [
        item.id || Date.now(),
        item.data || new Date().toLocaleDateString('pt-BR'),
        item.hora || new Date().toLocaleTimeString('pt-BR'),
        item.nome || '',
        item.guerra || '',
        item.cia || '',
        item.ano || '',
        item.telefone || '',
        item.qtdAdulto || 0,
        item.qtdInfantil || 0,
        item.qtd || 0,
        item.valorTotal || 0,
        item.formaPagamento || 'PIX',
        item.statusPagamento || 'Pendente'
      ]);
      return jsonRetorno({ sucesso: true, mensagem: "Adesão ao almoço salva com sucesso!", id: item.id });

    } else if (acao === 'excluir_cadastro') {
      const sheet = obterOuCriarAba(ss, "Cadastros");
      excluirLinhaPorId(sheet, payload.id);
      return jsonRetorno({ sucesso: true, mensagem: "Cadastro excluído da planilha com sucesso." });

    } else if (acao === 'excluir_almoco') {
      const sheet = obterOuCriarAba(ss, "Almoco");
      excluirLinhaPorId(sheet, payload.id);
      return jsonRetorno({ sucesso: true, mensagem: "Almoço excluído da planilha com sucesso." });

    } else if (acao === 'obter_tudo' || acao === 'ping') {
      return doGet(e);
    }

    return jsonRetorno({ sucesso: false, erro: "Ação não reconhecida: " + acao });

  } catch (err) {
    return jsonRetorno({ sucesso: false, erro: err.toString() });
  }
}

function jsonRetorno(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function obterOuCriarAba(ss, nomeAba, cabecalhos) {
  let sheet = ss.getSheetByName(nomeAba);
  if (!sheet) {
    sheet = ss.insertSheet(nomeAba);
    if (cabecalhos && cabecalhos.length > 0) {
      sheet.appendRow(cabecalhos);
      sheet.getRange(1, 1, 1, cabecalhos.length)
        .setBackground("#1a3821")
        .setFontColor("#ffffff")
        .setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function salvarOuAtualizarLinha(sheet, id, valores) {
  const dados = sheet.getDataRange().getValues();
  const idStr = String(id);
  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][0]) === idStr) {
      sheet.getRange(i + 1, 1, 1, valores.length).setValues([valores]);
      return;
    }
  }
  sheet.appendRow(valores);
}

function excluirLinhaPorId(sheet, id) {
  const dados = sheet.getDataRange().getValues();
  const idStr = String(id);
  for (let i = dados.length - 1; i >= 1; i--) {
    if (String(dados[i][0]) === idStr) {
      sheet.deleteRow(i + 1);
    }
  }
}

function lerDadosAba(sheet) {
  const dados = sheet.getDataRange().getValues();
  if (dados.length <= 1) return [];
  const cabecalhos = dados[0];
  const resultado = [];

  for (let i = 1; i < dados.length; i++) {
    const linha = dados[i];
    if (!linha[0] && !linha[2]) continue;
    const item = {};
    cabecalhos.forEach((c, idx) => {
      item[normalizarChave(c)] = linha[idx];
    });

    if (sheet.getName() === 'Cadastros') {
      item.id = item.id || Date.now();
      item.nome = item.nomeCompleto || item.nome || '';
      item.guerra = item.nomeDeGuerra || item.guerra || '';
      item.grad = item.graduacao || item.grad || 'Sd';
      item.cia = item.companhia || item.cia || '';
      item.ano = item.ano ? String(item.ano) : '';
      item.tel = item.whatsapp || item.tel || '';
      item.telDial = item.tel ? '55' + String(item.tel).replace(/\D/g, '') : '';
      item.cidade = item.cidade || '';
      item.uf = item.uf || 'PR';
      item.rua = item.rua || '';
      item.bairro = item.bairro || '';
      item.endereco = item.endereco || (item.rua ? `${item.rua} - ${item.cidade}` : item.cidade);
      item.isNovo = true;
    } else if (sheet.getName() === 'Almoco') {
      item.id = item.id || Date.now();
      item.nome = item.nome || '';
      item.guerra = item.nomeDeGuerra || item.guerra || '';
      item.cia = item.companhia || item.cia || '';
      item.ano = item.ano ? String(item.ano) : '';
      item.telefone = item.whatsapp || item.telefone || '';
      item.qtdAdulto = Number(item.qtdAdulto) || 1;
      item.qtdInfantil = Number(item.qtdMeio) || 0;
      item.qtd = Number(item.totalPessoas) || (item.qtdAdulto + item.qtdInfantil);
      item.valorTotal = Number(item.valorTotalR) || 0;
      item.formaPagamento = item.formaPagamento || 'PIX';
      item.statusPagamento = item.statusPagamento || 'Pendente';
    }

    resultado.push(item);
  }
  return resultado;
}

function normalizarChave(str) {
  return str.toString()
    .replace(/[^\w\s]/gi, '')
    .trim()
    .split(/\s+/)
    .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}
