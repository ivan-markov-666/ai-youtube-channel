import ffmpeg from 'fluent-ffmpeg';

import { unlink } from 'fs';

import {
    voiceWithSilencePath, 
    songDoubledFilePath,
    outputedAudioFilePath
} from '../../config';



export function mergeAudioFiles(songAudioVolume: string, voiceFilePath: string, songFilePath: string, temporaryAudioFilePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const silenceDurationMs = 5000; // 5 секунди тишина

        // Първо добавете тишина към voice.mp3
        addSilenceToEnd(voiceFilePath, voiceWithSilencePath, silenceDurationMs, () => {
            // След това извикайте getDuration и mergeAndTrimSong
            getDuration(voiceWithSilencePath, (voiceDurationWithSilence) => {
                // Проверка дали song.mp3 трябва да бъде удвоен
                doubleSongIfShorterThanVoice(songFilePath, voiceDurationWithSilence, () => {
                    // След удвояване на song.mp3 (ако е необходимо)
                    getDuration(songFilePath, (songDuration) => {
                        // Използвайте или оригиналния, или удвоения song.mp3
                        const songToUseFilePath = songDuration < voiceDurationWithSilence ? './audio/song_doubled.mp3' : songFilePath;
                        mergeAndTrimSong(songAudioVolume, voiceWithSilencePath, songToUseFilePath, voiceDurationWithSilence, temporaryAudioFilePath, (duration) => {
                            console.log('Обработката на mergeAndTrimSong е завършена.');

                            // Извикайте fadeAudioEnd и използвайте resolve в неговия callback
                            fadeAudioEnd(temporaryAudioFilePath, outputedAudioFilePath, 5000, duration, () => {
                                console.log('Файлът е обработен с избледняване в края.');
                                resolve(); // Разрешаване на Promise при завършване на всички операции
                            });
                        });
                    });
                });
            });
        });
    });
}



function doubleSongIfShorterThanVoice(songFilePath: string, voiceDurationWithSilence: number, callback: () => void) {
    getDuration(songFilePath, (songDuration) => {
        if (songDuration < voiceDurationWithSilence) {

            ffmpeg()
                .input(songFilePath)
                .input(songFilePath)
                .complexFilter([
                    '[0:a][1:a]concat=n=2:v=0:a=1[out]',
                ], 'out')
                .audioCodec('libmp3lame')
                .save(songDoubledFilePath)
                .on('end', () => {
                    console.log(`Файлът song.mp3 е удвоен: ${songDoubledFilePath}`);
                    callback(); // Извикване на callback функцията след като обработката приключи
                })
                .on('error', (err) => {
                    console.error(`Грешка при удвояването на файла song.mp3: ${err.message}`);
                });
        } else {
            console.log('Файлът song.mp3 е достатъчно дълъг.');
            callback(); // Извикване на callback функцията директно ако song.mp3 е достатъчно дълъг
        }
    });
}

function getDuration(filePath: string, callback: (duration: number) => void) {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
            console.error(`Грешка при получаване на продължителността на файла: ${err.message}`);
            return;
        }
        const duration = metadata.format.duration;
        if (duration !== undefined) {
            callback(duration);
        } else {
            console.error("Не може да се определи продължителността на файла.");
        }
    });
}

function addSilenceToEnd(voiceFilePath: string, voiceWithSilencePath: string, silenceDurationMs: number, callback: () => void) {
    ffmpeg(voiceFilePath)
        .audioFilters(`apad=pad_dur=${silenceDurationMs / 1000}`)
        .audioCodec('libmp3lame')
        .save(voiceWithSilencePath)
        .on('end', () => {
            console.log(`Тишина е добавена в края на файла: ${voiceWithSilencePath}`);
            callback(); // Извикване на callback функцията след като обработката приключи
        })
        .on('error', (err) => {
            console.error(`Грешка при добавяне на тишина в края на файла: ${err.message}`);
        });
}

function fadeAudioEnd(inputFilePath: string, outputFilePath: string, fadeDurationMs: number, totalDuration: number, callback: () => void) {
    const fadeStart = totalDuration - fadeDurationMs / 1000; // Начало на избледняването

    ffmpeg(inputFilePath)
        .audioFilters(`afade=t=out:st=${fadeStart}:d=${fadeDurationMs / 1000}`)
        .audioCodec('libmp3lame')
        .save(outputFilePath)
        .on('end', () => {
            console.log(`Файлът е обработен с избледняване в края: ${outputFilePath}`);
            callback(); // Извикване на callback функцията при успешно завършване
        })
        .on('error', (err) => {
            console.error(`Грешка при обработката на файла: ${err.message}`);
        });
}

function mergeAndTrimSong(songAudioVolume: string, voiceFilePath: string, songFilePath: string, voiceDuration: number, temporaryAudioFilePath: string, onFinish: (duration: number) => void) {
    const delayMs = 5000; // Забавяне на voice.mp3 с 5 секунди
    const totalDuration = voiceDuration + delayMs / 1000;

    ffmpeg()
        .input(voiceFilePath)
        .input(songFilePath)
        .complexFilter([
            `[0:a]adelay=${delayMs}|${delayMs}[voiceDelayed]`, // Добавяне на забавяне към voice.mp3
            `[1:a]atrim=0:${totalDuration},asetpts=PTS-STARTPTS[songTrimmed]`, // Обрязване на song.mp3
            `[songTrimmed]volume=${songAudioVolume}[songAdjusted]`, // Намаляване на звука на song.mp3
            `[voiceDelayed][songAdjusted]amix=inputs=2:duration=longest` // Смесване на двата потока
        ])
        .audioCodec('libmp3lame')
        .save(temporaryAudioFilePath)
        .on('end', () => {
            console.log(`Файлът е генериран: ${temporaryAudioFilePath}`);
            onFinish(totalDuration); // Предаване на продължителността на генерирания файл
        })
        .on('error', (err) => {
            console.error(`Грешка при обработката на файла: ${err.message}`);
        });
}

/**
 * @description     Функция за изтриване на файл
 * @param filePath  Пътя на файла, който да бъде изтрит 
 */
export function deleteFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        unlink(filePath, (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}
