const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getSetores: () => ipcRenderer.invoke('get-setores'),
  addSetor: (nome) => ipcRenderer.invoke('add-setor', nome),
  deleteSetor: (id) => ipcRenderer.invoke('delete-setor', id),
  addDoc: (titulo, filepath, setorId) => ipcRenderer.invoke('add-doc', titulo, filepath, setorId),
  getDocs: (setorId) => ipcRenderer.invoke('get-docs', setorId),
  deleteDoc: (id) => ipcRenderer.invoke('delete-doc', id),
  getDocFile: (id) => ipcRenderer.invoke('get-doc-file', id),
  selectFile: () => ipcRenderer.invoke('select-file'),
  saveFileDialog: (name) => ipcRenderer.invoke('save-file-dialog', name),
  saveFileBuffer: (path, id) => ipcRenderer.invoke('save-file-buffer', path, id),
  openFile: (path) => ipcRenderer.invoke('open-file', path)
});
