import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';

let videoFolderPath = './videos/landscape/converted/';
let ffMpegPath = 'C:/Program Files/FFmpeg/ffmpeg-2023-07-02-git-50f34172e0-full_build/bin/ffmpeg.exe';

// Настройка на пътя на ffmpeg
ffmpeg.setFfmpegPath(ffmpegStatic || ffMpegPath);

function ensureDirectoryExists(directoryPath: string) {
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
        console.log(`Директорията ${directoryPath} беше създадена.`);
    } else {
        console.log(`Директорията ${directoryPath} вече съществува.`);
    }
}

function trimVideos(directoryPath: string, maxDuration: number) {
    const videoFiles = fs.readdirSync(directoryPath)
        .filter(file => file.endsWith('.mp4'));

    // Създаване на папка за обрязаните видеоклипове
    const cutDirectory = path.join(directoryPath, 'cut');
    ensureDirectoryExists(cutDirectory);

    videoFiles.forEach(file => {
        const filePath = path.join(directoryPath, file);
        const outputFilePath = path.join(cutDirectory, file);

        ffmpeg(filePath)
        .outputOptions([
            '-t', maxDuration.toString() // Рязане на видеото до максималната продължителност
        ])
        .save(outputFilePath)
            .on('end', () => console.log(`Обрязването на ${file} завършено.`))
            .on('error', err => console.error(`Грешка при обрязването на ${file}: ${err.message}`));
    });
}

// Примерна употреба на функцията
trimVideos(videoFolderPath, 6); // Обрязване на всички видеоклипове до 6 секунди
