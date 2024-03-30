/** Import external libraries */
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { unlink } from 'fs';
import { voiceWithSilencePath, songDoubledFilePath } from '../../config';

// The path to the root directory of the project (the directory where the package.json file is located)
const rootDirectory = path.resolve(__dirname, '../..');

/**
 * @description                     
 * @param songAudioVolume 
 * @param voiceFilePath 
 * @param songFilePath 
 * @param temporaryAudioFilePath 
 * @param outputedAudioFilePath 
 * @returns 
 */
export function mergeAudioFiles(songAudioVolume: string, voiceFilePath: string, songFilePath: string, temporaryAudioFilePath: string, outputedAudioFilePath: string): Promise<void> {
    // Return a Promise that will be resolved when all operations are completed (when the audio file is generated)
    return new Promise((resolve) => {
        // Define the duration of the silence that will be added to the end of the voice.mp3 file (in milliseconds)
        const silenceDurationMs = 5000;

        // Start with function for adding silence to the end of the voice.mp3 file
        addSilenceToEnd(voiceFilePath, voiceWithSilencePath, silenceDurationMs, () => {
            // Next, we need to get the duration of the voice.mp3 file with the added silence at the end (in seconds)
            getDuration(voiceWithSilencePath, (voiceDurationWithSilence) => {
                // Now we need to check if the song.mp3 file needs to be doubled (if it is shorter than the voice.mp3 file with the added silence at the end) and double it if necessary 
                doubleSongIfShorterThanVoice(songFilePath, voiceDurationWithSilence, () => {
                    // After that, we need to get the duration of the song.mp3 file (or the doubled song.mp3 file) (in seconds).
                    // This is needed, because at this moment we don't know the duration of the final audio file (the merged audio files).
                    getDuration(songFilePath, (songDuration) => {
                        // Use either the original or the doubled song.
                        const songToUseFilePath = songDuration < voiceDurationWithSilence ? './02.generateTTS/song_doubled.mp3' : songFilePath;
                        // Now we can merge the voice.mp3 file with the added silence at the end and the song.mp3 file (or the doubled song.mp3 file) and trim the final audio file to the duration of the voice.mp3 file with the added silence at the end.
                        // This will result in a final audio file with the same duration as the voice.mp3 file with the added silence at the end.
                        mergeAndTrimSong(songAudioVolume, voiceWithSilencePath, songToUseFilePath, voiceDurationWithSilence, temporaryAudioFilePath, (duration) => {
                            console.log('The mergeAndTrimSong operation is completed.');
                            // Add fade out to the end of the audio file (the last 5 seconds) and resolve the Promise in its callback function
                            fadeAudioEnd(temporaryAudioFilePath, outputedAudioFilePath, 5000, duration, () => {
                                // Print a message to the console when the audio file is generated
                                console.log('The audio file was faded out at the end.');
                                // Resolve the Promise when the audio file is generated (when all operations are completed)
                                resolve();
                            });
                        });
                    });
                });
            });
        });
    });
}

// Define execAsync as an asynchronous version of the exec function.
// This allows us to use the async/await syntax for more convenient execution and handling of shell commands.
// The promisify function from the util module converts the callback-based exec into an asynchronous function that returns a Promise.
const execAsync = promisify(exec);

/**
 * Asynchronously retrieves the duration of an audio or video file.
 * 
 * This method uses the 'ffprobe' command (part of the FFmpeg suite) to analyze the media file
 * and extract its duration. It returns the duration in seconds as a floating-point number.
 * If an error occurs during the execution of the 'ffprobe' command, it logs the error and rethrows it.
 *
 * @param   {string} filePath - The path to the audio or video file.
 * @returns {Promise<number>} - A promise that resolves with the duration of the file in seconds.
 * @example const duration = await getDuration('path/to/file.mp3');
 */
