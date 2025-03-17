import ort from 'onnxruntime-node';
import { join } from 'path';
import { checkRepetition } from './utils';
import { ModelConfig } from '../shared/types';
import { ImageDataPolyfill } from '../shared/types';
import { logger } from '../main/utils/logger';
// import { AutoTokenizer, AutoImageProcessor, env, RawImage } from '@huggingface/transformers';
const sharp = require('sharp');
const { AutoTokenizer, AutoImageProcessor, env, RawImage } = require('@huggingface/transformers');
env.remoteHost = 'https://hf-mirror.com';
logger.info('Transformers module path:', require.resolve('@huggingface/transformers'));

export class OCRService {
    private tokenizer: any;
    private featureExtractor: any;
    private encoderSession: ort.InferenceSession | null = null;
    private decoderSession: ort.InferenceSession | null = null;
    private isInitialized: boolean = false;

    private config: ModelConfig = {
        maxLength: 512,
        numLayers: 6,
        hiddenSize: 768,
        numAttentionHeads: 12,
        batchSize: 1
    };

    async initialize(modelPath: string = 'models/default'): Promise<void> {
        try {
            // 初始化 ONNX 运行时选项
            const options: ort.InferenceSession.SessionOptions = {
                executionProviders: ['cpu'],
                graphOptimizationLevel: 'all'
            };

            // 获取正确的模型路径
            const resourcePath = process.env.NODE_ENV === 'development'
                ? join(__dirname, '..', '..', modelPath)
                : join(process.resourcesPath, modelPath);
            env.localModelPath = resourcePath;
            // 加载编码器和解码器模型
            this.encoderSession = await ort.InferenceSession.create(
                join(resourcePath, 'encoder_model.onnx'),
                options
            );

            this.decoderSession = await ort.InferenceSession.create(
                join(resourcePath, 'decoder_model_merged.onnx'),
                options
            );

            this.tokenizer = await AutoTokenizer.from_pretrained("");
            this.featureExtractor = await AutoImageProcessor.from_pretrained("", {});

            this.isInitialized = true;
        } catch (error) {
            console.error('Model initialization failed:', error);
            throw error;
        }
    }

    async inference(imageData: ImageDataPolyfill): Promise<{
        text: string;
        processedImage: string;
    }> {
        if (!this.isInitialized) {
            throw new Error('OCR Service not initialized');
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

            // 准备编码器输入
            const { tensor: encoderInputs, processedBase64 } = await this.prepareEncoderInputs(imageData);
            // const isAllNaN = encoderInputs.cpuData.every(Number.isNaN);
            // console.log(isAllNaN); // true 或 false
            const encoderOutputs = await this.encoderSession!.run(
                { pixel_values: encoderInputs }
            );
            // 准备解码器输入
            let decoderInputs = this.initializeDecoderInputs(
                encoderOutputs.last_hidden_state,
                numLayers,
                batchSize,
                numAttentionHeads,
                headSize
            );

            // 生成文本
            let generatedText = '';
            for (let i = 0; i < maxLength; i++) {
                // logger.info(i, generatedText)
                const decoderOutputs = await this.decoderSession!.run(decoderInputs);
                // 获取下一个token
                const nextTokenId = this.getNextToken(decoderOutputs.logits);
                const tokenText = await this.decodeToken(nextTokenId);
                generatedText += tokenText;

                // 检查是否需要停止生成
                if (this.shouldStopGeneration(nextTokenId, generatedText)) {
                    break;
                }

                // 更新解码器输入
                decoderInputs = this.updateDecoderInputs(
                    decoderInputs,
                    decoderOutputs,
                    nextTokenId,
                    numLayers
                );
            }
            logger.info(generatedText)
            return {
                text: this.postProcessText(generatedText),
                processedImage: processedBase64
            };
        } catch (error) {
            console.error('Inference failed:', error);
            throw error;
        }
    }

