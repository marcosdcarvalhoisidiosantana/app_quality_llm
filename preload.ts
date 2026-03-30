import { contextBridge, ipcRenderer } from 'electron';

export interface RagSettings {
    chunkSize: number;
    chunkOverlap: number;
}

export interface WindowApi {
    getSetores: () => Promise<any[]>;
    addSetor: (nome: string) => Promise<number>;
    deleteSetor: (id: number) => Promise<number>;
    addDoc: (titulo: string, filepath: string, setorId: string | number) => Promise<number>;
    getDocs: (setorId: number | null) => Promise<any[]>;
    deleteDoc: (id: number) => Promise<number>;
    toggleDocStatus: (id: number, currentStatus: string) => Promise<number>;
    getDocFile: (id: number) => Promise<string>;
    selectFile: () => Promise<string | null>;
    saveFileDialog: (name: string) => Promise<string | null>;
    saveFileBuffer: (path: string, id: number) => Promise<boolean>;
    openFile: (path: string) => Promise<void>;
    getRagSettings: () => Promise<RagSettings>;
    saveRagSettings: (settings: RagSettings) => Promise<void>;
}

declare global {
    interface Window {
        api: WindowApi;
    }
}

contextBridge.exposeInMainWorld('api', {
  getSetores: () => ipcRenderer.invoke('get-setores'),
  addSetor: (nome: string) => ipcRenderer.invoke('add-setor', nome),
  deleteSetor: (id: number) => ipcRenderer.invoke('delete-setor', id),
  addDoc: (titulo: string, filepath: string, setorId: string | number) => ipcRenderer.invoke('add-doc', titulo, filepath, setorId),
  getDocs: (setorId: number | null) => ipcRenderer.invoke('get-docs', setorId),
  deleteDoc: (id: number) => ipcRenderer.invoke('delete-doc', id),
  toggleDocStatus: (id: number, currentStatus: string) => ipcRenderer.invoke('toggle-doc-status', id, currentStatus),
  getDocFile: (id: number) => ipcRenderer.invoke('get-doc-file', id),
  selectFile: () => ipcRenderer.invoke('select-file'),
  saveFileDialog: (name: string) => ipcRenderer.invoke('save-file-dialog', name),
  saveFileBuffer: (path: string, id: number) => ipcRenderer.invoke('save-file-buffer', path, id),
  openFile: (path: string) => ipcRenderer.invoke('open-file', path),
  getRagSettings: () => ipcRenderer.invoke('get-rag-settings'),
  saveRagSettings: (settings: RagSettings) => ipcRenderer.invoke('save-rag-settings', settings)
});
