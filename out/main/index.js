"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const path = require("path");
const url = require("url");
const fs = require("fs/promises");
const ort = require("onnxruntime-node");
const Store = require("electron-store");
const createStore = () => {
  return new Store({
    defaults: {
      useInlineDollars: false,
      convertAlignToEquations: false,
      onlyParseWhenShow: false,
      ocrPaused: false,
      feedbacks: [],
      ocrHistory: []
    }
  });
};
let tray = null;
const store$2 = createStore();
const setupTray = (mainWindow) => {
  const iconPath = path.join(__dirname, "../../assets/icon.png");
  const icon = electron.nativeImage.createFromPath(iconPath);
  tray = new electron.Tray(icon);
  const updateContextMenu = () => {
    const contextMenu = electron.Menu.buildFromTemplate([
      {
        label: "显示窗口",
        click: () => {
          mainWindow.show();
          tray.setContextMenu(updateContextMenu());
        }
      },
      {
        label: "只在最大化时启用",
        type: "checkbox",
        checked: store$2.get("onlyParseWhenShow", false),
        click: (menuItem) => {
          store$2.set("onlyParseWhenShow", menuItem.checked);
        }
      },
      { type: "separator" },
      {
        label: "退出",
        click: () => {
          mainWindow.destroy();
          electron.app.quit();
        }
      }
    ]);
    return contextMenu;
  };
  tray.setToolTip("MixTeX");
  tray.setContextMenu(updateContextMenu());
  tray.on("click", () => {
    mainWindow.show();
    tray.setContextMenu(updateContextMenu());
  });
};
class SnipHistoryManager {
  static instance;
  historyFilePath;
  imagesDir;
  data = {
    items: [],
    version: 1
  };
  constructor() {
    const userDataPath = electron.app.getPath("userData");
    this.historyFilePath = path.join(userDataPath, "snip-history.json");
    this.imagesDir = path.join(userDataPath, "snip-images");
  }
  static getInstance() {
    if (!SnipHistoryManager.instance) {
      SnipHistoryManager.instance = new SnipHistoryManager();
    }
    return SnipHistoryManager.instance;
  }
  async initialize() {
    try {
      await fs.mkdir(this.imagesDir, { recursive: true });
      await this.loadHistory();
    } catch (error) {
      console.error("Failed to initialize history:", error);
      this.data = {
        items: [],
        version: 1
      };
      await this.saveHistory();
    }
  }
  async loadHistory() {
    try {
      const content = await fs.readFile(this.historyFilePath, "utf-8");
      this.data = JSON.parse(content);
    } catch (error) {
      if (error.code === "ENOENT") {
        this.data = {
          items: [],
          version: 1
        };
        await this.saveHistory();
      } else {
        throw error;
      }
    }
  }
  async saveHistory() {
    try {
      await fs.writeFile(
        this.historyFilePath,
        JSON.stringify(this.data, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error("Failed to save history:", error);
      throw error;
    }
  }
  async saveImage(imageData, id, isProcessed = false) {
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");
    const fileName = `${id}${isProcessed ? "_processed" : ""}.png`;
    const filePath = path.join(this.imagesDir, fileName);
    await fs.writeFile(filePath, imageBuffer);
    return fileName;
  }
  async loadImage(fileName) {
    const filePath = path.join(this.imagesDir, fileName);
    const imageBuffer = await fs.readFile(filePath);
    return `data:image/png;base64,${imageBuffer.toString("base64")}`;
  }
  async addSnip(snip) {
    const id = Date.now().toString();
    const imagePath = await this.saveImage(snip.image, id);
    const processedImagePath = await this.saveImage(snip.processedImage, id, true);
    const newSnip = {
      ...snip,
      id,
      timestamp: Date.now(),
      image: imagePath,
      processedImage: processedImagePath
    };
    this.data.items.unshift(newSnip);
    await this.saveHistory();
    return newSnip;
  }
  async deleteSnip(id) {
    const snip = this.data.items.find((item) => item.id === id);
    if (snip) {
      try {
        await fs.unlink(path.join(this.imagesDir, snip.image));
        await fs.unlink(path.join(this.imagesDir, snip.processedImage));
      } catch (error) {
        console.error("Failed to delete image files:", error);
      }
    }
    this.data.items = this.data.items.filter((item) => item.id !== id);
    await this.saveHistory();
  }
  async getSnips() {
    const snips = await Promise.all(
      this.data.items.map(async (item) => ({
        ...item,
        image: await this.loadImage(item.image),
        processedImage: await this.loadImage(item.processedImage)
      }))
    );
    return snips;
  }
  async searchSnips(query) {
    const matchedItems = this.data.items.filter(
      (item) => item.latex.toLowerCase().includes(query.toLowerCase())
    );
    const snips = await Promise.all(
      matchedItems.map(async (item) => ({
        ...item,
        image: await this.loadImage(item.image),
        processedImage: await this.loadImage(item.processedImage)
      }))
    );
    return snips;
  }
  async clearHistory() {
    for (const item of this.data.items) {
      try {
        await fs.unlink(path.join(this.imagesDir, item.image));
        await fs.unlink(path.join(this.imagesDir, item.processedImage));
      } catch (error) {
        console.error("Failed to delete image file:", error);
      }
    }
    this.data.items = [];
    await this.saveHistory();
  }
}
function setupSnipHistoryHandlers() {
  const historyManager2 = SnipHistoryManager.getInstance();
  historyManager2.initialize().catch((error) => {
    console.error("Failed to initialize history manager:", error);
  });
  electron.ipcMain.handle("snip-history:get-all", async () => {
    return await historyManager2.getSnips();
  });
  electron.ipcMain.handle("snip-history:add", async (_, snip) => {
    return await historyManager2.addSnip(snip);
  });
  electron.ipcMain.handle("snip-history:delete", async (_, id) => {
    await historyManager2.deleteSnip(id);
  });
  electron.ipcMain.handle("snip-history:search", async (_, query) => {
    return await historyManager2.searchSnips(query);
  });
  electron.ipcMain.handle("snip-history:clear", async () => {
    await historyManager2.clearHistory();
  });
}
class ScreenshotService {
  static instance;
  screenshotWindow = null;
  resolveScreenshot = null;
  rejectScreenshot = null;
  constructor() {
    electron.ipcMain.on("screenshot:confirm", (_, rect) => {
      this.handleScreenshotConfirm(rect);
    });
    electron.ipcMain.on("screenshot:cancel", () => {
      this.handleScreenshotCancel();
    });
  }
  static getInstance() {
    if (!ScreenshotService.instance) {
      ScreenshotService.instance = new ScreenshotService();
    }
    return ScreenshotService.instance;
  }
  async handleScreenshotConfirm(rect) {
    try {
      const primaryDisplay = electron.screen.getPrimaryDisplay();
      const sources = await electron.desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: primaryDisplay.size
      });
      const primarySource = sources.find(
        (source) => source.display_id === primaryDisplay.id.toString()
      );
      if (!primarySource || !this.resolveScreenshot) {
        throw new Error("无法获取屏幕截图");
      }
      const fullImage = primarySource.thumbnail;
      const croppedImage = fullImage.crop(rect);
      const imageDataUrl = croppedImage.toDataURL();
      if (this.screenshotWindow) {
        this.screenshotWindow.close();
        this.screenshotWindow = null;
      }
      this.resolveScreenshot(imageDataUrl);
    } catch (error) {
      this.handleScreenshotCancel(error);
    }
  }
  handleScreenshotCancel(error) {
    if (this.screenshotWindow) {
      this.screenshotWindow.close();
      this.screenshotWindow = null;
    }
    if (this.rejectScreenshot) {
      this.rejectScreenshot(error || new Error("Screenshot canceled"));
    }
  }
  async takeScreenshot() {
    return new Promise(async (resolve, reject) => {
      try {
        this.resolveScreenshot = resolve;
        this.rejectScreenshot = reject;
        const primaryDisplay = electron.screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.size;
        this.screenshotWindow = new electron.BrowserWindow({
          width,
          height,
          frame: false,
          transparent: true,
          fullscreen: true,
          webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
          },
          show: false
        });
        const isDev = !electron.app.isPackaged;
        const screenshotPath = isDev ? path.join(process.cwd(), "public/screenshot.html") : path.join(process.resourcesPath, "app/public/screenshot.html");
        console.log("Loading screenshot page from:", screenshotPath);
        await this.screenshotWindow.loadFile(screenshotPath);
        this.screenshotWindow.show();
      } catch (error) {
        console.error("Screenshot error:", error);
        this.handleScreenshotCancel(error);
      }
    });
  }
}
class ImageDataPolyfill {
  data;
  width;
  height;
  constructor(data, width, height) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}