async function getDuration2(filePath: string): Promise<number> {
    try {
        // Execute the ffprobe command to get the duration of the file
        const result = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`);

        // Parse the duration from the command output and return it
        const duration = parseFloat(result.stdout.trim());
        // Return the duration in seconds
        return duration;
    } catch (error) {
        // Log and rethrow errors encountered during the execution of the ffprobe command
        console.error(`Error getting duration: ${error}`);
        // Rethrow the error
        throw error;
    }
}

/**
 * Repeats an audio file until it matches the duration of another specified audio file.
 * 
 * This function first calculates the duration of both the voice file and the song file.
 * If the duration of the voice file is less than or equal to the song file, 
 * it simply copies the song file to the final path. Otherwise, it repeats the song file 
 * enough times to match or exceed the duration of the voice file.
 * The repeated audio is then saved to the specified final path.
 *
 * @param   {string} voiceFilePath - The file path of the voice audio.
 * @param   {string} songFilePath - The file path of the song audio.
 * @param   {string} songFileFinalPath - The file path where the final audio should be saved.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @example await repeatAudioToMatchDuration('path/to/voice.mp3', 'path/to/song.mp3', 'path/to/final.mp3');
 */
export async function repeatAudioToMatchDuration(voiceFilePath: string, songFilePath: string, songFileFinalPath: string): Promise<void> {
    // Get the duration of voice file.
    const voiceDuration = await getDuration2(voiceFilePath);
    // Get the duration of the song file.
    const songDuration = await getDuration2(songFilePath);

    // If the song duration is already longer or equal, simply copy the file
    if (voiceDuration <= songDuration) {
        // Copy the song file to the final path (overwrite if it already exists) 
        fs.copyFileSync(songFilePath, songFileFinalPath);
        // Return from the function to prevent further execution
        return;
    }

    // Calculate the number of times the song should be repeated to match the voice file's duration
    const repeatCount = Math.ceil(voiceDuration / songDuration);

    // Construct the ffmpeg command to repeat the song file
    let command = `ffmpeg -stream_loop ${repeatCount - 1} -i "${songFilePath}" -c copy -shortest "${songFileFinalPath}"`;

    // Execute the ffmpeg command
    await execAsync(command);
}


/**
 * Concatenates all MP3 files in a specified directory into a single audio file.
 * 
 * This function reads the directory specified by `directoryPath`, filters for MP3 files,
 * and then uses the `ffmpeg` library to concatenate these files into one continuous audio stream.
 * The resultant audio file is saved to the path specified by `outputFile`.
 * If there are no MP3 files in the directory or if any error occurs during processing,
 * the function rejects the promise with an appropriate error message.
 *
 * @param {string} directoryPath    - The path of the directory containing MP3 files to concatenate.
 * @param {string} outputFile       - The path where the concatenated audio file will be saved.
 * @returns {Promise<void>}         - A promise that resolves when the concatenation process is complete 
 *                                  and rejects if an error occurs or if no MP3 files are found.
 * 
 * @example                         - await concatenateAllAudioFilesInDirectory('./audio', './output.mp3');
 */
function concatenateAllAudioFilesInDirectory(directoryPath: string, outputFile: string): Promise<void> {
    // Return a Promise that will be resolved when the concatenation process is complete or rejected if an error occurs or no MP3 files are found in the directory
    return new Promise((resolve, reject) => {
        // Read the directory and filter for MP3 files only (ignore other files)
        fs.readdir(directoryPath, (err, files) => {
            // Check if there is an error reading the directory and reject the promise if there is an error
            if (err) {
                // Log the error to the console and reject the promise with the error message as the reason for rejection
                console.error(`Error reading the directory: ${err.message}`);
                // Reject the promise with the error message as the reason for rejection
                return reject(err);
            }

            // Filter for MP3 files only (ignore other files) and sort them alphabetically (to ensure correct order)
            const mp3Files = files.filter(file => path.extname(file) === '.mp3').sort();

            // Check if there are any MP3 files in the directory and reject the promise if there are no MP3 files in the directory
            if (mp3Files.length === 0) {
                // Log a message to the console and reject the promise with an error message as the reason for rejection
                return reject(new Error('No MP3 files found in the directory.'));
            }

            // Create ffmpeg command to concatenate the audio files
            const ffmpegCommand = ffmpeg();

            // Add each MP3 file as an input to the ffmpeg command
            mp3Files.forEach(file => {
                // Add the file as an input to the ffmpeg command
                ffmpegCommand.input(path.join(directoryPath, file));
            });

            // Use complexFilter to concatenate the audio streams
            ffmpegCommand.complexFilter([
                // Use the concat filter to concatenate the audio streams into a single audio stream with the name 'out' (the name is arbitrary) 
                `${mp3Files
                    // Map each input stream to a filter string that selects the audio stream and adds it to the concat filter command
                    .map((_, index) => `[${index}:a]`).join('')}concat=n=${mp3Files.length}:v=0:a=1[out]`,
            ], 'out')
                // Set the audio codec to MP3 (libmp3lame)
                .audioCodec('libmp3lame')
                // Save the output file to the specified path
                .save(outputFile)
                // Listen for the 'end' event, which is emitted when the ffmpeg command finishes processing
                .on('end', () => {
                    // Log a message to the console when the files are concatenated successfully
                    console.log(`Files have been successfully concatenated: ${outputFile}`);
                    // Resolve the promise when the files are concatenated successfully (when the ffmpeg command finishes processing)
                    resolve();
                })
                // Listen for the 'error' event, which is emitted when an error occurs during processing
                .on('error', (err) => {
                    // Log the error to the console and reject the promise with the error message as the reason for rejection
                    console.error(`Error concatenating files: ${err.message}`);
                    // Reject the promise with the error message as the reason for rejection
                    reject(err);
                });
        });
    });
}

/**
 * Merges audio files in each subdirectory of a specified root directory.
 * 
 * This function iterates through each subdirectory in the 'downloaded' folder of the root directory.
 * For each subdirectory, it creates a corresponding directory in the 'converted' folder
 * (if it doesn't already exist) and then checks for the presence of MP3 files in the subdirectory.
 * If MP3 files are found, it concatenates all MP3 files in that subdirectory into a single file,
 * which is saved in the 'converted' folder.
 *
 * @example await mergeDownloadedFiles();
 */
export async function mergeDownloadedFiles() {
    try {
        // Retrieve all subdirectories in the 'downloaded' folder
        const directories = await getDirectoriesInDirectory(`${rootDirectory}/02.generateTTS/downloaded`);
        // Log the number of subdirectories found in the 'downloaded' folder to the console
        console.log(`Number of folders in the 'downloaded' folder: ${directories.length}`);

        // Iterate through each subdirectory in the 'downloaded' folder
        for (const dir of directories) {
            // Create a directory for converted files if it doesn't exist
            createDirectory(`${rootDirectory}/02.generateTTS/converted/${dir}/`)
                // Log a message to the console when the directory is created successfully
                .then(() => console.log('Folder created successfully.'))
                // Log any errors that occur during the process to the console
                .catch(err => console.error(err));

            // Define the path to the directory containing the downloaded files for the current subdirectory
            const directoryPath = `${rootDirectory}/02.generateTTS/downloaded/${dir}/`;
            // Define the path to the output file (the concatenated audio file)
            const outputPath = `${rootDirectory}/02.generateTTS/converted/${dir}/${dir}.mp3`;

            // Check if the directory contains MP3 files (if not, skip to the next directory)
            if (await hasMp3Files(directoryPath)) {
                // Concatenate all MP3 files in the directory into a single file and save it to the output path
                await concatenateAllAudioFilesInDirectory(directoryPath, outputPath);
                // Log a message to the console when the files are merged successfully
                console.log(`Audio files in folder ${dir} successfully merged`);
            }
            // Else if the directory does not contain MP3 files
            else {
                // Throw an error to stop the process and log a message to the console
                throw new Error(`No MP3 files in folder ${dir}.`);
            }
        }
    } catch (err) {
        // Log any errors that occur during the process
        console.error(err);
    }
}

/**
 * Creates a directory at the specified path. If the directory already exists, it does nothing.
 * 
 * This function wraps the `fs.mkdir` method in a promise, allowing for asynchronous directory creation
 * with error handling. The `recursive: true` option ensures that all necessary parent directories
 * are created if they do not exist.
 *
 * @param {string} directoryPath - The path where the directory is to be created.
 * @returns {Promise<void>}      - A promise that resolves when the directory is successfully created 
 *                                 or already exists, and rejects if an error occurs.
 * 
 * @example await createDirectory('./02.generateTTS/downloaded');
 */
export function createDirectory(directoryPath: string): Promise<void> {
    // Return a Promise that will be resolved when the directory is created or already exists
    return new Promise((resolve, reject) => {
        // Create the directory with the specified path
        fs.mkdir(directoryPath, { recursive: true }, (err) => {
            // Check if there is an error
            if (err) {
                // Log and reject the promise if there is an error
                console.error(`Error creating directory: ${err.message}`);
                // Reject the promise
                reject(err);
            } else {
                // Resolve the promise if the directory is created or already exists
                console.log(`The directory ${directoryPath} has been successfully created or already exists.`);
                // Resolve the promise
                resolve();
            }
        });
    });
}


/**
 * Checks whether a given directory contains any MP3 files.
 * 
 * This asynchronous function reads the contents of the specified directory and 
 * determines if there are any files with the '.mp3' extension. It returns `true` if 
 * MP3 files are found, and `false` otherwise. In case of a reading error, it rejects the promise.
 *
 * @param {string} directoryPath    - The path of the directory to check for MP3 files.
 * @returns {Promise<boolean>}      - A promise that resolves to `true` if MP3 files are present,
 *                                    or `false` if not, and rejects if an error occurs.
 * 
 * @example                         - await hasMp3Files('./audio');
 */
async function hasMp3Files(directoryPath: string): Promise<boolean> {
    // Return a Promise that will be resolved when the directory is read and checked for MP3 files or rejected if an error occurs during the process
    return new Promise((resolve, reject) => {
        // Read the directory to find files with the '.mp3' extension
        fs.readdir(directoryPath, (err, files) => {
            // Check if there is an error reading the directory
            if (err) {
                // Log the error to the console
                console.error(`Error reading the directory: ${err.message}`);
                // Reject the promise with the error message as the reason for rejection
                return reject(err);
            }

            // Check if there are any MP3 files
            const mp3Files = files.filter(file => path.extname(file) === '.mp3');
            // Resolve the promise with true if there are MP3 files or false if there are no MP3 files
            resolve(mp3Files.length > 0);
        });
    });
}



/**
 * Asynchronously retrieves the names of all subdirectories within a specified directory.
 * 
 * This function reads the contents of the directory at the given path and filters out 
 * all entries that are subdirectories. It then returns an array of the names of these subdirectories.
 * In case of a reading error, it rejects the promise with the error.
 *
 * @param {string} directoryPath    - The path of the directory to scan for subdirectories.
 * @returns {Promise<string[]>}     - A promise that resolves to an array of subdirectory names,
 *                                    or rejects if an error occurs during directory reading.
 * 
 * @example                         - await getDirectoriesInDirectory('./audio');
 */
export async function getDirectoriesInDirectory(directoryPath: string): Promise<string[]> {
    // Return a Promise that will be resolved when the directory is read and checked for MP3 files or rejected if an error occurs during the process 
    return new Promise((resolve, reject) => {
        // Read the directory to find subdirectories
        fs.readdir(directoryPath, { withFileTypes: true }, (err, files) => {
            // Check if there is an error reading the directory
            if (err) {
                // Log the error to the console
                console.error(`Error reading the directory: ${err.message}`);
                // Reject the promise with the error message as the reason for rejection
                return reject(err);
            }

            // Filter out the entries that are directories and map their names to an array of strings
            const directories = files.filter(file => file.isDirectory()).map(dir => dir.name);
            // Resolve the promise with the array of directory names
            resolve(directories);
        });
    });
}

/**
 * Doubles the length of a song file if it is shorter than the specified voice duration.
 * 
 * This function first checks the duration of the song file and compares it with the provided 
 * voice duration (including silence). If the song file is shorter, it uses the `ffmpeg` library 
 * to concatenate the song file with itself, effectively doubling its length. The processed file is 
 * then saved. The function uses a callback to notify completion or error.
 *
 * @param {string} songFilePath                 - The path of the song file to be processed.
 * @param {number} voiceDurationWithSilence     - The duration of the voice file including any added silence, in seconds.
 * @param {Function} callback                   - The callback function to execute after processing is complete or in case of an error.
 * 
 * @example                                     - doubleSongIfShorterThanVoice('./song.mp3', 10, () => console.log('Processing complete.'));
 */
function doubleSongIfShorterThanVoice(songFilePath: string, voiceDurationWithSilence: number, callback: () => void) {
    // Get the duration of the song file in seconds and pass it to the callback function when it is retrieved
    getDuration(songFilePath, (songDuration) => {
        // Check if the song file is shorter than the voice file with the added silence at the end
        if (songDuration < voiceDurationWithSilence) {
            // Double the song file using ffmpeg and save it to the specified path
            ffmpeg()
                // Use the song file as input twice (concatenate it with itself)
                .input(songFilePath)
                // Use the song file as input twice (concatenate it with itself)
                .input(songFilePath)
                // Use the concat filter to concatenate the audio streams into a single audio stream with the name 'out' (the name is arbitrary) 
                .complexFilter([
                    // That code means that the first input (songFilePath) will be concatenated with the second input (songFilePath)
                    '[0:a][1:a]concat=n=2:v=0:a=1[out]',
                    // 'out' is the name of the output stream.
                ], 'out')
                // Set the audio codec to MP3 (libmp3lame)
                .audioCodec('libmp3lame')
                // Save the output file to the specified path (overwrite if it already exists)
                .save(songDoubledFilePath)
                // Listen for the 'end' event, which is emitted when the ffmpeg command finishes processing
                .on('end', () => {
                    // Log a message to the console when the file is processed successfully/
                    console.log(`The file song.mp3 has been doubled: ${songDoubledFilePath}`);
                    // Invoke the callback function when the file is processed successfully
                    callback();
                })
                // Listen for the 'error' event, which is emitted when an error occurs during processing    
                .on('error', (err) => {
                    // Throw an error if the file cannot be processed
                    throw new Error(`Error in doubling the file song.mp3: ${err.message}`);
                });
        } else {
            // Log a message to the console if the file is already long enough
            console.log('The file song.mp3 is long enough.');
            // Directly invoke the callback if song.mp3 is already long enough (no processing is needed)
            callback();
        }
    });
}


/**
 * Retrieves the duration of a media file using ffmpeg's ffprobe.
 *
 * This function uses the ffprobe command from the ffmpeg library to get metadata about
 * a specified media file. It extracts the duration of the file from this metadata and passes
 * it to the provided callback function. If an error occurs, it logs the error but does not call the callback.
 *
 * @param {string} filePath     - The path to the media file.
 * @param {Function} callback   - The callback function to execute with the duration of the file.
 *                                The duration is passed as a parameter to the callback.
 *
 * @example                     - getDuration('path/to/file.mp3', (duration) => console.log(duration));
 */
function getDuration(filePath: string, callback: (duration: number) => void) {
    // Use ffprobe to get metadata about the file and extract the duration from the metadata
    ffmpeg.ffprobe(filePath, (err, metadata) => {
        // Check if there is an error
        if (err) {
            // Log the error to the console and return from the function to prevent further execution (don't call the callback)
            console.error(`Error getting file duration: ${err.message}`);
            // Return from the function to prevent further execution (don't call the callback)
            return;
        }
        // Extract the duration from the metadata
        const duration = metadata.format.duration;
        // If the duration is undefined
        if (duration !== undefined) {
            // Call the callback function with the duration as a parameter
            callback(duration);
        }
        // Else if the duration is undefined (this should never happen)
        else {
            // Throw an error to stop the process and log a message to the console (don't call the callback)
            throw new Error("Unable to determine file duration.");
        }
    });
}

/**
 * Adds a specified duration of silence to the end of an audio file.
 *
 * This function uses the ffmpeg library to process an existing audio file, appending
 * silence of a specified length to its end. The result is saved to a new file path.
 * It invokes a callback function upon successful completion or logs an error if one occurs.
 *
 * @param {string} voiceFilePath            - The path to the original audio file.
 * @param {string} voiceWithSilencePath     - The path where the modified audio file with added silence will be saved.
 * @param {number} silenceDurationMs        - The duration of silence to add, in milliseconds.
 * @param {Function} callback               - The callback function to execute after processing is complete.
 *
 * @example                                 - addSilenceToEnd('./voice.mp3', './voiceWithSilence.mp3', 5000, () => console.log('Processing complete.'));
 */
function addSilenceToEnd(voiceFilePath: string, voiceWithSilencePath: string, silenceDurationMs: number, callback: () => void) {
    // Use ffmpeg to add silence to the end of the file and save it to the specified path (overwrite if it already exists)
    ffmpeg(voiceFilePath)
        // Add the silence filter to the audio stream  (Add silence to the end)
        .audioFilters(`apad=pad_dur=${silenceDurationMs / 1000}`)
        // Set the audio codec to MP3 (libmp3lame)
        .audioCodec('libmp3lame')
        // Save the output file to the specified path (overwrite if it already exists)
        .save(voiceWithSilencePath)
        // Listen for the 'end' event, which is emitted when the ffmpeg command finishes processing
        .on('end', () => {
            // Log a message to the console when the file is processed successfully
            console.log(`Silence added to the end of the file: ${voiceWithSilencePath}`);
            // Invoke the callback function after processing is complete
            callback();
        })
        // Listen for the 'error' event, which is emitted when an error occurs during processing
        .on('error', (err) => {
            // Throw an error if the file cannot be processed and log a message to the console
            throw new Error(`Error adding silence to the end of the file: ${err.message}`);
        });
}

/**
 * Applies a fade-out effect to the end of an audio file.
 *
 * This function uses the ffmpeg library to process the specified audio file, applying a fade-out effect
 * starting at a specified point until the end of the file. The processed file is then saved to a new location.
 * A callback function is invoked upon successful completion or in case of an error.
 *
 * @param {string} inputFilePath        - The path to the original audio file.
 * @param {string} outputFilePath       - The path where the modified audio file with the fade-out effect will be saved.
 * @param {number} fadeDurationMs       - The duration of the fade-out effect in milliseconds.
 * @param {number} totalDuration        - The total duration of the audio file in seconds.
 * @param {Function} callback           - The callback function to execute after processing is complete.
 *
 * @example                             - fadeAudioEnd('./audio.mp3', './audioFaded.mp3', 5000, 60, () => console.log('Processing complete.'));
 */
function fadeAudioEnd(inputFilePath: string, outputFilePath: string, fadeDurationMs: number, totalDuration: number, callback: () => void) {
    // Calculate the start time of the fade-out effect (the fade-out effect should start at the end of the file)
    const fadeStart = totalDuration - fadeDurationMs / 1000;

    // Use ffmpeg to apply the fade-out effect to the file and save it to the specified path (overwrite if it already exists)
    ffmpeg(inputFilePath)
        // Add the fade-out filter to the audio stream (Apply the fade-out effect)
        .audioFilters(`afade=t=out:st=${fadeStart}:d=${fadeDurationMs / 1000}`)
        // Set the audio codec to MP3 (libmp3lame)
        .audioCodec('libmp3lame')
        // Save the output file to the specified path (overwrite if it already exists)
        .save(outputFilePath)
        // Listen for the 'end' event, which is emitted when the ffmpeg command finishes processing
        .on('end', () => {
            // Log a message to the console when the file is processed successfully
            console.log(`File has been processed with a fade-out at the end: ${outputFilePath}`);
            // Invoke the callback function after processing is complete (when the ffmpeg command finishes processing)
            callback(); // Invoke the callback function on successful completion
        })
        // Listen for the 'error' event, which is emitted when an error occurs during processing
        .on('error', (err) => {
            // Throw an error if the file cannot be processed and log a message to the console
            throw new Error(`Error in processing the file: ${err.message}`);
        });
}

/**
 * Merges a voice file and a song file, applying delay and trimming to create a combined audio track.
 *
 * This function uses ffmpeg to process two audio files. It delays the voice file by a fixed amount,
 * trims the song file to match the total duration, adjusts its volume, and then mixes both tracks.
 * The final combined audio is saved to a temporary file. A callback function is called with the total
 * duration of the combined audio upon successful completion or logs an error if one occurs.
 *
 * @param {string} songAudioVolume          - The volume level to set for the song.
 * @param {string} voiceFilePath            - The path to the voice audio file.
 * @param {string} songFilePath             - The path to the song audio file.
 * @param {number} voiceDuration            - The duration of the voice file in seconds.
 * @param {string} temporaryAudioFilePath   - The path where the combined audio file will be saved temporarily.
 * @param {Function} onFinish               - The callback function to execute with the duration of the combined audio.
 *
 * @example                                 - mergeAndTrimSong('0.5', './voice.mp3', './song.mp3', 10, './combined.mp3', (duration) => console.log(duration));
 */
function mergeAndTrimSong(songAudioVolume: string, voiceFilePath: string, songFilePath: string, voiceDuration: number, temporaryAudioFilePath: string, onFinish: (duration: number) => void) {
    // Define the delay to be applied to the voice file (in milliseconds)
    const delayMs = 5000;
    // Calculate the total duration of the final audio (in seconds)
    const totalDuration = voiceDuration + delayMs / 1000;

    // Use ffmpeg to merge the voice file and the song file, applying delay and trimming the song file to match the total duration of the final audio file (overwrite if it already exists)
    ffmpeg()
        // Use the voice file as input (Add delay to the voice file)
        .input(voiceFilePath)
        // Use the song file as input (Trim the song file)
        .input(songFilePath)
        // 'complexFilter' allows us to apply multiple filters to the audio stream (in this case, we apply delay to the voice file and trim the song file to match the total duration of the final audio file)
        .complexFilter([
            // Add delay to the voice file
            `[0:a]adelay=${delayMs}|${delayMs}[voiceDelayed]`,
            // Trim the song file
            `[1:a]atrim=0:${totalDuration},asetpts=PTS-STARTPTS[songTrimmed]`,
            // Adjust the volume of the song
            `[songTrimmed]volume=${songAudioVolume}[songAdjusted]`,
            // Mix both audio tracks
            `[voiceDelayed][songAdjusted]amix=inputs=2:duration=longest`
        ])
        // Set the audio codec to MP3 (libmp3lame)
        .audioCodec('libmp3lame')
        // Save the output file to the specified path (overwrite if it already exists)
        .save(temporaryAudioFilePath)
        // Listen for the 'end' event, which is emitted when the ffmpeg command finishes processing
        .on('end', () => {
            // Log a message to the console when the file is processed successfully
            console.log(`The file has been generated: ${temporaryAudioFilePath}`);
            // Invoke the callback function after processing is complete (when the ffmpeg command finishes processing)
            onFinish(totalDuration);
        })
        // Listen for the 'error' event, which is emitted when an error occurs during processing
        .on('error', (err) => {
            // Throw an error if the file cannot be processed and log a message to the console
            throw new Error(`Error in processing the file: ${err.message}`);
        });
}

/**
 * Asynchronously deletes a file at the specified path.
 *
 * This function wraps the `unlink` function from Node.js's `fs` module in a Promise.
 * It attempts to delete the file located at `filePath`. The Promise is resolved if the
 * file is successfully deleted, or it is rejected with an error if the deletion fails.
 *
 * @param {string} filePath - The path of the file to be deleted.
 * @returns {Promise<void>} - A promise that resolves if the file is successfully deleted, or rejects with an error.
 *
 * @example                 - await deleteFile('./audio.mp3');
 */
export function deleteFile(filePath: string): Promise<void> {
    // Return a Promise that will be resolved when the file is successfully deleted or rejected if an error occurs during the process
    return new Promise((resolve, reject) => {
        // Delete the file at the specified path (unlink is the Node.js equivalent of rm) and resolve or reject the promise based on the result of the operation
        unlink(filePath, (err) => {
            // Check if there is an error deleting the file
            if (err) {
                // Reject the promise if an error occurs during the process (with the error message as the reason for rejection) 
                reject(err);
                // Return from the function to prevent further execution (don't call the callback)
                return;
            }
            // Resolve the promise when the file is successfully deleted (when the unlink operation is complete)
            resolve();
        });
    });
}

/**
 * Asynchronously deletes a file or a directory at the specified path.
 *
 * This function first checks whether the path is a directory or a file.
 * If it is a directory, it removes the directory and all its contents recursively.
 * If it is a file, it deletes the file. The function uses Node.js's `fs` module.
 * The operation is performed asynchronously and wrapped in a Promise.
 *
 * @param {string} path         - The path of the file or directory to be deleted.
 * @returns {Promise<void>}     - A promise that resolves if the deletion is successful, or rejects with an error.
 *
 * @example                     - await deletePath('./audio');
 */
export function deletePath(path: string): Promise<void> {
    // Return a Promise that will be resolved when the file or directory is successfully deleted or rejected if an error occurs during the process
    return new Promise((resolve, reject) => {
        // Check if the path is a file or a directory and resolve or reject the promise based on the result of the operation
        fs.stat(path, (err, stats) => {
            // Check if there is an error
            if (err) {
                // Reject the promise if an error occurs during the process (with the error message as the reason for rejection)
                return reject(err);
            }

            // Check if the path is a directory or a file and resolve or reject the promise based on the result of the operation
            if (stats.isDirectory()) {
                // Delete the directory recursively if it is a directory
                fs.rm(path, { recursive: true, force: true }, (err) => {
                    // Check if there is an error deleting the directory recursively and reject the promise if there is an error
                    if (err) reject(err);
                    // Resolve the promise when the directory is successfully deleted (when the rm operation is complete)
                    else resolve();
                });
            }
            // Else if the path is a file (not a directory)
            else {
                // Delete the file if it is a file (not a directory)
                fs.unlink(path, (err) => {
                    // Check if there is an error deleting the file and reject the promise if there is an error
                    if (err) reject(err);
                    // Resolve the promise when the file is successfully deleted (when the unlink operation is complete)
                    else resolve();
                });
            }
        });
    });
}

/**
 * Asynchronously selects a random MP3 file from a specified directory.
 *
 * This function reads the directory specified by `directoryPath`, filters for MP3 files,
 * and then randomly selects one of these files. If no MP3 files are found, or if an error occurs
 * while reading the directory, the promise is rejected with an appropriate error message.
 *
 * @param {string} directoryPath        - The path of the directory to search for MP3 files.
 * @returns {Promise<string>}           - A promise that resolves with the path to the randomly selected MP3 file,
 *                                        or rejects with an error if no MP3 files are found or if an error occurs.
 *
 * @example                             - await getRandomAudioFile('./audio');
 */
export function getRandomAudioFile(directoryPath: string): Promise<string> {
    // Return a Promise that will be resolved when the random file is selected or rejected if an error occurs during the process
    return new Promise((resolve, reject) => {
        // Read the directory to find files
        fs.readdir(directoryPath, (err, files) => {
            // Check if there is an error reading the directory and reject the promise if there is an error
            if (err) {
                // Log the error to the console and reject the promise with the error message as the reason for rejection
                return reject(err);
            }

            // Filter the files to find MP3 files
            const mp3Files = files.filter(file => path.extname(file) === '.mp3');

            // Check if there are any MP3 files in the directory and reject the promise if there are no MP3 files in the directory
            if (mp3Files.length === 0) {
                // Log a message to the console and reject the promise with an error message as the reason for rejection
                return reject(new Error('No audio files found in the directory.'));
            }

            // Select a random MP3 file
            const randomFile = mp3Files[Math.floor(Math.random() * mp3Files.length)];

            // Return the path to the selected file
            resolve(path.join(directoryPath, randomFile));
        });
    });
}
