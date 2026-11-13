/**
 * SISTEMA DOS VETERANOS 5º BE CMB BLD - BATALHÃO JUAREZ TÁVORA
 * MOTOR DE SINCRONIZAÇÃO EM NUVEM AUTOMÁTICA EM TEMPO REAL
 * 
 * Baseado na mesma arquitetura do Simulador Biriba:
 * - Tecnologia: ntfy.sh (Pub/Sub mundial via SSE EventSource + HTTP POST)
 * - 100% Compatível com GitHub Pages, Celulares (Android/iOS) e Computadores
 * - Headers estritamente em ASCII (Zero crash ByteString em navegadores mobile)
 * - Histórico seguro (since=24h com fallback instantâneo para poll=1)
 * - Fila de reenvio offline persistente (nunca perde cadastro mesmo sem sinal temporário)
 * - Sinal sonoro militar com Web Audio API nativa
 */

(function (window) {
  'use strict';

  // Tópico Padrão do 5º BE Cmb Bld (exclusivo para o Batalhão Juarez Távora)
  const DEFAULT_SYNC_TOPIC = "veteranos_5be_juarez_tavora_oficial";

  const STORAGE_KEYS = {
    TOPIC: 'veteranos_5be_sync_topic',
    NOVOS_VETERANOS: 'novos_veteranos_5be',
    ALMOCO: 'almoco_veteranos_5be',
    EXCLUIDOS: 'excluidos_veteranos_5be',
    ULTIMO_SYNC: 'veteranos_5be_ultimo_sync',
    FILA_PENDENTES: 'veteranos_5be_nuvem_pendentes'
  };

  let cloudEventSource = null;
  let cloudHeartbeatInterval = null;
  let _sincronizando = false;
  let _processandoFila = false;
  let _ultimoStatus = 'conectando'; // 'conectado' | 'conectando' | 'offline'
  let _ultimaMensagem = 'Iniciando nuvem em tempo real...';

  /**
   * Sanitiza cabeçalhos HTTP para 7-bit ASCII puro.
   * No padrão WHATWG Fetch (utilizado no Chrome Mobile e Safari iOS), qualquer
   * caractere > 255 (como emojis 🎖️ 🍽️ ou acentuação rica) dispara TypeError:
   * "Cannot convert argument to a ByteString".
   */
  function toAsciiHeader(str) {
    if (!str) return 'Notificacao 5 BE';
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^\x20-\x7E]/g, '')   // apenas ASCII imprimível
      .trim()
      .substring(0, 90) || 'Notificacao 5 BE';
  }

  /**
   * Dispara atualização visual em qualquer tela do sistema que estiver aberta
   */
  function notificarTelasDeAtualizacao() {
    try { if (typeof window.recarregarEfetivoComNovos === 'function') window.recarregarEfetivoComNovos(); } catch (e) {}
    try { if (typeof window.carregarEfetivoGeral === 'function') window.carregarEfetivoGeral(); } catch (e) {}
    try { if (typeof window.renderizarMuralPublico === 'function') window.renderizarMuralPublico(); } catch (e) {}
    try { if (typeof window.renderizarMural === 'function') window.renderizarMural(); } catch (e) {}
    try { if (typeof window.renderizarSoldadosCia === 'function') window.renderizarSoldadosCia(); } catch (e) {}
    try { if (typeof window.renderizarTabelaAlmocoAdmin === 'function') window.renderizarTabelaAlmocoAdmin(); } catch (e) {}
    try { if (typeof window.renderizarGridParticipantesModal === 'function') window.renderizarGridParticipantesModal(); } catch (e) {}
  }

  // Objeto Global CloudSync
  const CloudSync = {
    DEFAULT_TOPIC: DEFAULT_SYNC_TOPIC,

    /**
     * Obtém o tópico atual da nuvem
     */
    getTopic: function () {
      try {
        const salvo = localStorage.getItem(STORAGE_KEYS.TOPIC);
        return (salvo && salvo.trim()) ? salvo.trim() : DEFAULT_SYNC_TOPIC;
      } catch (e) {
        return DEFAULT_SYNC_TOPIC;
      }
    },

    /**
     * Altera o tópico da nuvem
     */
    setTopic: function (novoTopico) {
      try {
        if (!novoTopico || !novoTopico.trim()) {
          localStorage.removeItem(STORAGE_KEYS.TOPIC);
        } else {
          localStorage.setItem(STORAGE_KEYS.TOPIC, novoTopico.trim());
        }
      } catch (e) {}
      this.conectar();
      return this.getTopic();
    },

    /**
     * Reseta para o tópico oficial padrão
     */
    resetarTopicoPadrao: function () {
      try {
        localStorage.removeItem(STORAGE_KEYS.TOPIC);
      } catch (e) {}
      this.conectar();
      return DEFAULT_SYNC_TOPIC;
    },

    /**
     * Sinal Sonoro Harmonioso Militar com Web Audio API
     * (Nativo, sem arquivos de áudio externos, compatível com celular e PC)
     */
    tocarSino: function () {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const now = ctx.currentTime;

        // Tom 1: C5 (523.25 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now);
        gain1.gain.setValueAtTime(0.28, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // Tom 2: G5 (783.99 Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(783.99, now + 0.12);
        gain2.gain.setValueAtTime(0.32, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.65);
      } catch (e) {
        // Áudio bloqueado até interação do usuário no navegador mobile
      }
    },

    // ==========================================
    // FILA DE REENVIO OFFLINE (RESILIENTE)
    // ==========================================

    _obterFilaPendentes: function () {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.FILA_PENDENTES);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },

    _salvarFilaPendentes: function (fila) {
      try {
        localStorage.setItem(STORAGE_KEYS.FILA_PENDENTES, JSON.stringify(fila || []));
      } catch (e) {}
    },

    _enfileirarPendente: function (item) {
      if (!item || !item.payload) return;
      const fila = this._obterFilaPendentes();
      const existe = fila.find(p => p.idUnico === item.idUnico);
      if (!existe) {
        fila.push({
          idUnico: item.idUnico || ('sync_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)),
          titulo: item.titulo || 'Notificacao 5 BE',
          tags: item.tags || 'shield',
          prioridade: item.prioridade || 'urgent',
          payload: item.payload,
          tentativas: 0,
          adicionadoEm: Date.now()
        });
        this._salvarFilaPendentes(fila);
      }
    },

    _removerFilaPendente: function (idUnico) {
      if (!idUnico) return;
      const fila = this._obterFilaPendentes();
      const filtrada = fila.filter(p => p.idUnico !== idUnico);
      this._salvarFilaPendentes(filtrada);
    },

    _processarFilaPendentes: async function () {
      if (_processandoFila) return;
      const fila = this._obterFilaPendentes();
      if (!fila || fila.length === 0) return;

      _processandoFila = true;
      const topic = this.getTopic();

      for (let i = 0; i < fila.length; i++) {
        const item = fila[i];
        try {
          const res = await fetch(`https://ntfy.sh/${topic}`, {
            method: 'POST',
            headers: {
              'Title': toAsciiHeader(item.titulo),
              'Priority': item.prioridade || 'urgent',
              'Tags': item.tags || 'shield',
              'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(item.payload)
          });
          if (res.ok) {
            this._removerFilaPendente(item.idUnico);
          } else {
            item.tentativas = (item.tentativas || 0) + 1;
          }
        } catch (e) {
          // Permanece na fila para a próxima tentativa
          break;
        }
      }
      _processandoFila = false;
    },

    // ==========================================
    // TRANSMISSÕES PARA A NUVEM
    // ==========================================

    /**
     * Transmissão para a Nuvem de Novos Cadastros de Veteranos
     */
    enviarCadastro: async function (militar) {
      if (!militar) return { sucesso: false, erro: 'Sem dados' };
      const topic = this.getTopic();

      // Salva localmente primeiro
      this._salvarLocalCadastro(militar);

      const payload = {
        tipo: militar.isAtualizado ? 'ATUALIZACAO_CADASTRO' : 'NOVO_CADASTRO',
        registro: militar,
        timestamp: Date.now()
      };

      const tituloLimpo = toAsciiHeader(`Cadastro 5 BE: ${militar.nome || 'Veterano'} (${militar.cia || '5 BE'})`);
      const idUnico = 'cad_' + (militar.id || Date.now());

      // Adiciona na fila pendente de segurança
      this._enfileirarPendente({
        idUnico: idUnico,
        titulo: tituloLimpo,
        tags: 'shield,medal',
        prioridade: 'urgent',
        payload: payload
      });

      try {
        const res = await fetch(`https://ntfy.sh/${topic}`, {
          method: 'POST',
          headers: {
            'Title': tituloLimpo,
            'Priority': 'urgent',
            'Tags': 'shield,medal',
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          this._removerFilaPendente(idUnico);
          console.log('[CloudSync] Cadastro transmitido com sucesso:', militar.nome);
          this.atualizarStatusVisual('conectado', `Transmitido: ${militar.nome}`);
          return { sucesso: true };
        } else {
          console.warn('[CloudSync] Servidor retornou status:', res.status);
          return { sucesso: false, erro: 'Status ' + res.status };
        }
      } catch (err) {
        console.warn('[CloudSync] Falha imediata (item salvo na fila para reenvio):', err.message);
        return { sucesso: false, erro: err.message, pendenteNaFila: true };
      }
    },

    /**
     * Transmissão para a Nuvem de Adesões ao Almoço
     */
    enviarAlmoco: async function (itemAlmoco) {
      if (!itemAlmoco) return { sucesso: false, erro: 'Sem dados' };
      const topic = this.getTopic();

      // Salva localmente
      this._salvarLocalAlmoco(itemAlmoco);

      const payload = {
        tipo: 'NOVO_ALMOCO',
        item: itemAlmoco,
        timestamp: Date.now()
      };

      const tituloLimpo = toAsciiHeader(`Almoco 5 BE: ${itemAlmoco.nome || 'Participante'} (${itemAlmoco.qtd || 1} ref)`);
      const idUnico = 'alm_' + (itemAlmoco.id || Date.now());

      this._enfileirarPendente({
        idUnico: idUnico,
        titulo: tituloLimpo,
        tags: 'utensils,tada',
        prioridade: 'urgent',
        payload: payload
      });

      try {
        const res = await fetch(`https://ntfy.sh/${topic}`, {
          method: 'POST',
          headers: {
            'Title': tituloLimpo,
            'Priority': 'urgent',
            'Tags': 'utensils,tada',
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          this._removerFilaPendente(idUnico);
          console.log('[CloudSync] Adesão ao almoço transmitida:', itemAlmoco.nome);
          this.atualizarStatusVisual('conectado', `Almoço transmitido: ${itemAlmoco.nome}`);
          return { sucesso: true };
        } else {
          return { sucesso: false, erro: 'Status ' + res.status };
        }
      } catch (err) {
        console.warn('[CloudSync] Falha no almoço (salvo na fila):', err.message);
        return { sucesso: false, erro: err.message, pendenteNaFila: true };
      }
    },

    /**
     * Transmissão de Exclusão de Cadastro de Militar na Nuvem
     */
    excluirCadastro: async function (id) {
      if (!id) return;
      const topic = this.getTopic();
      const payload = { tipo: 'EXCLUIR_CADASTRO', id: id, timestamp: Date.now() };
      const tituloLimpo = toAsciiHeader(`Exclusao Cadastro: ${id}`);
      const idUnico = 'del_cad_' + id;

      this._enfileirarPendente({
        idUnico: idUnico,
        titulo: tituloLimpo,
        tags: 'wastebasket',
        prioridade: 'low',
        payload: payload
      });

      try {
        const res = await fetch(`https://ntfy.sh/${topic}`, {
          method: 'POST',
          headers: {
            'Title': tituloLimpo,
            'Priority': 'low',
            'Tags': 'wastebasket',
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          this._removerFilaPendente(idUnico);
          console.log('[CloudSync] Exclusão sincronizada na nuvem:', id);
        }
      } catch (err) {
        console.warn('[CloudSync] Falha ao excluir cadastro imediatamente:', err.message);
      }
    },

    /**
     * Transmissão de Exclusão de Inscrição de Almoço na Nuvem
     */
    excluirAlmoco: async function (id) {
      if (!id) return;
      const topic = this.getTopic();
      const payload = { tipo: 'EXCLUIR_ALMOCO', id: id, timestamp: Date.now() };
      const tituloLimpo = toAsciiHeader(`Exclusao Almoco: ${id}`);
      const idUnico = 'del_alm_' + id;

      this._enfileirarPendente({
        idUnico: idUnico,
        titulo: tituloLimpo,
        tags: 'wastebasket',
        prioridade: 'low',
        payload: payload
      });

      try {
        const res = await fetch(`https://ntfy.sh/${topic}`, {
          method: 'POST',
          headers: {
            'Title': tituloLimpo,
            'Priority': 'low',
            'Tags': 'wastebasket',
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          this._removerFilaPendente(idUnico);
          console.log('[CloudSync] Exclusão de almoço sincronizada na nuvem:', id);
        }
      } catch (err) {
        console.warn('[CloudSync] Falha ao excluir almoço imediatamente:', err.message);
      }
    },

    // ==========================================
    // HISTÓRICO & RECEBIMENTO DE DADOS
    // ==========================================

    /**
     * Puxa histórico recente da nuvem (24h de cache do ntfy público com fallback)
     */
    puxarHistorico: async function (silencioso = false) {
      const topic = this.getTopic();
      if (_sincronizando) return;
      _sincronizando = true;

      // Aproveita para tentar descarregar a fila pendente se houver conexão
      this._processarFilaPendentes().catch(() => {});

      try {
        // Tenta buscar as últimas 24h (limite máximo permitido no ntfy.sh público)
        let res = await fetch(`https://ntfy.sh/${topic}/json?poll=1&since=24h`);
        if (!res.ok) {
          // Se o servidor ntfy rejeitar o parâmetro since, tenta poll padrão
          res = await fetch(`https://ntfy.sh/${topic}/json?poll=1`);
        }

        if (!res.ok) {
          _sincronizando = false;
          return;
        }

        const text = await res.text();
        if (!text || !text.trim()) {
          _sincronizando = false;
          this.atualizarStatusVisual('conectado', 'Nuvem OK (sem pendências)');
          return;
        }

        const lines = text.trim().split('\n');
        let novosCadastros = 0;
        let novosAlmoco = 0;
        let alterados = 0;

        lines.forEach(line => {
          try {
            const item = JSON.parse(line);
            if (item.event === 'message' && item.message) {
              const payload = JSON.parse(item.message);
              const r = this._aplicarPayload(payload);
              if (r.tipo === 'cadastro' && r.isNovo) novosCadastros++;
              if (r.tipo === 'almoco' && r.isNovo) novosAlmoco++;
              if (r.alterado) alterados++;
            }
          } catch (e) {}
        });

        // Se houve novos cadastros ou alterações, notifica as telas
        if (novosCadastros > 0 || alterados > 0 || novosAlmoco > 0) {
          notificarTelasDeAtualizacao();

          if (!silencioso && (novosCadastros > 0 || novosAlmoco > 0)) {
            this.tocarSino();
            if (typeof window.mostrarNotificaçãoTatica === 'function') {
              window.mostrarNotificaçãoTatica(`🎉 ${novosCadastros + novosAlmoco} registro(s) sincronizados da nuvem!`);
            }
          }
        }

        try { localStorage.setItem(STORAGE_KEYS.ULTIMO_SYNC, Date.now().toString()); } catch (e) {}
        this.atualizarStatusVisual('conectado', 'Conectado em Tempo Real');
        _sincronizando = false;

        return {
          sucesso: true,
          novosCadastros: novosCadastros,
          novosAlmoco: novosAlmoco
        };

      } catch (err) {
        _sincronizando = false;
        console.warn('[CloudSync] Histórico offline ou indisponível:', err.message);
        this.atualizarStatusVisual('offline', 'Modo Local (Offline)');
      }
    },

    /**
     * Conecta EventSource em tempo real (SSE) + Heartbeat resiliente
     */
    conectar: function () {
      const topic = this.getTopic();

      if (cloudEventSource) {
        try { cloudEventSource.close(); } catch (e) {}
        cloudEventSource = null;
      }

      this.atualizarStatusVisual('conectando', 'Conectando à nuvem em tempo real...');

      // 1. Tenta descarregar fila pendente
      this._processarFilaPendentes().catch(() => {});

      // 2. Puxa histórico recente
      this.puxarHistorico(true);

      // 3. Conecta via Server-Sent Events (SSE) nativo
      if (typeof window !== 'undefined' && window.EventSource) {
        try {
          cloudEventSource = new window.EventSource(`https://ntfy.sh/${topic}/sse`);

          cloudEventSource.onopen = () => {
            this.atualizarStatusVisual('conectado', 'Conectado em Tempo Real (Nuvem Ativa)');
            this._processarFilaPendentes().catch(() => {});
          };

          cloudEventSource.onerror = () => {
            this.atualizarStatusVisual('conectando', 'Reconectando à nuvem...');
          };

          cloudEventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.event === 'message' && data.message) {
                const payload = JSON.parse(data.message);
                this._processarMensagemRealtime(payload);
              }
            } catch (e) {}
          };
        } catch (err) {
          console.warn('[CloudSync] EventSource bloqueado:', err.message);
        }
      }

      // 4. Heartbeat de segurança a cada 8 segundos (igual ao Biriba)
      if (cloudHeartbeatInterval) clearInterval(cloudHeartbeatInterval);
      cloudHeartbeatInterval = setInterval(() => {
        this.puxarHistorico(true);
      }, 8000);

      // 5. Reconexão e busca instantânea quando o usuário foca na aba
      if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            this.puxarHistorico(true);
            this._processarFilaPendentes().catch(() => {});
          }
        });
      }

      // 6. Reconexão quando a internet volta
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('online', () => {
          this.conectar();
          this.puxarHistorico(false);
        });
      }

      console.log(`[CloudSync] Nuvem ativa no tópico: ${topic}`);
    },

    /**
     * Interface de compatibilidade com métodos anteriores
     */
    sincronizarTudo: async function (opcoes) {
      const opt = opcoes || {};
      return await this.puxarHistorico(Boolean(opt.silencioso));
    },

    iniciarAutoSync: function () {
      this.conectar();
    },

    /**
     * Diagnóstico e teste de envio da nuvem
     */
    testarConexao: async function () {
      const topic = this.getTopic();
      try {
        const res = await fetch(`https://ntfy.sh/${topic}`, {
          method: 'POST',
          headers: {
            'Title': toAsciiHeader('Teste de Conexao 5 BE'),
            'Priority': 'low',
            'Tags': 'white_check_mark',
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify({ tipo: 'PING_TESTE', timestamp: Date.now() })
        });
        return { ok: res.ok, status: res.status };
      } catch (e) {
        return { ok: false, erro: e.message };
      }
    },

    /**
     * Atualiza os badges visuais de conexão na interface
     */
    atualizarStatusVisual: function (status, msg) {
      _ultimoStatus = status;
      _ultimaMensagem = msg || '';

      if (typeof document === 'undefined') return;

      // Badge no Navbar do Admin
      const iconeNav = document.getElementById('iconeNuvemNav');
      const labelNav = document.getElementById('labelNuvemNav');

      if (iconeNav) {
        iconeNav.className = 'w-2 h-2 rounded-full inline-block mr-1 ' + (
          status === 'conectado' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse' :
          status === 'conectando' ? 'bg-amber-400 animate-ping' :
          'bg-slate-400'
        );
      }

      if (labelNav) {
        labelNav.innerText = (
          status === 'conectado' ? 'Nuvem OK' :
          status === 'conectando' ? 'Sincronizando...' :
          'Offline'
        );
      }

      // Badge no Hub de Sincronização (caso exista na página)
      const badgeHub = document.getElementById('badgeStatusNuvem');
      const textoHub = document.getElementById('textoStatusNuvem');
      const pontoHub = document.getElementById('pontoStatusNuvem');

      if (badgeHub && textoHub) {
        if (status === 'conectado') {
          badgeHub.className = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 text-[11px] font-bold self-start sm:self-auto";
          if (pontoHub) pontoHub.className = "w-2 h-2 rounded-full bg-emerald-400 animate-pulse";
          textoHub.textContent = msg || "Conectado em Tempo Real";
        } else if (status === 'conectando') {
          badgeHub.className = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-600/70 text-amber-300 text-[11px] font-bold self-start sm:self-auto";
          if (pontoHub) pontoHub.className = "w-2 h-2 rounded-full bg-amber-400 animate-ping";
          textoHub.textContent = msg || "Sincronizando Nuvem...";
        } else {
          badgeHub.className = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-900 border border-gray-700 text-gray-400 text-[11px] font-bold self-start sm:self-auto";
          if (pontoHub) pontoHub.className = "w-2 h-2 rounded-full bg-gray-500";
          textoHub.textContent = msg || "Modo Local (Offline)";
        }
      }

      // Modal de Configuração se aberto
      const statusModalTxt = document.getElementById('modalNuvemStatusTxt');
      const statusModalBadge = document.getElementById('modalNuvemStatusBadge');
      if (statusModalTxt) statusModalTxt.innerText = _ultimaMensagem || 'Pronto';
      if (statusModalBadge) {
        statusModalBadge.className = 'px-2.5 py-1 rounded text-xs font-bold uppercase ' + (
          status === 'conectado' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60' :
          status === 'conectando' ? 'bg-amber-950 text-amber-300 border border-amber-500/60' :
          'bg-slate-900 text-slate-300 border border-slate-700'
        );
        statusModalBadge.innerText = (
          status === 'conectado' ? '🟢 Conectado em Tempo Real' :
          status === 'conectando' ? '🟡 Sincronizando...' :
          '⚪ Offline'
        );
      }
    },

    // ==========================================
    // MÉTODOS INTERNOS / PRIVADOS
    // ==========================================

    _processarMensagemRealtime: function (payload) {
      if (!payload || !payload.tipo) return;
      if (payload.tipo === 'PING_TESTE') return;

      const r = this._aplicarPayload(payload);

      if (r.tipo === 'cadastro') {
        notificarTelasDeAtualizacao();
        if (r.isNovo) {
          this.tocarSino();
          if (typeof window.mostrarNotificaçãoTatica === 'function') {
            window.mostrarNotificaçãoTatica(`🔔 NOVO VETERANO EM TEMPO REAL: ${payload.registro.nome} (${payload.registro.cia || ''})!`);
          }
        }
      } else if (r.tipo === 'almoco') {
        notificarTelasDeAtualizacao();
        if (r.isNovo) {
          this.tocarSino();
          if (typeof window.mostrarNotificaçãoTatica === 'function') {
            window.mostrarNotificaçãoTatica(`🍽️ ADESÃO AO ALMOÇO EM TEMPO REAL: ${payload.item.nome}!`);
          }
        }
      } else if (r.tipo === 'exclusao') {
        notificarTelasDeAtualizacao();
      }
    },

    _aplicarPayload: function (payload) {
      if (!payload || !payload.tipo) return { isNovo: false, alterado: false };

      // 1. Cadastros
      if (payload.tipo === 'NOVO_CADASTRO' || payload.tipo === 'ATUALIZACAO_CADASTRO') {
        const militar = payload.registro;
        if (!militar || !militar.nome) return { isNovo: false };

        let locais = [];
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.NOVOS_VETERANOS);
          if (raw) locais = JSON.parse(raw);
        } catch (e) { locais = []; }

        let excluidos = [];
        try {
          const rawE = localStorage.getItem(STORAGE_KEYS.EXCLUIDOS);
          if (rawE) excluidos = JSON.parse(rawE);
        } catch (e) { excluidos = []; }
        if (excluidos.map(String).includes(String(militar.id))) return { isNovo: false };

        let idx = locais.findIndex(l => String(l.id) === String(militar.id));
        if (idx === -1 && typeof window.encontrarMilitarExistente === 'function') {
          const match = window.encontrarMilitarExistente(locais, militar);
          if (match) idx = match.index;
        }

        if (idx !== -1) {
          locais[idx] = Object.assign({}, locais[idx], militar);
          try { localStorage.setItem(STORAGE_KEYS.NOVOS_VETERANOS, JSON.stringify(locais)); } catch (e) {}
          return { tipo: 'cadastro', isNovo: false, alterado: true };
        } else {
          militar.isNovo = true;
          locais.unshift(militar);
          try { localStorage.setItem(STORAGE_KEYS.NOVOS_VETERANOS, JSON.stringify(locais)); } catch (e) {}
          return { tipo: 'cadastro', isNovo: true, alterado: true };
        }
      }

      // 2. Almoço
      if (payload.tipo === 'NOVO_ALMOCO' || payload.tipo === 'ATUALIZAR_ALMOCO') {
        const item = payload.item;
        if (!item || !item.nome) return { isNovo: false };

        let locais = [];
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.ALMOCO);
          if (raw) locais = JSON.parse(raw);
        } catch (e) { locais = []; }

        const idx = locais.findIndex(l => String(l.id) === String(item.id));
        if (idx !== -1) {
          locais[idx] = Object.assign({}, locais[idx], item);
          try { localStorage.setItem(STORAGE_KEYS.ALMOCO, JSON.stringify(locais)); } catch (e) {}
          return { tipo: 'almoco', isNovo: false, alterado: true };
        } else {
          locais.unshift(item);
          try { localStorage.setItem(STORAGE_KEYS.ALMOCO, JSON.stringify(locais)); } catch (e) {}
          return { tipo: 'almoco', isNovo: true, alterado: true };
        }
      }

      // 3. Exclusão de Cadastro
      if (payload.tipo === 'EXCLUIR_CADASTRO' && payload.id) {
        let locais = [];
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.NOVOS_VETERANOS);
          if (raw) locais = JSON.parse(raw);
        } catch (e) { locais = []; }

        const novosFiltrados = locais.filter(l => String(l.id) !== String(payload.id));
        try { localStorage.setItem(STORAGE_KEYS.NOVOS_VETERANOS, JSON.stringify(novosFiltrados)); } catch (e) {}

        let excluidos = [];
        try {
          const rawE = localStorage.getItem(STORAGE_KEYS.EXCLUIDOS);
          if (rawE) excluidos = JSON.parse(rawE);
        } catch (e) { excluidos = []; }
        if (!excluidos.map(String).includes(String(payload.id))) {
          excluidos.push(payload.id);
          try { localStorage.setItem(STORAGE_KEYS.EXCLUIDOS, JSON.stringify(excluidos)); } catch (e) {}
        }

        return { tipo: 'exclusao', alterado: true };
      }

      // 4. Exclusão de Almoço
      if (payload.tipo === 'EXCLUIR_ALMOCO' && payload.id) {
        let locais = [];
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.ALMOCO);
          if (raw) locais = JSON.parse(raw);
        } catch (e) { locais = []; }

        const listaFiltrada = locais.filter(l => String(l.id) !== String(payload.id));
        try { localStorage.setItem(STORAGE_KEYS.ALMOCO, JSON.stringify(listaFiltrada)); } catch (e) {}
        return { tipo: 'exclusao', alterado: true };
      }

      return { isNovo: false, alterado: false };
    },

    _salvarLocalCadastro: function (militar) {
      try {
        let locais = [];
        const raw = localStorage.getItem(STORAGE_KEYS.NOVOS_VETERANOS);
        if (raw) locais = JSON.parse(raw);
        const idx = locais.findIndex(l => String(l.id) === String(militar.id));
        if (idx !== -1) {
          locais[idx] = Object.assign({}, locais[idx], militar);
        } else {
          locais.unshift(militar);
        }
        localStorage.setItem(STORAGE_KEYS.NOVOS_VETERANOS, JSON.stringify(locais));
      } catch (e) {}
    },

    _salvarLocalAlmoco: function (item) {
      try {
        let locais = [];
        const raw = localStorage.getItem(STORAGE_KEYS.ALMOCO);
        if (raw) locais = JSON.parse(raw);
        const idx = locais.findIndex(l => String(l.id) === String(item.id));
        if (idx !== -1) {
          locais[idx] = Object.assign({}, locais[idx], item);
        } else {
          locais.unshift(item);
        }
        localStorage.setItem(STORAGE_KEYS.ALMOCO, JSON.stringify(locais));
      } catch (e) {}
    }
  };

  // Expõe no escopo global
  window.CloudSync = CloudSync;

  // Inicializa imediatamente ao carregar o script
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CloudSync.conectar());
  } else {
    CloudSync.conectar();
  }

})(window);
