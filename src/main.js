const {app, BrowserWindow, ipcMain, session, systemPreferences} = require('electron')
const {resolve} = require('path')
const fs = require("fs");

let mainWindow = null;
let pickerDialog = null;

app.on('ready', async () => {
    let extPath = resolve('../AudioPick')
    console.log('extPath:' + extPath)
    if (fs.existsSync(extPath)) {
        const extRet = await session.defaultSession.loadExtension(extPath);
        console.log('extention load success,extPath:' + extPath)
    }
    console.log('MediaAccessStatus:microphone:', systemPreferences.getMediaAccessStatus('microphone'))
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        //if (permission === 'media') {
        //    return callback(false)
        //}
        callback(true)
    })
    mainWindow = new BrowserWindow({
        height: 600,
        width: 800,
        //support node
        webPreferences: {
            nodeIntegration: true,
            //allow invoke from render
            enableRemoteModule: true,
        }
    });

    pickerDialog = new BrowserWindow({
        parent: mainWindow,
        skipTaskbar: true,
        //modal: true,
        show: false,
        height: 1080,    //390
        width: 1920,     //680
        webPreferences: {
            nodeIntegration: true,
            //allow invoke from render
            enableRemoteModule: true,
        }
    })
    mainWindow.loadURL('file://' + __dirname + '/index.html')
    pickerDialog.loadURL('file://' + __dirname + '/picker.html')


    /*
    //test window
    let testWin = new BrowserWindow({
        //parent: mainWindow,
        //skipTaskbar: true,
        //modal: true,
        // show: false,
        height: 1080,    //390
        width: 1600,     //680
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        }
    })
    // testWin.loadURL('https://www.iqiyi.com/w_19s00klegx.html');
    //testWin.loadURL('https://flowplayer.com/features/player')
    //h5 player test
    testWin.loadURL('https://flowplayer.com/features/player')
    // testWin.loadURL('https://plyr.io/');
    testWin.webContents.openDevTools();
    */

    //open debug window
    mainWindow.webContents.openDevTools();
    pickerDialog.webContents.openDevTools();

    //stop pickerDialog close
    pickerDialog.on('close', (event, options) => {
        event.preventDefault();
        pickerDialog.hide();
        return false;
    });

});

ipcMain.on('show-picker', (event, options) => {
    pickerDialog.show()
    pickerDialog.webContents.send('get-sources', options)
})

ipcMain.on('source-id-selected', (event, sourceId) => {
    pickerDialog.hide()
    mainWindow.webContents.send('source-id-selected', sourceId)
})
