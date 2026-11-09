// ========================================================
// PWA HELPER: Registro de Service Worker e Instalação
// Aplicativo Veteranos 5º BE - Batalhão Juarez Távora
// ========================================================

let deferredInstallPrompt = null;

// 1. Registro do Service Worker para suporte Offline e PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('🎖️ PWA: Service Worker registrado com sucesso:', reg.scope);
      })
      .catch(err => {
        console.warn('PWA: Falha ao registrar Service Worker:', err);
      });
  });
}

// 2. Captura do evento de instalação (Chrome, Edge, Android)
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  atualizarBotoesInstalacao(true);
});

// 3. Detecta quando o App é instalado
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  atualizarBotoesInstalacao(false);
  mostrarNotificacaoPWA("🎖️ Aplicativo Veteranos 5º BE instalado com sucesso!");
});

// 4. Verifica se já está rodando como App Independente (Standalone)
function isPWAStandalone() {
  try {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.navigator && window.navigator.standalone === true) return true;
    if (typeof document !== 'undefined' && document.referrer && typeof document.referrer === 'string' && document.referrer.includes('android-app://')) return true;
    return false;
  } catch (e) {
    return false;
  }
}

// 5. Atualiza botões de instalação na interface
function atualizarBotoesInstalacao(visivel) {
  const btns = document.querySelectorAll('.btn-instalar-app');
  const ehStandalone = isPWAStandalone();

  btns.forEach(btn => {
    if (ehStandalone) {
      btn.classList.add('hidden');
    } else {
      btn.classList.remove('hidden');
    }
  });
}

// 6. Função disparada ao clicar no botão "Instalar App"
function acionarInstalacaoApp() {
  // Se tiver o prompt nativo (Android, Edge, Chrome)
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then(choiceResult => {
      if (choiceResult.outcome === 'accepted') {
        mostrarNotificacaoPWA("Instalando o aplicativo no seu dispositivo...");
      }
      deferredInstallPrompt = null;
    });
    return;
  }

  // Detecta se é iPhone/iPad (iOS)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS) {
    abrirModalInstrucoesIOS();
    return;
  }

  // Outros navegadores / Desktop já instalado ou sem suporte direto
  abrirModalInstrucoesGeral();
}

// 7. Modal de Instruções para iPhone / iOS
function abrirModalInstrucoesIOS() {
  let modal = document.getElementById('modalInstrucoesIOS');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalInstrucoesIOS';
    modal.className = 'fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-[#111e13] max-w-sm w-full rounded-2xl overflow-hidden border border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.3)] text-xs text-slate-200">
        <div class="bg-[#172b1a] p-4 border-b border-[#254228] flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="text-xl">📲</span>
            <h3 class="font-bold text-white military-font uppercase">Instalar no iPhone / iPad</h3>
          </div>
          <button onclick="document.getElementById('modalInstrucoesIOS').remove()" class="text-slate-400 hover:text-white p-1">
            <i class="fa-solid fa-xmark text-base"></i>
          </button>
        </div>
        <div class="p-5 space-y-3.5 leading-relaxed">
          <p class="text-slate-300">
            Para instalar o aplicativo dos Veteranos do 5º BE no seu iPhone, siga estes 2 passos no Safari:
          </p>
          <div class="p-3 bg-[#0a120c] rounded-xl border border-[#213a25] space-y-2">
            <div class="flex items-start space-x-2.5">
              <span class="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold rounded text-[11px]">1</span>
              <span>Toque no botão <strong>Compartilhar</strong> (ícone com quadrado e seta para cima <i class="fa-solid fa-arrow-up-from-bracket text-amber-400"></i>) na barra inferior do Safari.</span>
            </div>
            <div class="flex items-start space-x-2.5">
              <span class="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold rounded text-[11px]">2</span>
              <span>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.</span>
            </div>
          </div>
          <p class="text-[11px] text-emerald-400 font-bold text-center">
            Pronto! O ícone do 5º BE ficará salvo junto com seus outros aplicativos!
          </p>
          <button onclick="document.getElementById('modalInstrucoesIOS').remove()" 
                  class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold rounded-lg military-font uppercase text-xs">
            Entendido
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

// 8. Modal de Instruções para Computador e outros dispositivos
function abrirModalInstrucoesGeral() {
  let modal = document.getElementById('modalInstrucoesGeral');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalInstrucoesGeral';
    modal.className = 'fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-[#111e13] max-w-sm w-full rounded-2xl overflow-hidden border border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.3)] text-xs text-slate-200">
        <div class="bg-[#172b1a] p-4 border-b border-[#254228] flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="text-xl">💻</span>
            <h3 class="font-bold text-white military-font uppercase">Instalar no Computador / Celular</h3>
          </div>
          <button onclick="document.getElementById('modalInstrucoesGeral').remove()" class="text-slate-400 hover:text-white p-1">
            <i class="fa-solid fa-xmark text-base"></i>
          </button>
        </div>
        <div class="p-5 space-y-3.5 leading-relaxed">
          <p class="text-slate-300">
            Você pode instalar este aplicativo nativamente no seu computador ou celular:
          </p>
          <div class="p-3 bg-[#0a120c] rounded-xl border border-[#213a25] space-y-2 text-[11px]">
            <div>
              <strong class="text-amber-400 block mb-0.5">🖥️ No Computador (Chrome ou Edge):</strong>
              Clique no ícone de <strong>Instalar</strong> que aparece no final da barra de endereço do navegador (ao lado da estrela de favoritos) ou use o arquivo <code>ABRIR_APP_DESKTOP.bat</code> na pasta.
            </div>
            <div class="pt-1 border-t border-[#18291b]">
              <strong class="text-emerald-400 block mb-0.5">📱 No Celular (Android):</strong>
              Toque nos 3 pontinhos do Chrome e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
            </div>
          </div>
          <button onclick="document.getElementById('modalInstrucoesGeral').remove()" 
                  class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold rounded-lg military-font uppercase text-xs">
            Entendido
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

// 9. Toast Notificação PWA
function mostrarNotificacaoPWA(texto) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-5 right-5 z-50 bg-[#142617] border border-amber-400 text-slate-100 text-xs py-3 px-4 rounded-xl shadow-2xl flex items-center space-x-2';
  toast.innerHTML = `<i class="fa-solid fa-mobile-screen text-amber-400 text-base"></i><span>${texto}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease';
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

// Inicializa verificação ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
  atualizarBotoesInstalacao(!isPWAStandalone());
});
