/**
 * SISTEMA DOS VETERANOS 5º BE CMB BLD - BATALHÃO JUAREZ TÁVORA
 * MOTOR DE SINCRONIZAÇÃO EM NUVEM AUTOMÁTICA EM TEMPO REAL
 * 
 * Baseado na mesma arquitetura do Simulador Biriba:
 * - Tecnologia: ntfy.sh (Pub/Sub mundial via SSE EventSource + HTTP)
 * - 100% Compatível com GitHub Pages e celulares/computadores
 * - Sem dependência de Vercel ou servidores backend proprietários
 * - Notificações sonoras militares harmônicas nativas (Web Audio API)
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
    ULTIMO_SYNC: 'veteranos_5be_ultimo_sync'
  };

  let cloudEventSource = null;
  let cloudHeartbeatInterval = null;
  let _sincronizando = false;
  let _ultimoStatus = 'conectando'; // 'conectado' | 'conectando' | 'offline'
  let _ultimaMensagem = 'Iniciando nuvem em tempo real...';

  // Objeto Global CloudSync
  const CloudSync = {
    DEFAULT_TOPIC: DEFAULT_SYNC_TOPIC,

    /**
     * Obtém o tópico atual da nuvem
     */
    getTopic: function () {
      const salvo = localStorage.getItem(STORAGE_KEYS.TOPIC);
      return (salvo && salvo.trim()) ? salvo.trim() : DEFAULT_SYNC_TOPIC;
    },

    /**
     * Altera o tópico da nuvem
     */
    setTopic: function (novoTopico) {
      if (!novoTopico || !novoTopico.trim()) {
        localStorage.removeItem(STORAGE_KEYS.TOPIC);
      } else {
        localStorage.setItem(STORAGE_KEYS.TOPIC, novoTopico.trim());
      }
      this.conectar();
      return this.getTopic();
    },

    /**
     * Reseta para o tópico oficial padrão
     */
    resetarTopicoPadrao: function () {
      localStorage.removeItem(STORAGE_KEYS.TOPIC);
      this.conectar();
      return DEFAULT_SYNC_TOPIC;
    },

    /**
     * Sinal Sonoro Harmonioso Militar com Web Audio API
     * (Nativo, sem arquivos de áudio externos, funciona em qualquer celular e PC)
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
        console.warn("[CloudSync] Áudio bloqueado pelo navegador até interação do usuário:", e);
      }
    },

    /**
     * Transmissão para a Nuvem de Novos Cadastros de Veteranos
     */
    enviarCadastro: async function (militar) {
      if (!militar) return { sucesso: false, erro: 'Sem dados' };
      const topic = this.getTopic();

      // Salva localmente primeiro
      this._salvarLocalCadastro(militar);

      try {
        await fetch(`https://ntfy.sh/${topic}`, {
          method: 'POST',
          headers: {
            'Title': `🎖️ Cadastro 5º BE: ${militar.nome} (${militar.cia || 'Veterano'})`,
            'Priority': 'urgent',
            'Tags': 'shield,medal,military_helmet'
          },
          body: JSON.stringify({
            tipo: militar.isAtualizado ? 'ATUALIZACAO_CADASTRO' : 'NOVO_CADASTRO',
            registro: militar,
            timestamp: Date.now()
          })
        });
        console.log('[CloudSync] Cadastro transmitido para a nuvem:', militar.nome);
        this.atualizarStatusVisual('conectado', `Transmitido: ${militar.nome}`);
        return { sucesso: true };
      } catch (err) {
        console.warn('[CloudSync] Falha ao transmitir cadastro imediatamente:', err);
        return { sucesso: false, erro: err.message };
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

      try {
        await fetch(`https://ntfy.sh/${topic}`, {
          method: 'POST',
          headers: {
            'Title': `🍽️ Almoço 5º BE: ${itemAlmoco.nome} (${itemAlmoco.qtd} ref)`,
            'Priority': 'urgent',
            'Tags': 'utensils,tada,dollar'
          },
          body: JSON.stringify({
            tipo: 'NOVO_ALMOCO',
            item: itemAlmoco,
            timestamp: Date.now()
          })
        });
        console.log('[CloudSync] Adesão ao almoço transmitida para a nuvem:', itemAlmoco.nome);
        this.atualizarStatusVisual('conectado', `Almoço transmitido: ${itemAlmoco.nome}`);
        return { sucesso: true };
      } catch (err) {
        console.warn('[CloudSync] Falha ao transmitir adesão do almoço:', err);
        return { sucesso: false, erro: err.message };
      }
    },

    /**
     * Transmissão de Exclusão de Cadastro de Militar na Nuvem
     */
    excluirCadastro: async function (id) {
      if (!id) return;
      const topic = this.getTopic();
      try {
        await fetch(`https://ntfy.sh/${topic}`, {
          method: 'POST',
          headers: {
            'Priority': 'low',
            'Tags': 'wastebasket'
          },
          body: JSON.stringify({
            tipo: 'EXCLUIR_CADASTRO',
            id: id,
            timestamp: Date.now()
          })
        });
        console.log('[CloudSync] Exclusão de cadastro sincronizada na nuvem:', id);
      } catch (err) {
        console.warn('[CloudSync] Falha ao enviar exclusão para a nuvem:', err);
      }
    },

    /**
     * Transmissão de Exclusão de Inscrição de Almoço na Nuvem
     */
    excluirAlmoco: async function (id) {
      if (!id) return;
      const topic = this.getTopic();
      try {
        await fetch(`https://ntfy.sh/${topic}`, {
          method: 'POST',
          headers: {
            'Priority': 'low',
            'Tags': 'wastebasket'
          },
          body: JSON.stringify({
            tipo: 'EXCLUIR_ALMOCO',
            id: id,
            timestamp: Date.now()
          })
        });
        console.log('[CloudSync] Exclusão de almoço sincronizada na nuvem:', id);
      } catch (err) {
        console.warn('[CloudSync] Falha ao enviar exclusão de almoço para a nuvem:', err);
      }
    },

    /**
     * Puxa histórico recente da nuvem (últimos 30 dias de mensagens persistidas)
     */
    puxarHistorico: async function (silencioso = false) {
      const topic = this.getTopic();
      if (_sincronizando) return;
      _sincronizando = true;

      try {
        const res = await fetch(`https://ntfy.sh/${topic}/json?poll=1&since=30d`);
        if (!res.ok) {
          _sincronizando = false;
          return;
        }

        const text = await res.text();
        if (!text || !text.trim()) {
          _sincronizando = false;
          this.atualizarStatusVisual('conectado', 'Nuvem sincronizada (sem pendências)');
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

        // Atualiza a tela se houve alterações
        if (novosCadastros > 0 || alterados > 0 || novosAlmoco > 0) {
          if (typeof window.recarregarEfetivoComNovos === 'function') {
            window.recarregarEfetivoComNovos();
          }
          if (typeof window.renderizarTabelaAlmocoAdmin === 'function') {
            window.renderizarTabelaAlmocoAdmin();
          }
          if (typeof window.renderizarGridParticipantesModal === 'function') {
            window.renderizarGridParticipantesModal();
          }
          if (typeof window.renderizarMuralPublico === 'function') {
            window.renderizarMuralPublico();
          }

          if (!silencioso && (novosCadastros > 0 || novosAlmoco > 0)) {
            this.tocarSino();
            if (typeof window.mostrarNotificaçãoTatica === 'function') {
              window.mostrarNotificaçãoTatica(`🎉 ${novosCadastros} novo(s) veterano(s) sincronizados da nuvem!`);
            }
          }
        }

        localStorage.setItem(STORAGE_KEYS.ULTIMO_SYNC, Date.now().toString());
        this.atualizarStatusVisual('conectado', 'Conectado em Tempo Real');
        _sincronizando = false;

        return {
          sucesso: true,
          novosCadastros: novosCadastros,
          novosAlmoco: novosAlmoco
        };

      } catch (err) {
        _sincronizando = false;
        console.warn('[CloudSync] Erro no polling de histórico da nuvem:', err);
        this.atualizarStatusVisual('offline', 'Modo Local (Offline)');
      }
    },

    /**
     * Conecta EventSource em tempo real (SSE) + Polling de segurança
     */
    conectar: function () {
      const topic = this.getTopic();

      if (cloudEventSource) {
        try { cloudEventSource.close(); } catch (e) {}
      }

      this.atualizarStatusVisual('conectando', 'Conectando à nuvem em tempo real...');

      // 1. Puxa histórico recente
      this.puxarHistorico(true);

      // 2. Conecta via Server-Sent Events (SSE) nativo
      if (typeof window !== 'undefined' && window.EventSource) {
        try {
          cloudEventSource = new window.EventSource(`https://ntfy.sh/${topic}/sse`);

          cloudEventSource.onopen = () => {
            this.atualizarStatusVisual('conectado', 'Conectado em Tempo Real (Nuvem Ativa)');
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
          console.warn('[CloudSync] EventSource bloqueado ou não suportado:', err);
        }
      }

      // 3. Heartbeat de segurança a cada 8 segundos (igual ao Biriba)
      if (cloudHeartbeatInterval) clearInterval(cloudHeartbeatInterval);
      cloudHeartbeatInterval = setInterval(() => {
        this.puxarHistorico(true);
      }, 8000);

      // 4. Reconexão e busca instantânea quando o usuário foca na aba
      if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            this.puxarHistorico(true);
          }
        });
      }

      // 5. Reconexão quando a internet volta
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
     * Atualiza os badges visuais de conexão na interface
     */
    atualizarStatusVisual: function (status, msg) {
      _ultimoStatus = status;
      _ultimaMensagem = msg || '';

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
      const r = this._aplicarPayload(payload);

      if (r.tipo === 'cadastro') {
        if (typeof window.recarregarEfetivoComNovos === 'function') {
          window.recarregarEfetivoComNovos();
        }
        if (typeof window.renderizarMuralPublico === 'function') {
          window.renderizarMuralPublico();
        }
        if (r.isNovo) {
          this.tocarSino();
          if (typeof window.mostrarNotificaçãoTatica === 'function') {
            window.mostrarNotificaçãoTatica(`🔔 NOVO VETERANO EM TEMPO REAL: ${payload.registro.nome} (${payload.registro.cia || ''})!`);
          }
        }
      } else if (r.tipo === 'almoco') {
        if (typeof window.renderizarTabelaAlmocoAdmin === 'function') {
          window.renderizarTabelaAlmocoAdmin();
        }
        if (typeof window.renderizarGridParticipantesModal === 'function') {
          window.renderizarGridParticipantesModal();
        }
        if (r.isNovo) {
          this.tocarSino();
          if (typeof window.mostrarNotificaçãoTatica === 'function') {
            window.mostrarNotificaçãoTatica(`🍽️ ADESÃO AO ALMOÇO EM TEMPO REAL: ${payload.item.nome}!`);
          }
        }
      } else if (r.tipo === 'exclusao') {
        if (typeof window.recarregarEfetivoComNovos === 'function') {
          window.recarregarEfetivoComNovos();
        }
        if (typeof window.renderizarTabelaAlmocoAdmin === 'function') {
          window.renderizarTabelaAlmocoAdmin();
        }
        if (typeof window.renderizarGridParticipantesModal === 'function') {
          window.renderizarGridParticipantesModal();
        }
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
