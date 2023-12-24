import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

import { unlink } from 'fs';

import {
    voiceWithSilencePath,
    songDoubledFilePath,
} from '../../config';

const rootDirectory = path.resolve(__dirname, '../..');

export function mergeAudioFiles(songAudioVolume: string, voiceFilePath: string, songFilePath: string, temporaryAudioFilePath: string, outputedAudioFilePath: string): Promise<void> {
    return new Promise((resolve) => {
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

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function getDuration2(filePath: string): Promise<number> {
    try {
        const result = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`);
        const duration = parseFloat(result.stdout.trim());
        return duration;
    } catch (error) {
        console.error(`Error getting duration: ${error}`);
        throw error;
    }
}



export async function repeatAudioToMatchDuration(voiceFilePath: string, songFilePath: string, songFileFinalPath: string): Promise<void> {
    const voiceDuration = await getDuration2(voiceFilePath);
    const songDuration = await getDuration2(songFilePath);

    if (voiceDuration <= songDuration) {
        fs.copyFileSync(songFilePath, songFileFinalPath);
        return;
    }

    const repeatCount = Math.ceil(voiceDuration / songDuration);
    let command = `ffmpeg -stream_loop ${repeatCount - 1} -i "${songFilePath}" -c copy -shortest "${songFileFinalPath}"`;

    await execAsync(command);
}

export async function mergeDownloadedFiles() {
    try {
        const directories = await getDirectoriesInDirectory(`${rootDirectory}/audio/downloaded`);
        console.log(`Брой папки в директорията: ${directories.length}`);

        for (const dir of directories) {
            // Създаване на папка за конвертираните файлове ако не съществува
            createDirectory(`${rootDirectory}/audio/converted/${dir}/`)
                .then(() => console.log('Папката е създадена успешно.'))
                .catch(err => console.error(err));

            const directoryPath = `${rootDirectory}/audio/downloaded/${dir}/`;
            const outputPath = `${rootDirectory}/audio/converted/${dir}/${dir}.mp3`;

            // Проверка дали в папката има MP3 файлове
            if (await hasMp3Files(directoryPath)) {
                await concatenateAllAudioFilesInDirectory(directoryPath, outputPath);
                console.log(`Аудио файловете в папка ${dir} са успешно обединени`);
            } else {
                console.log(`В папка ${dir} няма MP3 файлове.`);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

/**
 * Създава папка по зададен път, ако тя вече не съществува.
 * @param directoryPath Пътят, където да се създаде папката.
 */
export function createDirectory(directoryPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.mkdir(directoryPath, { recursive: true }, (err) => {
            if (err) {
                console.error(`Грешка при създаване на папката: ${err.message}`);
                reject(err);
            } else {
                console.log(`Папката ${directoryPath} е успешно създадена или вече съществува.`);
                resolve();
            }
        });
    });
}

async function hasMp3Files(directoryPath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                console.error(`Грешка при четенето на директорията: ${err.message}`);
                return reject(err);
            }

            // Проверка дали има MP3 файлове
            const mp3Files = files.filter(file => path.extname(file) === '.mp3');
            resolve(mp3Files.length > 0);
        });
    });
}


export async function getDirectoriesInDirectory(directoryPath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, { withFileTypes: true }, (err, files) => {
            if (err) {
                console.error(`Грешка при четенето на директорията: ${err.message}`);
                return reject(err);
            }

            const directories = files.filter(file => file.isDirectory()).map(dir => dir.name);
            resolve(directories);
        });
    });
}

function concatenateAllAudioFilesInDirectory(directoryPath: string, outputFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                console.error(`Грешка при четенето на директорията: ${err.message}`);
                return reject(err);
            }

            // Филтриране и сортиране на MP3 файловете
            const mp3Files = files.filter(file => path.extname(file) === '.mp3').sort();

            if (mp3Files.length === 0) {
                return reject(new Error('Няма намерени MP3 файлове в директорията.'));
            }

            // Създаване на ffmpeg команда
            const ffmpegCommand = ffmpeg();

            mp3Files.forEach(file => {
                ffmpegCommand.input(path.join(directoryPath, file));
            });

            // Добавяне на complexFilter за конкатениране на аудио потоците
            ffmpegCommand.complexFilter([
                `${mp3Files.map((_, index) => `[${index}:a]`).join('')}concat=n=${mp3Files.length}:v=0:a=1[out]`,
            ], 'out')
                .audioCodec('libmp3lame')
                .save(outputFile)
                .on('end', () => {
                    console.log(`Файловете са успешно конкатенирани: ${outputFile}`);
                    resolve();
                })
                .on('error', (err) => {
                    console.error(`Грешка при конкатенирането на файловете: ${err.message}`);
                    reject(err);
                });
        });
    });
}

async function countDirectoriesInDirectory(directoryPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, { withFileTypes: true }, (err, files) => {
            if (err) {
                console.error(`Грешка при четенето на директорията: ${err.message}`);
                return reject(err);
            }

            const directories = files.filter(file => file.isDirectory());
            resolve(directories.length);
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

/**
 * Изтрива файл или директория.
 * @param path Пътят до файл или директория, която да бъде изтрита.
 */
export function deletePath(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (err) {
                return reject(err);
            }

            if (stats.isDirectory()) {
                fs.rm(path, { recursive: true, force: true }, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            } else {
                fs.unlink(path, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            }
        });
    });
}

/**
 * Избира произволен аудио файл от дадена директория.
 * @param {string} directoryPath Пътят към директорията.
 * @returns {Promise<string>} Обещание, което връща пътя към избрания аудио файл.
 */
export function getRandomAudioFile(directoryPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                return reject(err);
            }

            // Филтриране на аудио файловете (mp3)
            const mp3Files = files.filter(file => path.extname(file) === '.mp3');

            if (mp3Files.length === 0) {
                return reject(new Error('Няма намерени аудио файлове в директорията.'));
            }

            // Избор на произволен файл
            const randomFile = mp3Files[Math.floor(Math.random() * mp3Files.length)];

            // Връщане на пътя към избрания файл
            resolve(path.join(directoryPath, randomFile));
        });
    });
}