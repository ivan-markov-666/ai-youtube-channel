
import { mergeAudioFiles, createDirectory, deleteFile, getDirectoriesInDirectory, getRandomAudioFile } from './src/audio/mergeSongAndVoice';
import fs from 'fs';
import {
    songAudioVolume,
    temporaryAudioFilePath,
    voiceWithSilencePath,
} from './config';
import { createVoice } from './src/audio/createVoice';
import { mergeDownloadedFiles, deletePath, repeatAudioToMatchDuration } from './src/audio/mergeSongAndVoice';

async function audio() {
    if (fs.existsSync('./audio/downloaded')) {
        await deletePath(`./audio/downloaded`);
    }
    if (fs.existsSync('./audio/final-audio')) {
        await deletePath(`./audio/final-audio`);
    }
    if (fs.existsSync('./audio/converted')) {
        await deletePath(`./audio/converted`);
    }
    if (fs.existsSync('./audio/song_doubled.mp3')) {
        await deleteFile(`./audio/song_doubled.mp3`);
    }

    if (!fs.existsSync('./audio/downloaded')) {
        await createDirectory(`./audio/downloaded`);
    }
    if (!fs.existsSync('./audio/converted')) {
        await createDirectory(`./audio/converted`)
    }
    if (!fs.existsSync('./audio/final-audio')) {
        await createDirectory(`./audio/final-audio`)
    }

    await createVoice();
    await mergeDownloadedFiles()
    const directories = await getDirectoriesInDirectory(`./audio/converted`);
    console.log(`Брой папки в директорията: ${directories.length}`);
    for (let i = 1; i <= directories.length; i++) {
        // Ако outputedAudioFilePath съществува, изтрийте го първо.
        if (fs.existsSync(`/audio/converted/${i}`)) {
            await deleteFile(`/audio/converted/${i}`);
            console.log('Файлът е изтрит успешно.');
        }
        await createDirectory(`./audio/final-audio/${i}`)
        let selectRandomSongFile = await getRandomAudioFile(`./audio/songs/`);
        console.log(`Избран е случаен файл: .\\${selectRandomSongFile}`);

        let finalSongWithEnoughtDuration = `./audio/converted/${i}/${i}-final.mp3`
        repeatAudioToMatchDuration(`./audio/converted/${i}/${i}.mp3`, selectRandomSongFile, finalSongWithEnoughtDuration)
            .then(() => console.log('Audio processing complete.'))
            .catch(error => console.error('Error processing audio:', error));

        selectRandomSongFile = finalSongWithEnoughtDuration;

        await mergeAudioFiles(songAudioVolume, `./audio/converted/${i}/${i}.mp3`, selectRandomSongFile, temporaryAudioFilePath, `./audio/final-audio/${i}/audio${i}.mp3`);
        console.log('Обединяването на аудио файловете е завършено.');
        console.log(`Сега ще изтрием временните файлове: ${voiceWithSilencePath}, ${temporaryAudioFilePath}`);
        await deleteFile(voiceWithSilencePath);
        await deleteFile(temporaryAudioFilePath);
        console.log(`Всички временни файлове бяха изтрити успешно.`);
    }
}

audio();

