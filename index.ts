import { createVoice } from './src/audio/createVoice';
import { mergeAudioFiles, createDirectory, deleteFile, getDirectoriesInDirectory, getRandomAudioFile } from './src/audio/mergeSongAndVoice';
import fs from 'fs';
import {
    songAudioVolume,
    voiceFilePath,
    songFilePath,
    temporaryAudioFilePath,
    voiceWithSilencePath,
    outputedAudioFilePath,
    songDoubledFilePath
} from './config';
async function audio() {
    // await createVoice();
    // await mergeDownloadedFiles()
    await createDirectory(`./audio/final-audio`)
    const directories = await getDirectoriesInDirectory(`./audio/converted`);
    console.log(`Брой папки в директорията: ${directories.length}`);
    for (let i = 1; i <= directories.length; i++) {
        // Ако outputedAudioFilePath съществува, изтрийте го първо.
        if (fs.existsSync(`/audio/converted/${i}`)) {
            await deleteFile(`/audio/converted/${i}`);
            console.log('Файлът е изтрит успешно.');
        }
        await createDirectory(`./audio/final-audio/${i}`)
        const selectRandomSongFile = await getRandomAudioFile(`./audio/songs/`);
        console.log(`Избран е случаен файл: .\\${selectRandomSongFile}`);
        await mergeAudioFiles(songAudioVolume, `./audio/converted/${i}/${i}.mp3`, selectRandomSongFile, temporaryAudioFilePath, `./audio/final-audio/${i}/audio${i}.mp3`);
        console.log('Обединяването на аудио файловете е завършено.');
        console.log(`Сега ще изтрием временните файлове: ${voiceWithSilencePath}, ${temporaryAudioFilePath}`);
        await deleteFile(voiceWithSilencePath);
        await deleteFile(temporaryAudioFilePath);
        console.log(`Всички временни файлове бяха изтрити успешно.`);
    }
}

audio();
