"use strict";
const electron = require("electron");
const api = {
  settings: {
    get: () => electron.ipcRenderer.invoke("settings:get"),
    set: (key, value) => electron.ipcRenderer.invoke("settings:set", key, value)
  },
  ocr: {
    toggle: (isPaused) => electron.ipcRenderer.invoke("ocr:toggle", isPaused)
  },
  window: {
    minimize: () => electron.ipcRenderer.invoke("window:minimize"),
    move: (x, y) => electron.ipcRenderer.invoke("window:move", x, y),
    closePopups: () => electron.ipcRenderer.invoke("window:closePopups"),
    toggleMaximize: () => electron.ipcRenderer.invoke("window:toggleMaximize"),
    close: () => electron.ipcRenderer.invoke("window:close")
  },
  screenshot: {
    capture: () => electron.ipcRenderer.invoke("screenshot:capture")
  },
  feedback: {
    save: (data) => electron.ipcRenderer.invoke("feedback:save", data)
  },
  clipboard: {
    copy: (text) => electron.ipcRenderer.invoke("clipboard:copy", text),
    writeImage: (data) => electron.ipcRenderer.invoke("clipboard:write-image", data)
  },
  snipHistory: {
    getAll: () => electron.ipcRenderer.invoke("snip-history:get-all"),
    add: (snip) => electron.ipcRenderer.invoke("snip-history:add", snip),
    delete: (id) => electron.ipcRenderer.invoke("snip-history:delete", id),
    search: (query) => electron.ipcRenderer.invoke("snip-history:search", query),
    clear: () => electron.ipcRenderer.invoke("snip-history:clear")
  },
  on: (channel, callback) => {
    const subscription = (_event, data) => {
      console.log("Preload received:", { channel, data });
      callback(data);
    };
    electron.ipcRenderer.on(channel, subscription);
    return () => {
      electron.ipcRenderer.removeListener(channel, subscription);
    };
  },
  off: (channel, callback) => {
    electron.ipcRenderer.removeListener(channel, callback);
  }
};
electron.contextBridge.exposeInMainWorld("electron", api);
