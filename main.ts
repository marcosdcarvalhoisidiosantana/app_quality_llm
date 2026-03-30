import { app, BrowserWindow, ipcMain, dialog, shell, Menu, IpcMainInvokeEvent } from 'electron';
import path from 'path';
import fs from 'fs';
import db from './db';

if (typeof global !== "undefined") {
    (global as any).DOMMatrix = (global as any).DOMMatrix || class DOMMatrix {};
    (global as any).Path2D = (global as any).Path2D || class Path2D {};
    (global as any).ImageData = (global as any).ImageData || class ImageData {};
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('src/index.html');
}

const getSettingsPath = () => path.join(app.getPath('userData'), 'settings.json');

function getRagSettings() {
    try {
        const data = fs.readFileSync(getSettingsPath(), 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return { chunkSize: 600, chunkOverlap: 60 };
    }
}

function saveRagSettings(settings: any) {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2));
}

ipcMain.handle('get-rag-settings', () => getRagSettings());
ipcMain.handle('save-rag-settings', (event: IpcMainInvokeEvent, settings: any) => saveRagSettings(settings));

app.whenReady().then(() => {
  const template: any[] = [
    {
      label: 'Arquivo',
      submenu: [{ role: 'quit', label: 'Sair' }]
    },
    {
      label: 'Configurações',
      submenu: [
        { 
          label: 'Configuração RAG Pipeline', 
          click: () => {
            const configWin = new BrowserWindow({
              width: 550,
              height: 550,
              webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: false,
                contextIsolation: true
              }
            });
            configWin.loadFile('src/config.html');
            configWin.setMenu(null);
          }
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC - Setores
ipcMain.handle('get-setores', () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM Set_empresa', (err: Error | null, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
});

ipcMain.handle('add-setor', (event: IpcMainInvokeEvent, nome: string) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO Set_empresa (NomeSetor) VALUES (?)', [nome], function (err: Error | null) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
});

ipcMain.handle('delete-setor', (event: IpcMainInvokeEvent, id: number) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM Set_empresa WHERE IDsetor = ?', [id], function (err: Error | null) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
});

// IPC - Docs
ipcMain.handle('add-doc', (event: IpcMainInvokeEvent, titulo: string, filepath: string, setorId: string | number) => {
  try {
    const fileBuffer = fs.readFileSync(filepath);
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO Doc_Qualidade (TituloDoc, Arquivo, SetorDoc, EstadoDoc) VALUES (?, ?, ?, ?)', 
        [titulo, fileBuffer, setorId, 'Ativo'], 
        async function (err: Error | null) {
          if (err) return reject(err);
          const docId = this.lastID;
          resolve(docId); // Libera o front-end rapidamente
          
          try {
             const settings = getRagSettings();
             // Assíncrono e tipado importando da source gerada (ingest.js compila para main)
             const ingestModule = await import('./ingest');
             console.log(`\n[RAG PIPELINE] Disparando processamento nativo para o doc: ${titulo}`);
             await ingestModule.processDocument(fileBuffer, titulo, settings.chunkSize, settings.chunkOverlap);
          } catch (pipelineErr) {
             console.error("\n[RAG PIPELINE ERROR] Falha no processamento vetorial:", pipelineErr);
          }
        }
      );
    });
  } catch (err) {
    throw err;
  }
});

ipcMain.handle('get-docs', (event: IpcMainInvokeEvent, setorId: number | null) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT d.IDdoc, d.TituloDoc, d.EstadoDoc, s.NomeSetor, d.SetorDoc 
      FROM Doc_Qualidade d 
      LEFT JOIN Set_empresa s ON d.SetorDoc = s.IDsetor
    `;
    let params: any[] = [];
    if (setorId) {
      query += ' WHERE d.SetorDoc = ?';
      params.push(setorId);
    }
    db.all(query, params, (err: Error | null, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
});

ipcMain.handle('delete-doc', (event: IpcMainInvokeEvent, id: number) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM Doc_Qualidade WHERE IDdoc = ?', [id], function (err: Error | null) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
});

ipcMain.handle('toggle-doc-status', (event: IpcMainInvokeEvent, id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
    return new Promise((resolve, reject) => {
      db.run('UPDATE Doc_Qualidade SET EstadoDoc = ? WHERE IDdoc = ?', [newStatus, id], function (err: Error | null) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
});

ipcMain.handle('select-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });
    if (canceled) return null;
    return filePaths[0];
});

ipcMain.handle('get-doc-file', (event: IpcMainInvokeEvent, id: number) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT Arquivo FROM Doc_Qualidade WHERE IDdoc = ?', [id], (err: Error | null, row: any) => {
      if (err) return reject(err);
      if (!row) return reject(new Error('Doc not found'));

      const tempPath = path.join(app.getPath('temp'), `tempdoc_${id}.pdf`);
      fs.writeFileSync(tempPath, row.Arquivo);
      resolve(tempPath);
    });
  });
});

ipcMain.handle('save-file-dialog', async (event: IpcMainInvokeEvent, defaultName: string) => {
   const { canceled, filePath } = await dialog.showSaveDialog({
       defaultPath: defaultName + '.pdf',
       filters: [{ name: 'PDF', extensions: ['pdf'] }]
   });
   return canceled ? null : filePath;
});

ipcMain.handle('save-file-buffer', (event: IpcMainInvokeEvent, filePath: string, dbId: number) => {
    return new Promise((resolve, reject) => {
        db.get('SELECT Arquivo FROM Doc_Qualidade WHERE IDdoc = ?', [dbId], (err: Error | null, row: any) => {
            if (err) return reject(err);
            if (!row) return reject(new Error('Doc not found'));
            try {
                fs.writeFileSync(filePath, row.Arquivo);
                resolve(true);
            } catch (e) {
                reject(e);
            }
        });
    });
});

ipcMain.handle('open-file', async (event: IpcMainInvokeEvent, filePath: string) => {
    await shell.openPath(filePath);
});
