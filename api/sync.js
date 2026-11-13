/**
 * SISTEMA DOS VETERANOS 5º BE CMB BLD - BATALHÃO JUAREZ TÁVORA
 * VERCEL SERVERLESS SYNC ENDPOINT (/api/sync)
 * 
 * Sincroniza em nuvem quando hospedado no Vercel.
 * Se houver variável de ambiente GOOGLE_SHEET_URL ou FIREBASE_URL,
 * repassa para o backend em nuvem com alta disponibilidade.
 */

// Cache em memória durante o ciclo de vida das lambdas quentes
let cacheMemoria = {
  cadastros: [],
  almoco: [],
  ultimoUpdate: Date.now()
};

export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const cloudUrl = process.env.GOOGLE_SHEET_URL || process.env.FIREBASE_URL;

  // Se houver backend externo configurado nas variáveis do Vercel, atua como proxy seguro
  if (cloudUrl) {
    try {
      if (req.method === 'GET') {
        const resp = await fetch(cloudUrl, { redirect: 'follow' });
        const data = await resp.json();
        return res.status(200).json(data);
      } else {
        const resp = await fetch(cloudUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(req.body || {}),
          redirect: 'follow'
        });
        const data = await resp.json();
        return res.status(200).json(data);
      }
    } catch (e) {
      console.error('[API Proxy Error]', e);
    }
  }

  // Fallback nativo do Vercel (armazena em memória)
  if (req.method === 'GET') {
    return res.status(200).json({
      sucesso: true,
      origem: 'vercel_in_memory',
      cadastros: cacheMemoria.cadastros,
      almoco: cacheMemoria.almoco,
      totalCadastros: cacheMemoria.cadastros.length,
      totalAlmoco: cacheMemoria.almoco.length,
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    let payload = req.body;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch(e){}
    }
    payload = payload || {};

    const acao = payload.acao || payload.tipo;
    const item = payload.dados || payload;

    if (acao === 'salvar_cadastro' || payload.tipo === 'cadastro') {
      if (item && item.nome) {
        const idx = cacheMemoria.cadastros.findIndex(c => String(c.id) === String(item.id));
        if (idx !== -1) {
          cacheMemoria.cadastros[idx] = Object.assign({}, cacheMemoria.cadastros[idx], item);
        } else {
          cacheMemoria.cadastros.unshift(item);
        }
        cacheMemoria.ultimoUpdate = Date.now();
      }
      return res.status(200).json({ sucesso: true, mensagem: 'Cadastro salvo!', item: item });
    }

    if (acao === 'salvar_almoco' || payload.tipo === 'almoco') {
      if (item && item.nome) {
        const idx = cacheMemoria.almoco.findIndex(a => String(a.id) === String(item.id));
        if (idx !== -1) {
          cacheMemoria.almoco[idx] = Object.assign({}, cacheMemoria.almoco[idx], item);
        } else {
          cacheMemoria.almoco.unshift(item);
        }
        cacheMemoria.ultimoUpdate = Date.now();
      }
      return res.status(200).json({ sucesso: true, mensagem: 'Almoço salvo!', item: item });
    }

    if (acao === 'excluir_cadastro') {
      cacheMemoria.cadastros = cacheMemoria.cadastros.filter(c => String(c.id) !== String(payload.id));
      return res.status(200).json({ sucesso: true, mensagem: 'Cadastro excluído.' });
    }

    if (acao === 'excluir_almoco') {
      cacheMemoria.almoco = cacheMemoria.almoco.filter(a => String(a.id) !== String(payload.id));
      return res.status(200).json({ sucesso: true, mensagem: 'Almoço excluído.' });
    }

    return res.status(200).json({ sucesso: true, mensagem: 'OK' });
  }

  return res.status(405).json({ erro: 'Método não permitido' });
}
