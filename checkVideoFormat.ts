import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Настройка на пътя на ffmpeg
let ffMpegPath = 'C:/Program Files/ffmpeg-2023-11-28-git-47e214245b-full_build/bin/ffmpeg.exe';
ffmpeg.setFfmpegPath(ffmpegStatic || ffMpegPath);

// Функция за анализ на видео файла
function analyzeVideoFile(videoFilePath: string): Promise<ffmpeg.FfprobeData> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoFilePath, (err, metadata) => {
            if (err) {
                reject(`Грешка при анализа на видео файла: ${err.message}`);
            } else {
                resolve(metadata);
            }
        });
    });
}

// Пример за използване на функцията
const videoFilePath = 'C:/Users/ivanm/Desktop/script/videos/converted/converted_mixkit-above-the-huge-clouds-that-cover-the-sun-31791-medium.mp4';

analyzeVideoFile(videoFilePath)
    .then(metadata => {
        console.log('Metadata:', metadata);
        // Тук може да обработите metadata според вашите нужди
    })
    .catch(error => console.error(error));
