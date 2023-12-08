// The volume of the song audio file should be set to value between 0 and 1. The lower the value, the quieter the song will be. The voice audio file will be played at full volume.
export const songAudioVolume = `0.2`;
// The path to the voice audio file.
export const voiceFilePath = './audio/voice.mp3';
// The path to the song audio file.
export const songFilePath = './audio/song.mp3';
// The path to the outputed audio file.
export const outputedAudioFilePath = './audio/audio.mp3';
// The path to the temporary audio file.
export const temporaryAudioFilePath = './audio/temporary-audio.mp3';
export const voiceWithSilencePath = './audio/voice_with_silence.mp3';
export const fadedOutputFilePath = './audio/audio_faded.mp3';
export const songDoubledFilePath = './audio/song_doubled.mp3'; // Това се ползва при ситуацията, ако song файла е по-кратък от voice файла по времетраене. Целта е да удвоим song файла или утроим, докато времетраенето на song достигне или задмине времетраенето на audio файла.
