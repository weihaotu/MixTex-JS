import { NativeImage } from 'electron';
import { ImageDataPolyfill } from '../shared/types';
const { Jimp, HorizontalAlign, VerticalAlign } = require('jimp');

export async function processImage(image: NativeImage): Promise<ImageDataPolyfill> {
    // 高效转换 NativeImage 到 Buffer
    const imageBuffer = image.toPNG();

    // 处理图像
    const jimpImage = await Jimp.read(imageBuffer);

    jimpImage.contain({
        w: 448,
        h: 448,
        align: HorizontalAlign.CENTER | VerticalAlign.MIDDLE,
    });

    // 创建白色背景并合成居中图像
    const background = new Jimp({
        width: 448,
        height: 448,
        color: 0xFFFFFFFF
    });
    background.composite(jimpImage,
        (448 - jimpImage.bitmap.width) / 2,
        (448 - jimpImage.bitmap.height) / 2
    );

    await background.write('test/output.png');
    // 将 RGBA 转换为 RGB
    const rgbaData = background.bitmap.data;
    const rgbData = new Uint8ClampedArray(448 * 448 * 3);

    for (let i = 0; i < rgbaData.length; i += 4) {
        const rgbIndex = (i / 4) * 3;
        rgbData[rgbIndex] = rgbaData[i];       // R
        rgbData[rgbIndex + 1] = rgbaData[i + 1]; // G
        rgbData[rgbIndex + 2] = rgbaData[i + 2]; // B
        // 忽略 A 通道
    }

    // 转换为 ImageData
    return new ImageDataPolyfill(
        rgbData,
        448,
        448
    );
}

export function checkRepetition(text: string, maxRepeats: number = 12): boolean {
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

export function convertAlignToEquations(text: string): string {
    const equations = text
        .replace(/\\begin\{align\*\}|\\end\{align\*\}/g, '')
        .replace(/&/g, '')
        .split('\\\\')
        .map(eq => eq.trim())
        .filter(eq => eq)
        .map(eq => `$$ ${eq} $$`);

    return equations.join('\n');
} 