const { app, BrowserWindow } = require('electron'); 
const path = require('path');

const createWindow = () => { 
  const mainWindow = new BrowserWindow({ 
    width: 800, 
    height: 600,
    autoHideMenuBar: true, // เพิ่มคำสั่งนี้เพื่อซ่อนเมนูบาร์ (File, Edit, View...)
    icon: path.join(__dirname, 'build', 'LPTask.ico') // เพิ่มไอคอนให้กับหน้าต่างแอป
  }); 
  
  mainWindow.loadFile('index.html'); 
}; 

app.whenReady().then(() => {
  createWindow();
}); 

// เพิ่มคำสั่งนี้เพื่อให้โปรแกรมปิดการทำงานสมบูรณ์แบบเมื่อผู้ใช้กดปุ่ม X (กากบาท)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});