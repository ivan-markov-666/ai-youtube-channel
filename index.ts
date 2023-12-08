import { mergeAudioFiles, deleteFile } from './src/audio/mergeSongAndVoice';
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

async function mergeAudio() {
    // Ако outputedAudioFilePath съществува, изтрийте го първо.
    if (fs.existsSync(outputedAudioFilePath)) {
        await deleteFile(outputedAudioFilePath);
        console.log('Файлът е изтрит успешно.');
    }

    await mergeAudioFiles(songAudioVolume, voiceFilePath, songFilePath, temporaryAudioFilePath);
    console.log('Обединяването на аудио файловете е завършено.');
    console.log(`Сега ще изтрием временните файлове: ${voiceWithSilencePath}, ${outputedAudioFilePath}, ${temporaryAudioFilePath}`);
    await deleteFile(voiceWithSilencePath);
    await deleteFile(songDoubledFilePath);
    await deleteFile(temporaryAudioFilePath);
    console.log(`Всички временни файлове бяха изтрити успешно.`);
}

mergeAudio();
