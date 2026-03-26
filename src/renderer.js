function nav(pageId) {
  document.querySelectorAll('.page-section').forEach(el => {
    el.classList.add('hidden');
  });
  const currentSection = document.getElementById(`page-${pageId}`);
  if(currentSection) {
    currentSection.classList.remove('hidden');
  }
  
  const titles = {
    'home': 'Início',
    'consultar': 'Consultar Documentos',
    'inserir': 'Inserir Novo Documento',
    'setores': 'Gerenciar Setores'
  };
  document.getElementById('page-title').innerText = titles[pageId];

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
  tbody.innerHTML = '';
  setores.forEach(s => {
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

document.getElementById('add-setor-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('novo-setor');
  if(!input.value.trim()) return;
  
  try {
    await window.api.addSetor(input.value.trim());
    input.value = '';
    loadSetores();
  } catch (e) {
    alert("Erro ao adicionar setor: " + e.message);
  }
});

async function deleteSetor(id) {
  if (confirm('Tem certeza? Documentos vinculados a este setor podem perder a referência.')) {
    try {
      await window.api.deleteSetor(id);
      loadSetores();
    } catch(e) {
      alert("Erro ao excluir setor: " + e.message);
    }
  }
}

// ----------------- Insert Doc -------------------
async function loadSetoresSelect() {
  const setores = await window.api.getSetores();
  const select = document.getElementById('doc-setor');
  select.innerHTML = '<option value="" disabled selected>Selecione um setor...</option>';
  setores.forEach(s => {
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
      document.getElementById('doc-file-path').value = path;
    }
  } catch(e) {
    console.error(e);
  }
}

document.getElementById('insert-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const titulo = document.getElementById('doc-titulo').value.trim();
  const setor = document.getElementById('doc-setor').value;
  const filepath = document.getElementById('doc-file-path').value;
  
  if (!filepath) return alert('Selecione um arquivo PDF!');
  if (!setor) return alert('Selecione um setor válido!');
  if (!titulo) return alert('Informe o título do documento!');
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const orgText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<span class="material-icons animate-spin">autorenew</span> Salvando...';
  submitBtn.disabled = true;

  try {
    await window.api.addDoc(titulo, filepath, setor);
    alert('Documento adicionado com sucesso!');
    e.target.reset();
  } catch (err) {
    alert('Erro ao salvar documento: ' + err.message);
  } finally {
    submitBtn.innerHTML = orgText;
    submitBtn.disabled = false;
  }
});

// ----------------- Consult Doc -------------------
let currentFilter = null;

async function loadSetoresFilter() {
  const setores = await window.api.getSetores();
  const list = document.getElementById('filter-setores-list');
  
  const createLi = (id, nome, icon) => {
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
  
  setores.forEach(s => {
    list.appendChild(createLi(s.IDsetor, s.NomeSetor, 'folder'));
  });
}

async function loadDocs(setorId) {
  try {
    const docs = await window.api.getDocs(setorId);
    const tbody = document.getElementById('docs-tbody');
    tbody.innerHTML = '';
    
    if (docs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500">Nenhum documento encontrado.</td></tr>`;
      return;
    }
    
    docs.forEach(d => {
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
          <span class="flex w-fit items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ${d.EstadoDoc}
          </span>
        </td>
        <td class="p-4 text-right flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

async function viewDoc(id) {
  try {
    const tempPath = await window.api.getDocFile(id);
    await window.api.openFile(tempPath);
  } catch (err) {
    alert('Erro ao visualizar arquivo: ' + err.message);
  }
}

async function downloadDoc(id, titulo) {
  try {
    const destPath = await window.api.saveFileDialog(titulo);
    if (destPath) {
       await window.api.saveFileBuffer(destPath, id);
       alert('Documento salvo com sucesso em ' + destPath);
    }
  } catch(err) {
    alert('Erro ao baixar documento: ' + err.message);
  }
}

async function deleteDoc(id) {
  if (confirm('Excluir documento permanentemente? Esta ação não pode ser desfeita.')) {
    try {
      await window.api.deleteDoc(id);
      loadDocs(currentFilter);
    } catch(err) {
      alert('Erro ao excluir: ' + err.message);
    }
  }
}

// Initialize application
window.addEventListener('DOMContentLoaded', () => {
  nav('home');
});
