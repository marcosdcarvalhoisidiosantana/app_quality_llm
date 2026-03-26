const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const db = require('./db');
const fs = require('fs');

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

app.whenReady().then(() => {
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
    db.all('SELECT * FROM Set_empresa', (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
});

ipcMain.handle('add-setor', (event, nome) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO Set_empresa (NomeSetor) VALUES (?)', [nome], function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
});

ipcMain.handle('delete-setor', (event, id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM Set_empresa WHERE IDsetor = ?', [id], function (err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
});

// IPC - Docs
ipcMain.handle('add-doc', (event, titulo, filepath, setorId) => {
  try {
    const fileBuffer = fs.readFileSync(filepath);
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO Doc_Qualidade (TituloDoc, Arquivo, SetorDoc, EstadoDoc) VALUES (?, ?, ?, ?)', 
        [titulo, fileBuffer, setorId, 'Ativo'], 
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  } catch (err) {
    throw err;
  }
});

ipcMain.handle('get-docs', (event, setorId) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT d.IDdoc, d.TituloDoc, d.EstadoDoc, s.NomeSetor, d.SetorDoc 
      FROM Doc_Qualidade d 
      LEFT JOIN Set_empresa s ON d.SetorDoc = s.IDsetor
    `;
    let params = [];
    if (setorId) {
      query += ' WHERE d.SetorDoc = ?';
      params.push(setorId);
    }
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
});

ipcMain.handle('delete-doc', (event, id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM Doc_Qualidade WHERE IDdoc = ?', [id], function (err) {
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

ipcMain.handle('get-doc-file', (event, id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT Arquivo FROM Doc_Qualidade WHERE IDdoc = ?', [id], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error('Doc not found'));

      const tempPath = path.join(app.getPath('temp'), `tempdoc_${id}.pdf`);
      fs.writeFileSync(tempPath, row.Arquivo);
      resolve(tempPath);
    });
  });
});

ipcMain.handle('save-file-dialog', async (event, defaultName) => {
   const { canceled, filePath } = await dialog.showSaveDialog({
       defaultPath: defaultName + '.pdf',
       filters: [{ name: 'PDF', extensions: ['pdf'] }]
   });
   return canceled ? null : filePath;
});

ipcMain.handle('save-file-buffer', (event, filePath, dbId) => {
    return new Promise((resolve, reject) => {
        db.get('SELECT Arquivo FROM Doc_Qualidade WHERE IDdoc = ?', [dbId], (err, row) => {
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

ipcMain.handle('open-file', async (event, filePath) => {
    await shell.openPath(filePath);
});
