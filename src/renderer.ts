function nav(pageId: string) {
  document.querySelectorAll('.page-section').forEach(el => {
    el.classList.add('hidden');
  });
  const currentSection = document.getElementById(`page-${pageId}`);
  if(currentSection) {
    currentSection.classList.remove('hidden');
  }
  
  const titles: Record<string, string> = {
    'home': 'Início',
    'consultar': 'Consultar Documentos',
    'inserir': 'Inserir Novo Documento',
    'setores': 'Gerenciar Setores'
  };
  
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) pageTitle.innerText = titles[pageId] || '';

  if (pageId === 'setores') loadSetores();
  if (pageId === 'inserir') loadSetoresSelect();
  if (pageId === 'consultar') {
     loadSetoresFilter();
     loadDocs(null);
  }
}

// ----------------- Setores -------------------
async function loadSetores() {
  const setores = await window.api.getSetores();
  const tbody = document.getElementById('setores-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  setores.forEach((s: any) => {
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 transition-colors group";
    tr.innerHTML = `
      <td class="p-4 text-slate-500 font-mono text-sm">${s.IDsetor}</td>
      <td class="p-4 font-medium text-slate-800">${s.NomeSetor}</td>
      <td class="p-4 text-right">
        <button class="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50" onclick="deleteSetor(${s.IDsetor})" title="Excluir">
          <span class="material-icons text-sm">delete</span>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById('add-setor-form')?.addEventListener('submit', async (e: Event) => {
  e.preventDefault();
  const input = document.getElementById('novo-setor') as HTMLInputElement;
  if(!input.value.trim()) return;
  
  try {
    await window.api.addSetor(input.value.trim());
    input.value = '';
    loadSetores();
  } catch (e: any) {
    alert("Erro ao adicionar setor: " + e.message);
  }
});

async function deleteSetor(id: number) {
  if (confirm('Tem certeza? Documentos vinculados a este setor podem perder a referência.')) {
    try {
      await window.api.deleteSetor(id);
      loadSetores();
    } catch(e: any) {
      alert("Erro ao excluir setor: " + e.message);
    }
  }
}

// ----------------- Insert Doc -------------------
async function loadSetoresSelect() {
  const setores = await window.api.getSetores();
  const select = document.getElementById('doc-setor') as HTMLSelectElement;
  if (!select) return;

  select.innerHTML = '<option value="" disabled selected>Selecione um setor...</option>';
  setores.forEach((s: any) => {
    const opt = document.createElement('option');
    opt.value = s.IDsetor;
    opt.innerText = s.NomeSetor;
    select.appendChild(opt);
  });
}

async function selectPdf() {
  try {
    const path = await window.api.selectFile();
    if (path) {
      const pathInput = document.getElementById('doc-file-path') as HTMLInputElement;
      if (pathInput) pathInput.value = path;
    }
  } catch(e) {
    console.error(e);
  }
}

document.getElementById('insert-form')?.addEventListener('submit', async (e: Event) => {
  e.preventDefault();
  const titulo = (document.getElementById('doc-titulo') as HTMLInputElement).value.trim();
  const setor = (document.getElementById('doc-setor') as HTMLSelectElement).value;
  const filepath = (document.getElementById('doc-file-path') as HTMLInputElement).value;
  
  if (!filepath) return alert('Selecione um arquivo PDF!');
  if (!setor) return alert('Selecione um setor válido!');
  if (!titulo) return alert('Informe o título do documento!');
  
  const submitBtn = (e.target as HTMLElement).querySelector('button[type="submit"]') as HTMLButtonElement;
  const orgText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<span class="material-icons animate-spin">autorenew</span> Salvando...';
  submitBtn.disabled = true;

  try {
    await window.api.addDoc(titulo, filepath, setor);
    alert('Documento adicionado com sucesso!');
    (e.target as HTMLFormElement).reset();
  } catch (err: any) {
    alert('Erro ao salvar documento: ' + err.message);
  } finally {
    submitBtn.innerHTML = orgText;
    submitBtn.disabled = false;
  }
});

// ----------------- Consult Doc -------------------
let currentFilter: number | null = null;

async function loadSetoresFilter() {
  const setores = await window.api.getSetores();
  const list = document.getElementById('filter-setores-list');
  if (!list) return;

  const createLi = (id: number | null, nome: string, icon: string) => {
    const li = document.createElement('li');
    const isSelected = currentFilter === id;
    
    li.className = `cursor-pointer px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
      isSelected 
      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100' 
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
    }`;
    
    li.innerHTML = `<span class="material-icons ${isSelected ? 'text-blue-500' : 'text-slate-400'}">${icon}</span> ${nome}`;
    li.onclick = () => {
      currentFilter = id;
      loadSetoresFilter(); // refresh selected state
      loadDocs(id);
    };
    return li;
  };

  list.innerHTML = '';
  list.appendChild(createLi(null, 'Todos os Documentos', 'apps'));
  
  setores.forEach((s: any) => {
    list.appendChild(createLi(s.IDsetor, s.NomeSetor, 'folder'));
  });
}

async function loadDocs(setorId: number | null) {
  try {
    const docs = await window.api.getDocs(setorId);
    const tbody = document.getElementById('docs-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    if (docs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500">Nenhum documento encontrado.</td></tr>`;
      return;
    }
    
    docs.forEach((d: any) => {
      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-50 transition-colors group";
      tr.innerHTML = `
        <td class="p-4 text-slate-500 font-mono text-sm">${d.IDdoc}</td>
        <td class="p-4 font-semibold text-slate-800 flex items-center gap-2">
          <span class="material-icons text-red-500 text-lg">picture_as_pdf</span>
          ${d.TituloDoc}
        </td>
        <td class="p-4 text-slate-600">
          <span class="bg-slate-100 px-3 py-1 rounded-full text-xs font-medium">${d.NomeSetor || 'N/A'}</span>
        </td>
        <td class="p-4">
          <span class="flex w-fit items-center gap-1 px-3 py-1 border rounded-full text-xs font-bold uppercase tracking-wider ${d.EstadoDoc === 'Ativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}">
            <span class="w-1.5 h-1.5 rounded-full ${d.EstadoDoc === 'Ativo' ? 'bg-emerald-500' : 'bg-red-500'}"></span> ${d.EstadoDoc}
          </span>
        </td>
        <td class="p-4 text-right flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onclick="toggleDocStatus(${d.IDdoc}, '${d.EstadoDoc}')" class="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Alternar Status">
            <span class="material-icons text-sm">swap_horiz</span>
          </button>
          <button onclick="viewDoc(${d.IDdoc})" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Visualizar">
            <span class="material-icons text-sm">visibility</span>
          </button>
          <button onclick="downloadDoc(${d.IDdoc}, '${d.TituloDoc.replace(/'/g, "\\'")}')" class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Baixar Original">
            <span class="material-icons text-sm">download</span>
          </button>
          <button onclick="deleteDoc(${d.IDdoc})" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir Definitivamente">
            <span class="material-icons text-sm">delete_forever</span>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch(e) {
    console.error("Erro ao carregar documentos:", e);
  }
}

// Global exposure inside renderer for inline HTML event handlers (onclick="viewDoc()")
(window as any).nav = nav;
(window as any).deleteSetor = deleteSetor;
(window as any).selectPdf = selectPdf;
(window as any).viewDoc = async (id: number) => {
  try {
    const tempPath = await window.api.getDocFile(id);
    await window.api.openFile(tempPath);
  } catch (err: any) {
    alert('Erro ao visualizar arquivo: ' + err.message);
  }
};
(window as any).downloadDoc = async (id: number, titulo: string) => {
  try {
    const destPath = await window.api.saveFileDialog(titulo);
    if (destPath) {
       await window.api.saveFileBuffer(destPath, id);
       alert('Documento salvo com sucesso em ' + destPath);
    }
  } catch(err: any) {
    alert('Erro ao baixar documento: ' + err.message);
  }
};
(window as any).deleteDoc = async (id: number) => {
  if (confirm('Excluir documento permanentemente? Esta ação não pode ser desfeita.')) {
    try {
      await window.api.deleteDoc(id);
      loadDocs(currentFilter);
    } catch(err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  }
};
(window as any).toggleDocStatus = async (id: number, currentStatus: string) => {
  try {
    await window.api.toggleDocStatus(id, currentStatus);
    loadDocs(currentFilter);
  } catch(err: any) {
    alert('Erro ao alternar status: ' + err.message);
  }
};

// Initialize application
window.addEventListener('DOMContentLoaded', () => {
  nav('home');
});