const { Jimp, HorizontalAlign, VerticalAlign } = require("jimp");
async function processImage(image) {
  const imageBuffer = image.toPNG();
  const jimpImage = await Jimp.read(imageBuffer);
  jimpImage.contain({
    w: 448,
    h: 448,
    align: HorizontalAlign.CENTER | VerticalAlign.MIDDLE
  });
  const background = new Jimp({
    width: 448,
    height: 448,
    color: 4294967295
  });
  background.composite(
    jimpImage,
    (448 - jimpImage.bitmap.width) / 2,
    (448 - jimpImage.bitmap.height) / 2
  );
  await background.write("test/output.png");
  const rgbaData = background.bitmap.data;
  const rgbData = new Uint8ClampedArray(448 * 448 * 3);
  for (let i = 0; i < rgbaData.length; i += 4) {
    const rgbIndex = i / 4 * 3;
    rgbData[rgbIndex] = rgbaData[i];
    rgbData[rgbIndex + 1] = rgbaData[i + 1];
    rgbData[rgbIndex + 2] = rgbaData[i + 2];
  }
  return new ImageDataPolyfill(
    rgbData,
    448,
    448
  );
}
function checkRepetition(text, maxRepeats = 12) {
  for (let patternLength = 1; patternLength <= text.length / maxRepeats; patternLength++) {
    for (let start = 0; start <= text.length - maxRepeats * patternLength; start++) {
      const pattern = text.slice(start, start + patternLength);
      const repeated = pattern.repeat(maxRepeats);
      if (text.slice(start, start + maxRepeats * patternLength) === repeated) {
        return true;
      }
    }
  }
  return false;
}
const log = require("electron-log/main");
const configureLogger = () => {
  process.on("uncaughtException", (error) => {
    log.error("Uncaught Exception:", error);
  });
  process.on("unhandledRejection", (reason) => {
    log.error("Unhandled Promise Rejection:", reason);
  });
  return log;
};
const logger = configureLogger();
const sharp = require("sharp");
const { AutoTokenizer, AutoImageProcessor, env, RawImage } = require("@huggingface/transformers");
env.remoteHost = "https://hf-mirror.com";
logger.info("Transformers module path:", require.resolve("@huggingface/transformers"));
class OCRService {
  tokenizer;
  featureExtractor;
  encoderSession = null;
  decoderSession = null;
  isInitialized = false;
  config = {
    maxLength: 512,
    numLayers: 6,
    hiddenSize: 768,
    numAttentionHeads: 12,
    batchSize: 1
  };
  async initialize(modelPath = "models/default") {
    try {
      const options = {
        executionProviders: ["cpu"],
        graphOptimizationLevel: "all"
      };
      const resourcePath = process.env.NODE_ENV === "development" ? path.join(__dirname, "..", "..", modelPath) : path.join(process.resourcesPath, modelPath);
      env.localModelPath = resourcePath;
      this.encoderSession = await ort.InferenceSession.create(
        path.join(resourcePath, "encoder_model.onnx"),
        options
      );
      this.decoderSession = await ort.InferenceSession.create(
        path.join(resourcePath, "decoder_model_merged.onnx"),
        options
      );
      this.tokenizer = await AutoTokenizer.from_pretrained("");
      this.featureExtractor = await AutoImageProcessor.from_pretrained("", {});
      this.isInitialized = true;
    } catch (error) {
      console.error("Model initialization failed:", error);
      throw error;
    }
  }
  async inference(imageData) {
    if (!this.isInitialized) {
      throw new Error("OCR Service not initialized");
    }
    try {
      const {
        maxLength,
        numLayers,
        hiddenSize,
        numAttentionHeads,
        batchSize
      } = this.config;
      const headSize = hiddenSize / numAttentionHeads;
      const { tensor: encoderInputs, processedBase64 } = await this.prepareEncoderInputs(imageData);
      const encoderOutputs = await this.encoderSession.run(
        { pixel_values: encoderInputs }
      );
      let decoderInputs = this.initializeDecoderInputs(
        encoderOutputs.last_hidden_state,
        numLayers,
        batchSize,
        numAttentionHeads,
        headSize
      );
      let generatedText = "";
      for (let i = 0; i < maxLength; i++) {
        const decoderOutputs = await this.decoderSession.run(decoderInputs);
        const nextTokenId = this.getNextToken(decoderOutputs.logits);
        const tokenText = await this.decodeToken(nextTokenId);
        generatedText += tokenText;
        if (this.shouldStopGeneration(nextTokenId, generatedText)) {
          break;
        }
        decoderInputs = this.updateDecoderInputs(
          decoderInputs,
          decoderOutputs,
          nextTokenId,
          numLayers
        );
      }
      logger.info(generatedText);
      return {
        text: this.postProcessText(generatedText),
        processedImage: processedBase64
      };
    } catch (error) {
      console.error("Inference failed:", error);
      throw error;
    }
  }
  async tensorToImage(tensor, outputPath) {
    const [_, channels, height, width] = tensor.dims;
    const data = tensor.data;
    const outputData = new Uint8Array(height * width * channels);
    for (let h = 0; h < height; h++) {
      for (let w = 0; w < width; w++) {
        for (let c = 0; c < channels; c++) {
          const srcIdx = c * (height * width) + h * width + w;
          const dstIdx = h * (width * channels) + w * channels + c;
          outputData[dstIdx] = Math.max(0, Math.min(255, data[srcIdx] * 255));
        }
      }
    }
    const buffer = Buffer.from(outputData.buffer);
    await sharp(buffer, {
      raw: {
        width,
        height,
        channels
      }
    }).toFile(outputPath);
  }
  async tensorToBase64(tensor) {
    const [_, channels, height, width] = tensor.dims;
    const data = tensor.data;
    const outputData = new Uint8Array(height * width * channels);
    for (let h = 0; h < height; h++) {
      for (let w = 0; w < width; w++) {
        for (let c = 0; c < channels; c++) {
          const srcIdx = c * (height * width) + h * width + w;
          const dstIdx = h * (width * channels) + w * channels + c;
          outputData[dstIdx] = Math.max(0, Math.min(255, data[srcIdx] * 255));
        }
      }
    }
    const buffer = Buffer.from(outputData.buffer);
    const processedBuffer = await sharp(buffer, {
      raw: {
        width,
        height,
        channels
      }
    }).png().toBuffer();
    return `data:image/png;base64,${processedBuffer.toString("base64")}`;
  }
  async prepareEncoderInputs(imageData) {
    const rawImage = new RawImage(imageData.data, imageData.width, imageData.height, 3);
    const inputs = await this.featureExtractor(rawImage);
    const tensor = inputs.pixel_values.ort_tensor;
    const processedBase64 = await this.tensorToBase64(tensor);
    await this.tensorToImage(tensor, "test/processed.png");
    return {
      tensor,
      processedBase64
    };
  }
  initializeDecoderInputs(encoderHiddenStates, numLayers, batchSize, numAttentionHeads, headSize) {
    return {
      input_ids: new ort.Tensor("int64", new BigInt64Array([BigInt(0)]), [1, 1]),
      encoder_hidden_states: encoderHiddenStates,
      use_cache_branch: new ort.Tensor("bool", new Uint8Array([1]), [1]),
      ...this.initializePastKeyValues(numLayers, batchSize, numAttentionHeads, headSize)
    };
  }
  initializePastKeyValues(numLayers, batchSize, numAttentionHeads, headSize) {
    const pastKeyValues = {};
    for (let i = 0; i < numLayers; i++) {
      ["key", "value"].forEach((type) => {
        pastKeyValues[`past_key_values.${i}.${type}`] = new ort.Tensor(
          "float32",
          new Float32Array(0),
          [batchSize, numAttentionHeads, 0, headSize]
        );
      });
    }
    return pastKeyValues;
  }
  getNextToken(logits) {
    return Array.from(logits.data).indexOf(Math.max(...logits.data));
  }
  async decodeToken(tokenId) {
    return this.tokenizer.decode([tokenId], { skip_special_tokens: true });
  }
  shouldStopGeneration(tokenId, text) {
    if (tokenId === 2) {
      return true;
    }
    if (checkRepetition(text, 21)) {
      return true;
    }
    return false;
  }
  updateDecoderInputs(currentInputs, outputs, nextTokenId, numLayers) {
    return {
      ...currentInputs,
      input_ids: new ort.Tensor("int64", new BigInt64Array([BigInt(nextTokenId)]), [1, 1]),
      ...this.updatePastKeyValues(outputs, numLayers)
    };
  }
  updatePastKeyValues(outputs, numLayers) {
    const updatedPastKeyValues = {};
    for (let i = 0; i < numLayers; i++) {
      ["key", "value"].forEach((type, j) => {
        updatedPastKeyValues[`past_key_values.${i}.${type}`] = outputs[`present.${i}.${type}`];
      });
    }
    return updatedPastKeyValues;
  }
  postProcessText(text) {
    logger.info("raw text", text);
    text = text.replace("\\[", "").replace("\\]", "").replace("%", "\\%").replace(/%/g, "\\%").replace(/\n\s*\n+/g, "\n").trim();
    logger.info("postProcessText", text);
    return text;
  }
}
const ocrService$1 = new OCRService();
const historyManager$1 = SnipHistoryManager.getInstance();
const screenshotService = ScreenshotService.getInstance();
async function setupScreenshotHandlers() {
  try {
    await ocrService$1.initialize();
  } catch (error) {
    console.error("Failed to initialize OCR service:", error);
    return;
  }
  electron.ipcMain.handle("screenshot:capture", async () => {
    try {
      const imageDataUrl = await screenshotService.takeScreenshot();
      const image = electron.nativeImage.createFromDataURL(imageDataUrl);
      const processedImage_bg = await processImage(image);
      const { text, processedImage } = await ocrService$1.inference(processedImage_bg);
      const newSnip = {
        image: imageDataUrl,
        processedImage,
        latex: text,
        active: true,
        metadata: {
          originalSize: { width: image.getSize().width, height: image.getSize().height },
          processingTime: Date.now()
        }
      };
      const savedSnip = await historyManager$1.addSnip(newSnip);
      return {
        success: true,
        data: savedSnip
      };
    } catch (error) {
      console.error("Screenshot capture error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  });
}
const store$1 = createStore();
function setupWindowHandlers(mainWindow) {
  electron.ipcMain.handle("window:minimize", () => {
    mainWindow.minimize();
  });
  electron.ipcMain.handle("window:toggleMaximize", () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  electron.ipcMain.handle("window:close", () => {
    mainWindow.close();
  });
  electron.ipcMain.handle("window:move", (_, deltaX, deltaY) => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x + deltaX, y + deltaY);
  });
  electron.ipcMain.handle("window:closePopups", () => {
    mainWindow.webContents.send("close-popups");
  });
}
function setupIPC(mainWindow) {
  setupWindowHandlers(mainWindow);
  electron.ipcMain.handle("settings:get", async () => {
    return {
      useInlineDollars: store$1.get("useInlineDollars", true),
      convertAlignToEquations: store$1.get("convertAlignToEquations", true),
      onlyParseWhenShow: store$1.get("onlyParseWhenShow", false),
      ocrPaused: store$1.get("ocrPaused", false)
    };
  });
  electron.ipcMain.handle("settings:set", async (_, key, value) => {
    store$1.set(key, value);
  });
  electron.ipcMain.handle("ocr:toggle", async (_, isPaused) => {
    store$1.set("ocrPaused", isPaused);
  });
  electron.ipcMain.handle("feedback:save", async (_, data) => {
  });
  electron.ipcMain.handle("clipboard:copy", async (_, text) => {
  });
  electron.ipcMain.handle("clipboard:write-image", async (_, data) => {
  });
  setupSnipHistoryHandlers();
  setupScreenshotHandlers();
}
const store = createStore();
let lastImage = null;
const ocrService = new OCRService();
const historyManager = SnipHistoryManager.getInstance();
const setupClipboardWatcher = async (mainWindow) => {
  try {
    await ocrService.initialize();
    await historyManager.initialize();
  } catch (error) {
    console.error("Failed to initialize services:", error);
    return;
  }
  const checkClipboard = async () => {
    if (store.get("ocrPaused", false)) return;
    if (store.get("onlyParseWhenShow", false) && !mainWindow.isVisible()) return;
    try {
      const image = electron.clipboard.readImage();
      if (!image.isEmpty()) {
        const imageDataUrl = image.toDataURL();
        if (imageDataUrl === lastImage) return;
        lastImage = imageDataUrl;
        const startTime = Date.now();
        const processedImage_bg = await processImage(image);
        const { text, processedImage } = await ocrService.inference(processedImage_bg);
        const newSnip = {
          image: imageDataUrl,
          processedImage,
          latex: text,
          active: true,
          metadata: {
            originalSize: { width: image.getSize().width, height: image.getSize().height },
            processingTime: Date.now() - startTime
          }
        };
        const savedSnip = await historyManager.addSnip(newSnip);
        mainWindow.webContents.send("ocr-result", {
          image: imageDataUrl,
          processedImage,
          text,
          id: savedSnip.id
        });
        console.log("OCR result sent with ID:", savedSnip.id);
      }
    } catch (error) {
      console.error("Clipboard watch error:", error);
    }
  };
  setInterval(checkClipboard, 100);
};
const __filename$1 = url.fileURLToPath(require("url").pathToFileURL(__filename).href);
const __dirname$1 = path.dirname(__filename$1);
exports.mainWindow = null;
function createWindow() {
  const { width } = electron.screen.getPrimaryDisplay().workAreaSize;
  exports.mainWindow = new electron.BrowserWindow({
    width: 400,
    height: 800,
    minWidth: 400,
    minHeight: 600,
    x: width - 450,
    // 默认显示在屏幕右侧
    y: 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      // 允许加载本地资源
      preload: path.join(__dirname$1, "../preload/index.js")
    },
    // 添加以下配置来禁用自动填充
    autoHideMenuBar: true,
    focusable: true,
    // 允许窗口可以获得焦点
    show: false
    // 初始时不显示窗口
  });
  if (process.env.NODE_ENV === "development") {
    exports.mainWindow.loadURL("http://localhost:5173");
    exports.mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    exports.mainWindow.loadFile(path.join(__dirname$1, "../renderer/index.html"));
  }
  exports.mainWindow.on("closed", () => {
    exports.mainWindow = null;
  });
  exports.mainWindow.once("ready-to-show", () => {
    exports.mainWindow?.show();
  });
  setupIPC(exports.mainWindow);
}
const gotTheLock = electron.app.requestSingleInstanceLock();
if (!gotTheLock) {
  electron.app.quit();
} else {
  electron.app.on("second-instance", () => {
    if (exports.mainWindow) {
      if (exports.mainWindow.isMinimized()) exports.mainWindow.restore();
      exports.mainWindow.show();
      exports.mainWindow.focus();
    }
  });
}
electron.app.whenReady().then(() => {
  createWindow();
  setupTray(exports.mainWindow);
  setupClipboardWatcher(exports.mainWindow);
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (exports.mainWindow === null) {
    createWindow();
  }
});
