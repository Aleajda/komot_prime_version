const { contextBridge } = require("electron")

contextBridge.exposeInMainWorld("kompotDesktop", {
  platform: process.platform,
})