    private async tensorToImage(tensor: ort.Tensor, outputPath: string): Promise<void> {
        const [_, channels, height, width] = tensor.dims;
        const data = tensor.data as Float32Array;

        // 创建输出缓冲区
        const outputData = new Uint8Array(height * width * channels);

        // 转换 CHW -> HWC
        for (let h = 0; h < height; h++) {
            for (let w = 0; w < width; w++) {
                for (let c = 0; c < channels; c++) {
                    // CHW 格式下的索引: c * (height * width) + h * width + w
                    const srcIdx = c * (height * width) + h * width + w;
                    // HWC 格式下的索引: h * (width * channels) + w * channels + c
                    const dstIdx = h * (width * channels) + w * channels + c;

                    // 转换到 0-255 范围
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

    private async tensorToBase64(tensor: ort.Tensor): Promise<string> {
        const [_, channels, height, width] = tensor.dims;
        const data = tensor.data as Float32Array;

        // 创建输出缓冲区
        const outputData = new Uint8Array(height * width * channels);

        // 转换 CHW -> HWC
        for (let h = 0; h < height; h++) {
            for (let w = 0; w < width; w++) {
                for (let c = 0; c < channels; c++) {
                    const srcIdx = c * (height * width) + h * width + w;
                    const dstIdx = h * (width * channels) + w * channels + c;
                    outputData[dstIdx] = Math.max(0, Math.min(255, data[srcIdx] * 255));
                }
            }
        }

        // 使用 sharp 将数据转换为 base64
        const buffer = Buffer.from(outputData.buffer);
        const processedBuffer = await sharp(buffer, {
            raw: {
                width,
                height,
                channels
            }
        })
            .png()
            .toBuffer();

        return `data:image/png;base64,${processedBuffer.toString('base64')}`;
    }

    private async prepareEncoderInputs(imageData: ImageDataPolyfill): Promise<{
        tensor: ort.Tensor;
        processedBase64: string;
    }> {
        const rawImage = new RawImage(imageData.data, imageData.width, imageData.height, 3);
        const inputs = await this.featureExtractor(rawImage);
        const tensor = inputs.pixel_values.ort_tensor;

        // 获取处理后图像的 base64
        const processedBase64 = await this.tensorToBase64(tensor);
        // logger.info(processedBase64)
        await this.tensorToImage(tensor, 'test/processed.png');

        return {
            tensor,
            processedBase64
        };
    }

    private initializeDecoderInputs(
        encoderHiddenStates: ort.Tensor,
        numLayers: number,
        batchSize: number,
        numAttentionHeads: number,
        headSize: number
    ): Record<string, ort.Tensor> {
        return {
            input_ids: new ort.Tensor('int64', new BigInt64Array([BigInt(0)]), [1, 1]),
            encoder_hidden_states: encoderHiddenStates,
            use_cache_branch: new ort.Tensor('bool', new Uint8Array([1]), [1]),
            ...this.initializePastKeyValues(numLayers, batchSize, numAttentionHeads, headSize)
        };
    }

    private initializePastKeyValues(
        numLayers: number,
        batchSize: number,
        numAttentionHeads: number,
        headSize: number
    ): Record<string, ort.Tensor> {
        const pastKeyValues: Record<string, ort.Tensor> = {};

        for (let i = 0; i < numLayers; i++) {
            ['key', 'value'].forEach(type => {
                pastKeyValues[`past_key_values.${i}.${type}`] = new ort.Tensor(
                    'float32',
                    new Float32Array(0),
                    [batchSize, numAttentionHeads, 0, headSize]
                );
            });
        }

        return pastKeyValues;
    }

    private getNextToken(logits: ort.Tensor): number {
        // 简单的argmax实现
        return Array.from(logits.data as Float32Array).indexOf(Math.max(...(logits.data as Float32Array)));
    }

    private async decodeToken(tokenId: number): Promise<string> {
        return this.tokenizer.decode([tokenId], { skip_special_tokens: true });
    }

    private shouldStopGeneration(tokenId: number, text: string): boolean {
        // 检查是否达到结束条件
        if (tokenId === 2) { // EOS token
            return true;
        }

        // 检查重复
        if (checkRepetition(text, 21)) {
            return true;
        }

        return false;
    }

    private updateDecoderInputs(
        currentInputs: Record<string, ort.Tensor>,
        outputs: Record<string, ort.Tensor>,
        nextTokenId: number,
        numLayers: number
    ): Record<string, ort.Tensor> {
        return {
            ...currentInputs,
            input_ids: new ort.Tensor('int64', new BigInt64Array([BigInt(nextTokenId)]), [1, 1]),
            ...this.updatePastKeyValues(outputs, numLayers)
        };
    }

    private updatePastKeyValues(outputs: Record<string, ort.Tensor>, numLayers: number): Record<string, ort.Tensor> {
        const updatedPastKeyValues: Record<string, ort.Tensor> = {};

        for (let i = 0; i < numLayers; i++) {
            ['key', 'value'].forEach((type, j) => {
                updatedPastKeyValues[`past_key_values.${i}.${type}`] = outputs[`present.${i}.${type}`];
            });
        }

        return updatedPastKeyValues;
    }

    private postProcessText(text: string): string {
        // LaTeX格式处理
        logger.info('raw text', text)
        text = text.replace('\\[', '')
            .replace('\\]', '')
            .replace('%', '\\%')
            .replace(/%/g, '\\%')
            // 替换多个连续换行为单个换行
            .replace(/\n\s*\n+/g, '\n')
            // 移除开头和结尾的空白字符（包括换行）
            .trim();
        logger.info('postProcessText', text)
        return text;
    }
} 