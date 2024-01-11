/** 
 * This file contains all the configuration variables for the project.
 * The variables are used in the generateTTS.ts file.
 * Please, do not change the values of the variables unless you know what you are doing.
 */

// The volume of the song audio file should be set to value between 0 and 1. The lower the value, the quieter the song will be. The voice audio file will be played at full volume.
export const songAudioVolume = `0.2`;
// The path to the voice audio file.
export const voiceFilePath = './02.generateTTS/voice.mp3';
// The path to the song audio file.
export const songFilePath = './02.generateTTS/song.mp3';
// The path to the outputed audio file.
export const outputedAudioFilePath = './02.generateTTS/audio.mp3';
// The path to the temporary audio file.
export const temporaryAudioFilePath = './02.generateTTS/temporary-audio.mp3';
// The path to the voice audio file with silence at the end.
export const voiceWithSilencePath = './02.generateTTS/voice_with_silence.mp3';
// The path to the voice audio file with silence at the end and the beginning.
export const fadedOutputFilePath = './02.generateTTS/audio_faded.mp3';
// This is used in the situation where the song file is shorter in duration than the voice file. The goal is to double or triple the song file until the duration of the song reaches or exceeds the duration of the audio file.
export const songDoubledFilePath = './02.generateTTS/song_doubled.mp3'; 
