/**
 * SISTEMA DOS VETERANOS 5º BE CMB BLD - BATALHÃO JUAREZ TÁVORA
 * CLOUD SYNC MANAGER (Sincronização em Nuvem Automática em Tempo Real)
 * 
 * Sincroniza cadastros e adesões ao almoço entre celulares dos veteranos
 * e o painel administrativo da diretoria através de:
 * 1. Google Sheets (Google Apps Script Web App - 100% Gratuito & Permanente)
 * 2. Firebase Realtime Database (Google Cloud)
 * 3. Vercel Serverless API (/api/sync)
 */

(function (window) {
  'use strict';

  // Configuração Padrão
  const STORAGE_KEYS = {
    URL: 'nuvem_sync_url',
    ULTIMO_SYNC: 'nuvem_ultimo_sync_ts',
    FILA_PENDENTE: 'nuvem_fila_pendente_v1',
    NOVOS_VETERANOS: 'novos_veteranos_5be',
    ALMOCO: 'almoco_veteranos_5be',
    EXCLUIDOS: 'excluidos_veteranos_5be'
  };

  // URL Padrão caso não haja nenhuma customizada salva pelo Administrador
  // Pode ser configurada pelo Admin no Modal de Nuvem ou vir pré-configurada
  const URL_NUVEM_DEFAULT = window.VETERANOS_CLOUD_URL || '';

  const CloudSync = {
    _timerAutoSync: null,
    _sincronizando: false,
    _ultimoStatus: 'pronto', // 'pronto' | 'sincronizando' | 'online' | 'erro' | 'desconectado'
    _ultimaMensagem: '',

    /**
     * Obtém a URL ativa da nuvem
     */
    getUrl: function () {
      const urlSalva = localStorage.getItem(STORAGE_KEYS.URL);
      if (urlSalva && urlSalva.trim()) return urlSalva.trim();
      if (URL_NUVEM_DEFAULT && URL_NUVEM_DEFAULT.trim()) return URL_NUVEM_DEFAULT.trim();

      // Se estiver rodando em servidor web (como Vercel)
      if (window.location && window.location.origin && window.location.origin.startsWith('http')) {
        return window.location.origin + '/api/sync';
      }
      return '';
    },

    /**
     * Salva nova URL da nuvem
     */
    setUrl: function (novaUrl) {
      if (!novaUrl || !novaUrl.trim()) {
        localStorage.removeItem(STORAGE_KEYS.URL);
      } else {
        localStorage.setItem(STORAGE_KEYS.URL, novaUrl.trim());
      }
      this.atualizarStatusVisual('pronto', 'URL atualizada. Clique em Sincronizar.');
      return this.getUrl();
    },

    /**
     * Detecta o tipo de backend a partir da URL
     */
    detectarTipoBackend: function (url) {
      const u = (url || this.getUrl() || '').toLowerCase();
      if (u.includes('script.google.com') || u.includes('script.googleusercontent.com')) {
        return 'google_sheets';
      }
      if (u.includes('firebaseio.com')) {
        return 'firebase';
      }
      if (u.includes('/api/sync') || u.includes('/api/cadastros')) {
        return 'vercel_api';
      }
      return 'generico';
    },

    /**
     * Envia um cadastro de veterano para a nuvem
     */
    enviarCadastro: async function (cadastro) {
      if (!cadastro) return { sucesso: false, erro: 'Sem dados' };
      const url = this.getUrl();

      // Sempre garante que está salvo localmente primeiro
      this._salvarLocalCadastro(cadastro);

      if (!url) {
        console.info('[CloudSync] Nenhuma URL de nuvem configurada. Salvo apenas localmente.');
        return { sucesso: true, localApenas: true };
      }

      const payload = {
        acao: 'salvar_cadastro',
        tipo: 'cadastro',
        origem: 'app_veteranos_5be',
        timestamp: new Date().toISOString(),
        dados: cadastro
      };

      try {
        const resposta = await this._enviarRequisicao(url, payload);
        this.atualizarStatusVisual('online', `Cadastro de ${cadastro.nome} sincronizado na nuvem!`);
        return { sucesso: true, resposta: resposta };
      } catch (err) {
        console.warn('[CloudSync] Falha ao enviar para a nuvem, enfileirando para retry:', err);
        this._enfileirarPendente('cadastro', cadastro);
        this.atualizarStatusVisual('erro', 'Offline: salvo no celular e aguardando conexão.');
        return { sucesso: false, enfileirado: true, erro: err.message };
      }
    },

    /**
     * Envia uma adesão ao almoço para a nuvem
     */
    enviarAlmoco: async function (itemAlmoco) {
      if (!itemAlmoco) return { sucesso: false, erro: 'Sem dados' };
      const url = this.getUrl();

      if (!url) {
        console.info('[CloudSync] Salvo apenas localmente.');
        return { sucesso: true, localApenas: true };
      }

      const payload = {
        acao: 'salvar_almoco',
        tipo: 'almoco',
        origem: 'app_veteranos_5be',
        timestamp: new Date().toISOString(),
        dados: itemAlmoco
      };

      try {
        const resposta = await this._enviarRequisicao(url, payload);
        this.atualizarStatusVisual('online', `Almoço de ${itemAlmoco.nome} sincronizado na nuvem!`);
        return { sucesso: true, resposta: resposta };
      } catch (err) {
        console.warn('[CloudSync] Falha ao enviar almoço, enfileirando:', err);
        this._enfileirarPendente('almoco', itemAlmoco);
        return { sucesso: false, enfileirado: true, erro: err.message };
      }
    },

    /**
     * Exclui cadastro da nuvem
     */
    excluirCadastro: async function (id) {
      const url = this.getUrl();
      if (!url || !id) return;
      const payload = {
        acao: 'excluir_cadastro',
        tipo: 'exclusao_cadastro',
        id: id,
        timestamp: new Date().toISOString()
      };
      try {
        await this._enviarRequisicao(url, payload);
        console.log('[CloudSync] Cadastro removido da nuvem:', id);
      } catch (e) {
        console.warn('[CloudSync] Não foi possível remover da nuvem imediatamente:', e);
      }
    },

    /**
     * Exclui adesão ao almoço da nuvem
     */
    excluirAlmoco: async function (id) {
      const url = this.getUrl();
      if (!url || !id) return;
      const payload = {
        acao: 'excluir_almoco',
        tipo: 'exclusao_almoco',
        id: id,
        timestamp: new Date().toISOString()
      };
      try {
        await this._enviarRequisicao(url, payload);
        console.log('[CloudSync] Almoço removido da nuvem:', id);
      } catch (e) {
        console.warn('[CloudSync] Não foi possível remover almoço da nuvem:', e);
      }
    },

    /**
     * Puxa todos os dados da nuvem e mescla com os registros locais sem duplicar
     */
    sincronizarTudo: async function (opcoes) {
      const opt = opcoes || {};
      const silencioso = Boolean(opt.silencioso);
      const url = this.getUrl();

      if (!url) {
        if (!silencioso) {
          this.atualizarStatusVisual('desconectado', 'Nenhuma URL de nuvem configurada.');
        }
        return { sucesso: false, erro: 'Sem URL configurada' };
      }

      if (this._sincronizando) {
        return { sucesso: false, ocupado: true };
      }

      this._sincronizando = true;
      this.atualizarStatusVisual('sincronizando', 'Buscando novos cadastros na nuvem...');

      try {
        // 1. Processa itens que estavam offline na fila de espera
        await this.processarFilaPendente();

        // 2. Busca dados atualizados da nuvem
        const dadosNuvem = await this._buscarDadosNuvem(url);

        if (!dadosNuvem || (!dadosNuvem.cadastros && !dadosNuvem.almoco && !Array.isArray(dadosNuvem))) {
          throw new Error('Formato de resposta inválido da nuvem.');
        }

        const cadastrosRemotos = dadosNuvem.cadastros || (Array.isArray(dadosNuvem) ? dadosNuvem : []);
        const almocoRemoto = dadosNuvem.almoco || [];

        // 3. Mescla com os dados locais
        const qtdNovosCadastros = this._mesclarCadastros(cadastrosRemotos);
        const qtdNovosAlmoco = this._mesclarAlmoco(almocoRemoto);

        // 4. Salva timestamp
        localStorage.setItem(STORAGE_KEYS.ULTIMO_SYNC, Date.now().toString());

        // 5. Atualiza o sistema na tela
        if (typeof window.recarregarEfetivoComNovos === 'function') {
          window.recarregarEfetivoComNovos();
        }
        if (typeof window.renderizarTabelaAlmocoAdmin === 'function') {
          window.renderizarTabelaAlmocoAdmin();
        }
        if (typeof window.renderizarGridParticipantesModal === 'function') {
          window.renderizarGridParticipantesModal();
        }

        const horaFormatada = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const msgResumo = `Nuvem atualizada às ${horaFormatada} • ${cadastrosRemotos.length} cadastros • ${almocoRemoto.length} almoços`;
        this.atualizarStatusVisual('online', msgResumo);

        if (!silencioso && (qtdNovosCadastros > 0 || qtdNovosAlmoco > 0)) {
          if (typeof window.mostrarNotificaçãoTatica === 'function') {
            window.mostrarNotificaçãoTatica(`☁️ Sincronização concluída! ${qtdNovosCadastros} novo(s) veterano(s) recebidos.`);
          }
        }

        this._sincronizando = false;
        return {
          sucesso: true,
          cadastrosTotal: cadastrosRemotos.length,
          almocoTotal: almocoRemoto.length,
          novosCadastros: qtdNovosCadastros,
          novosAlmoco: qtdNovosAlmoco
        };

      } catch (err) {
        this._sincronizando = false;
        console.warn('[CloudSync] Erro na sincronização:', err);
        this.atualizarStatusVisual('erro', 'Falha ao conectar na nuvem. Usando dados locais.');
        return { sucesso: false, erro: err.message };
      }
    },

    /**
     * Inicia sincronização automática em segundo plano
     */
    iniciarAutoSync: function (intervaloSegundos) {
      if (this._timerAutoSync) {
        clearInterval(this._timerAutoSync);
      }

      const intervaloMs = Math.max(15, (intervaloSegundos || 30)) * 1000;

      // Executa periodicamente apenas se a janela estiver visível
      this._timerAutoSync = setInterval(() => {
        if (!document.hidden && this.getUrl()) {
          // Se for admin ou se houver conexão, sincroniza silenciosamente
          this.sincronizarTudo({ silencioso: true });
        }
      }, intervaloMs);

      // Re-sincroniza imediatamente quando o usuário volta para a aba
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.getUrl()) {
          this.sincronizarTudo({ silencioso: true });
        }
      });

      // Tenta enviar pendentes assim que a internet volta
      window.addEventListener('online', () => {
        console.log('[CloudSync] Conexão restabelecida! Sincronizando...');
        this.processarFilaPendente();
        this.sincronizarTudo({ silencioso: false });
      });

      console.log(`[CloudSync] AutoSync ativo a cada ${intervaloMs / 1000}s`);
    },

    /**
     * Testa a conexão com uma URL específica ou a configurada
     */
    testarConexao: async function (urlTeste) {
      const url = (urlTeste || this.getUrl() || '').trim();
      if (!url) {
        return { sucesso: false, erro: 'URL em branco. Digite ou cole o link do Google Sheets ou Firebase.' };
      }

      try {
        const dados = await this._buscarDadosNuvem(url);
        const tipo = this.detectarTipoBackend(url);
        let totalC = 0;
        let totalA = 0;

        if (dados && dados.cadastros && Array.isArray(dados.cadastros)) {
          totalC = dados.cadastros.length;
        } else if (Array.isArray(dados)) {
          totalC = dados.length;
        }

        if (dados && dados.almoco && Array.isArray(dados.almoco)) {
          totalA = dados.almoco.length;
        }

        return {
          sucesso: true,
          tipo: tipo,
          totalCadastros: totalC,
          totalAlmoco: totalA,
          mensagem: `Conexão bem sucedida! ${totalC} cadastros e ${totalA} almoços identificados na nuvem.`
        };
      } catch (err) {
        return {
          sucesso: false,
          erro: `Não foi possível conectar: ${err.message}`
        };
      }
    },

    /**
     * Processa itens que foram salvos em offline
     */
    processarFilaPendente: async function () {
      let fila = [];
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.FILA_PENDENTE);
        if (raw) fila = JSON.parse(raw);
      } catch (e) { fila = []; }

      if (!fila || fila.length === 0) return;

      const url = this.getUrl();
      if (!url) return;

      const restante = [];
      for (const item of fila) {
        try {
          const payload = {
            acao: item.tipo === 'almoco' ? 'salvar_almoco' : 'salvar_cadastro',
            tipo: item.tipo,
            origem: 'retry_offline',
            dados: item.dados
          };
          await this._enviarRequisicao(url, payload);
        } catch (e) {
          restante.push(item);
        }
      }

      try {
        if (restante.length === 0) {
          localStorage.removeItem(STORAGE_KEYS.FILA_PENDENTE);
        } else {
          localStorage.setItem(STORAGE_KEYS.FILA_PENDENTE, JSON.stringify(restante));
        }
      } catch (e) {}
    },

    /**
     * Atualiza o visual do status da nuvem no header e painel
     */
    atualizarStatusVisual: function (status, mensagem) {
      this._ultimoStatus = status;
      this._ultimaMensagem = mensagem || '';

      // Atualiza badge no Navbar do Admin
      const iconeNav = document.getElementById('iconeNuvemNav');
      const labelNav = document.getElementById('labelNuvemNav');
      const btnNav = document.getElementById('btnStatusNuvemNav');

      if (iconeNav) {
        iconeNav.className = 'w-2 h-2 rounded-full inline-block mr-1.5 ' + (
          status === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' :
          status === 'sincronizando' ? 'bg-amber-400 animate-ping' :
          status === 'erro' ? 'bg-red-400' :
          'bg-slate-400'
        );
      }

      if (labelNav) {
        labelNav.innerText = (
          status === 'online' ? 'Nuvem OK' :
          status === 'sincronizando' ? 'Sincronizando...' :
          status === 'erro' ? 'Nuvem Offline' :
          'Configurar Nuvem'
        );
      }

      // Atualiza modal se estiver aberto
      const statusModalTxt = document.getElementById('modalNuvemStatusTxt');
      const statusModalBadge = document.getElementById('modalNuvemStatusBadge');
      if (statusModalTxt) statusModalTxt.innerText = this._ultimaMensagem || 'Pronto';
      if (statusModalBadge) {
        statusModalBadge.className = 'px-2.5 py-1 rounded text-xs font-bold uppercase ' + (
          status === 'online' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60' :
          status === 'sincronizando' ? 'bg-amber-950 text-amber-300 border border-amber-500/60' :
          status === 'erro' ? 'bg-red-950 text-red-300 border border-red-500/60' :
          'bg-slate-900 text-slate-300 border border-slate-700'
        );
        statusModalBadge.innerText = (
          status === 'online' ? '🟢 Conectado' :
          status === 'sincronizando' ? '🟡 Em Andamento' :
          status === 'erro' ? '🔴 Erro de Conexão' :
          '⚪ Não Configurado'
        );
      }
    },

    // ==========================================
    // MÉTODOS INTERNOS / PRIVADOS
    // ==========================================

    _enviarRequisicao: async function (url, payload) {
      const tipo = this.detectarTipoBackend(url);

      if (tipo === 'google_sheets') {
        // Para Google Apps Script: enviar como text/plain evita preflight CORS OPTIONS
        // O Apps Script recebe e faz JSON.parse(e.postData.contents) perfeitamente!
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
          redirect: 'follow'
        });
        const txt = await resp.text();
        try {
          return JSON.parse(txt);
        } catch (e) {
          return { texto: txt };
        }
      }

      if (tipo === 'firebase') {
        // REST API do Firebase
        const subcaminho = payload.tipo === 'almoco' ? '/almoco' : '/cadastros';
        const id = (payload.dados && payload.dados.id) || payload.id || Date.now();
        const fireUrl = url.replace(/\/+$/, '') + subcaminho + '/' + id + '.json';

        if (payload.acao && payload.acao.startsWith('excluir')) {
          const resp = await fetch(fireUrl, { method: 'DELETE' });
          return await resp.json();
        } else {
          const resp = await fetch(fireUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload.dados)
          });
          return await resp.json();
        }
      }

      // Vercel / Padrão REST
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await resp.json();
    },

    _buscarDadosNuvem: async function (url) {
      const tipo = this.detectarTipoBackend(url);

      if (tipo === 'firebase') {
        const base = url.replace(/\/+$/, '');
        const [respCadastros, respAlmoco] = await Promise.all([
          fetch(base + '/cadastros.json').then(r => r.json()).catch(() => ({})),
          fetch(base + '/almoco.json').then(r => r.json()).catch(() => ({}))
        ]);

        const cadastros = respCadastros ? Object.values(respCadastros).filter(Boolean) : [];
        const almoco = respAlmoco ? Object.values(respAlmoco).filter(Boolean) : [];
        return { cadastros: cadastros, almoco: almoco };
      }

      // Google Sheets e Vercel respondem via GET
      const separator = url.includes('?') ? '&' : '?';
      const urlFinal = `${url}${separator}_t=${Date.now()}`;

      const resp = await fetch(urlFinal, {
        method: 'GET',
        redirect: 'follow'
      });

      if (!resp.ok) {
        throw new Error(`Servidor respondeu com código ${resp.status}`);
      }

      const txt = await resp.text();
      try {
        return JSON.parse(txt);
      } catch (e) {
        throw new Error('A resposta da nuvem não é um JSON válido. Verifique se a implantação do Apps Script está como "Qualquer pessoa".');
      }
    },

    _mesclarCadastros: function (remotos) {
      if (!Array.isArray(remotos) || remotos.length === 0) return 0;

      let locais = [];
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.NOVOS_VETERANOS);
        if (stored) locais = JSON.parse(stored);
      } catch (e) { locais = []; }

      let excluidos = [];
      try {
        const storedExcl = localStorage.getItem(STORAGE_KEYS.EXCLUIDOS);
        if (storedExcl) excluidos = JSON.parse(storedExcl);
      } catch (e) { excluidos = []; }
      const setExcluidos = new Set(excluidos.map(String));

      let novosAdicionados = 0;

      remotos.forEach(remoto => {
        if (!remoto || !remoto.nome) return;
        if (setExcluidos.has(String(remoto.id))) return; // Respeita exclusões feitas pelo admin

        // Procura se já existe nos locais por ID ou telefone ou Nome
        let idx = locais.findIndex(l => String(l.id) === String(remoto.id));
        if (idx === -1 && typeof window.encontrarMilitarExistente === 'function') {
          const match = window.encontrarMilitarExistente(locais, remoto);
          if (match) idx = match.index;
        }

        if (idx !== -1) {
          // Atualiza dados mantendo a versão mais completa
          locais[idx] = Object.assign({}, locais[idx], remoto);
        } else {
          // Novo registro vindo da nuvem!
          remoto.isNovo = true;
          locais.unshift(remoto);
          novosAdicionados++;
        }
      });

      try {
        localStorage.setItem(STORAGE_KEYS.NOVOS_VETERANOS, JSON.stringify(locais));
      } catch (e) {}

      return novosAdicionados;
    },

    _mesclarAlmoco: function (remotos) {
      if (!Array.isArray(remotos) || remotos.length === 0) return 0;

      let locais = [];
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.ALMOCO);
        if (stored) locais = JSON.parse(stored);
      } catch (e) { locais = []; }

      let novosAdicionados = 0;

      remotos.forEach(remoto => {
        if (!remoto || !remoto.nome) return;
        const idx = locais.findIndex(l => String(l.id) === String(remoto.id));

        if (idx !== -1) {
          locais[idx] = Object.assign({}, locais[idx], remoto);
        } else {
          locais.unshift(remoto);
          novosAdicionados++;
        }
      });

      try {
        localStorage.setItem(STORAGE_KEYS.ALMOCO, JSON.stringify(locais));
      } catch (e) {}

      return novosAdicionados;
    },

    _salvarLocalCadastro: function (cadastro) {
      try {
        let locais = [];
        const raw = localStorage.getItem(STORAGE_KEYS.NOVOS_VETERANOS);
        if (raw) locais = JSON.parse(raw);

        let idx = locais.findIndex(l => String(l.id) === String(cadastro.id));
        if (idx !== -1) {
          locais[idx] = Object.assign({}, locais[idx], cadastro);
        } else {
          locais.unshift(cadastro);
        }
        localStorage.setItem(STORAGE_KEYS.NOVOS_VETERANOS, JSON.stringify(locais));
      } catch (e) {}
    },

    _enfileirarPendente: function (tipo, dados) {
      try {
        let fila = [];
        const raw = localStorage.getItem(STORAGE_KEYS.FILA_PENDENTE);
        if (raw) fila = JSON.parse(raw);
        fila.push({ tipo: tipo, dados: dados, ts: Date.now() });
        localStorage.setItem(STORAGE_KEYS.FILA_PENDENTE, JSON.stringify(fila));
      } catch (e) {}
    }
  };

  // Expõe no escopo global
  window.CloudSync = CloudSync;

})(window);
