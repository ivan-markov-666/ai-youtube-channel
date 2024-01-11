/** Description: This file creates the voice using TTS and merges it with a song. **/

/** Imports **/
import { mergeAudioFiles, createDirectory, deleteFile, getDirectoriesInDirectory, getRandomAudioFile, mergeDownloadedFiles, deletePath, repeatAudioToMatchDuration } from './src/tts-generate-audio/mergeSongAndVoice';
import fs from 'fs';
import { songAudioVolume, temporaryAudioFilePath, voiceWithSilencePath } from './config';
import { createVoice } from './src/tts-generate-audio/createVoice';

/** Define the audio function. **/
async function audio() {
    // Delete all the files and directories that we are using in the process (preparing the directories for the new files).
    if (fs.existsSync('./02.generateTTS/downloaded')) {
        await deletePath(`./02.generateTTS/downloaded`);
    }
    if (fs.existsSync('./02.generateTTS/final-audio')) {
        await deletePath(`./02.generateTTS/final-audio`);
    }
    if (fs.existsSync('./02.generateTTS/converted')) {
        await deletePath(`./02.generateTTS/converted`);
    }
    if (fs.existsSync('./02.generateTTS/song_doubled.mp3')) {
        await deleteFile(`./02.generateTTS/song_doubled.mp3`);
    }
    if (!fs.existsSync('./02.generateTTS/downloaded')) {
        await createDirectory(`./02.generateTTS/downloaded`);
    }
    if (!fs.existsSync('./02.generateTTS/converted')) {
        await createDirectory(`./02.generateTTS/converted`)
    }
    if (!fs.existsSync('./02.generateTTS/final-audio')) {
        await createDirectory(`./02.generateTTS/final-audio`)
    }

    // Create the voice.
    await createVoice();

    // Merge the downloaded files to create one audio file.
    await mergeDownloadedFiles()
    // Get the directories in the converted directory. 
    const directories = await getDirectoriesInDirectory(`./02.generateTTS/converted`);
    // Log the number of directories.
    console.log(`Number of folders inside the direcotry: ${directories.length}`);
    // Loop through the directories.
    for (let i = 1; i <= directories.length; i++) {
        // Create the directory for the final audio file.
        await createDirectory(`./02.generateTTS/final-audio/${i}`)
        // Select random song file from the songs directory. That file (song) will be used to merge with the voice.
        let selectRandomSongFile = await getRandomAudioFile(`./02.generateTTS/songs/`);
        // Log the selected song file.
        console.log(`A random song file has been selected: ${selectRandomSongFile}`);
        // Assign the path to the final audio file that will be created to a variable.
        let finalSongWithEnoughtDuration = `./02.generateTTS/converted/${i}/${i}-final.mp3`;
        // Repeat the voice audio to match the duration of the song.
        repeatAudioToMatchDuration(`./02.generateTTS/converted/${i}/${i}.mp3`, selectRandomSongFile, finalSongWithEnoughtDuration)
            // Log the result.
            .then(() => console.log('Audio processing complete.'))
            // Catch the error.
            .catch(error => console.error('Error processing audio:', error));
        // Merge the song and the voice and create the final audio file.
        await mergeAudioFiles(songAudioVolume, `./02.generateTTS/converted/${i}/${i}.mp3`, finalSongWithEnoughtDuration, temporaryAudioFilePath, `./02.generateTTS/final-audio/${i}/02.generateTTS${i}.mp3`);
        // Log the result.
        console.log(`Merge of the song and the voice is complete.`); 
        // Log which files are going to be deleted.
        console.log(`Deleting the temporary files: ${voiceWithSilencePath}, ${temporaryAudioFilePath}`);
        // Delete the temporary files.
        await deleteFile(voiceWithSilencePath);
        await deleteFile(temporaryAudioFilePath);
    }
}

// Call the audio function.
audio();

