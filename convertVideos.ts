import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';


let videoFolderPath = './videos/landscape/';
let ffMpegPath = 'C:/Program Files/FFmpeg/ffmpeg-2023-07-02-git-50f34172e0-full_build/bin/ffmpeg.exe';

function ensureDirectoryExists(directoryPath: string) {
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
        console.log(`Директорията ${directoryPath} беше създадена.`);
    } else {
        console.log(`Директорията ${directoryPath} вече съществува.`);
    }
}

// Използване на функцията
const convertedDirectory = path.join(videoFolderPath, 'converted');
ensureDirectoryExists(convertedDirectory);

// Задаване на пътя на ffmpeg
ffmpeg.setFfmpegPath(ffmpegStatic || ffMpegPath);

function convertVideos(directoryPath: string) {
    const videoFiles = fs.readdirSync(directoryPath)
        .filter(file => file.endsWith('.mp4'));

    videoFiles.forEach(file => {
        const filePath = path.join(directoryPath, file);
        const outputFilePath = path.join(directoryPath, 'converted', `converted_${file}`);

        ffmpeg(filePath)
        .outputOptions([
            '-vf scale=1920:1080',  // Уеднаквяване на резолюцията
            '-r 30',                // Уеднаквяване на кадровата честота
            '-b:v 4000k',           // Задаване на уеднаквен битрейт
            '-preset veryfast',     // Бързина на кодиране
            '-crf 18',              // Баланс между качество и размер на файла
            '-pix_fmt yuv420p',     // Уеднаквяване на цветовото пространство
            '-colorspace bt709'     // Задаване на цветово пространство
        ])
        .save(outputFilePath)
            .on('end', () => console.log(`Конвертирането на ${file} завършено.`))
            .on('error', err => console.error(`Грешка при конвертирането на ${file}: ${err.message}`));
    });
}

// Примерна употреба
const videoDirectory = videoFolderPath;
convertVideos(videoDirectory);
