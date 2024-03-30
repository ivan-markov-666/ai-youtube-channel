/** This file contains all metghods related to the video generation process. */

import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { ffMpegPath } from '../../config';

// Get the path to the ffmpeg executable file from the ffmpeg-static package.
ffmpeg.setFfmpegPath(ffmpegStatic || ffMpegPath);

/**
 * Asynchronously analyzes a video file and retrieves its metadata.
 *
 * This function uses the ffprobe tool from the ffmpeg library to analyze the specified video file.
 * It returns a Promise that resolves with the metadata of the video file if the analysis is successful.
 * If an error occurs during the analysis, the promise is rejected with an appropriate error message.
 *
 * @param {string} videoFilePath            - The path to the video file to be analyzed.
 * @returns {Promise<ffmpeg.FfprobeData>}   - A promise that resolves with the video file's metadata,
 *                                            or rejects with an error message if the analysis fails.
 *
 * @example
 * analyzeVideoFile('/path/to/video.mp4')
 *   .then(metadata => console.log('Video metadata:', metadata))
 *   .catch(err => console.error('Error analyzing video file:', err));
 */
export function analyzeVideoFile(videoFilePath: string): Promise<ffmpeg.FfprobeData> {
    return new Promise((resolve, reject) => {
        // Use ffprobe to analyze the video file
        ffmpeg.ffprobe(videoFilePath, (err, metadata) => {
            if (err) {
                // Reject the promise if an error occurs during analysis
                reject(`Error analyzing video file: ${err.message}`);
            } else {
                // Resolve the promise with the metadata of the video file
                resolve(metadata);
            }
        });
    });
}

/**
 * Ensures that a directory exists at the given path. If the directory does not exist, it is created.
 *
 * This function uses Node.js's File System module to check if a directory exists at the specified `directoryPath`.
 * If the directory does not exist, it creates the directory with the `recursive: true` option, which also creates
 * all necessary parent directories. The function logs to the console whether the directory was created or already existed.
 *
 * @param {string} directoryPath - The path where the directory should exist.
 */
export function ensureDirectoryExists(directoryPath: string) {
    // Check if the directory exists
    if (!fs.existsSync(directoryPath)) {
        // Create the directory if it does not exist
        fs.mkdirSync(directoryPath, { recursive: true });
        console.log(`The directory ${directoryPath} was created.`);
    } else {
        // Log if the directory already exists
        console.log(`The directory ${directoryPath} already exists.`);
    }
}

/**
 * Converts all MP4 video files in a specified directory to a standardized format and saves them in a specified converted directory.
 *
 * This function searches for all files ending with '.mp4' in the given directory.
 * Each video file is processed using ffmpeg with specified output options including
 * resolution, frame rate, bitrate, encoding speed, quality-to-file size ratio,
 * pixel format, and color space. The converted files are saved in the specified 'convertedDirectory'
 * within the original directory, with 'converted_' prefixed to their original filenames.
 *
 * @param {string} directoryPath - The path of the directory containing the MP4 files to be converted.
 * @param {string} convertedDirectory - The name of the subdirectory within the original directory where converted files will be saved.
 */
export function convertVideos(directoryPath: string, convertedDirectory: string) {
    // Read the directory and filter out all MP4 files
    const videoFiles = fs.readdirSync(directoryPath)
        .filter(file => file.endsWith('.mp4'));

    // Process each video file with ffmpeg
    videoFiles.forEach(file => {
        const filePath = path.join(directoryPath, file);
        const outputFilePath = path.join(directoryPath, convertedDirectory, `converted_${file}`);

        ffmpeg(filePath)
            .outputOptions([
                '-vf scale=1920:1080',  // Set resolution to 1920x1080
                '-r 30',                // Set frame rate to 30 fps
                '-b:v 4000k',           // Set a constant bitrate of 4000 kbps
                '-preset veryfast',     // Set a faster encoding speed
                '-crf 18',              // Balance between quality and file size
                '-pix_fmt yuv420p',     // Set the pixel format
                '-colorspace bt709'     // Set the color space to BT.709
            ])
            .save(outputFilePath)
            .on('end', () => console.log(`Conversion of ${file} completed.`))
            .on('error', err => console.error(`Error converting ${file}: ${err.message}`));
    });
}

/**
 * Checks if a directory contains mp4 video files.
 *
 * @param directoryPath The path of the directory to check for video files.
 * @returns `true` if the directory contains mp4 video files, `false` otherwise.
 */
export function containsVideoFiles(directoryPath: string): boolean {
    const videoExtensions = new Set(['.mp4']);

    try {
        const files = fs.readdirSync(directoryPath);
        return files.some(file => videoExtensions.has(path.extname(file).toLowerCase()));
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error(`Error reading the directory: ${err.message}`);
        } else {
            console.error('An unknown error occurred');
        }
        return false;
    }
}

/**
 * Trims all MP4 video files in a specified directory to a maximum duration.
 *
 * This function filters for MP4 files in the given directory and trims each file to the specified
 * maximum duration using ffmpeg. The trimmed videos are saved in a 'cut' subdirectory within
 * the original directory. It logs to the console upon completion of each file's trimming or in case of an error.
 *
 * @param {string} directoryPath - The path of the directory containing the MP4 files to be trimmed.
 * @param {number} maxDuration - The maximum duration in seconds to which each video file should be trimmed.
 */
export function trimVideos(directoryPath: string, maxDuration: number) {
    // Read the directory and filter out all MP4 files
    const videoFiles = fs.readdirSync(directoryPath)
        .filter(file => file.endsWith('.mp4'));

    // Create a directory for trimmed videos
    const cutDirectory = path.join(directoryPath, 'cut');
    ensureDirectoryExists(cutDirectory);

    // Process each video file with ffmpeg
    videoFiles.forEach(file => {
        const filePath = path.join(directoryPath, file);
        const outputFilePath = path.join(cutDirectory, file);

        ffmpeg(filePath)
            .outputOptions([
                '-t', maxDuration.toString() // Trim the video to the maximum duration
            ])
            .save(outputFilePath)
            .on('end', () => console.log(`Trimming of ${file} completed.`))
            .on('error', err => console.error(`Error trimming ${file}: ${err.message}`));
    });
}

// The following functions are not used in the project, but they are included for reference.
// The function was never tested, so it may not work as expected.
/**
 * Splits a video file into multiple segments of specified duration.
 *
 * This function checks if the specified video file exists. If it does, it retrieves the video's duration
 * using ffprobe. Then, it splits the video into segments of the specified duration using ffmpeg.
 * Each segment is saved in a 'cut' subdirectory within the same directory as the original video file.
 * The function logs the completion of each segment's creation or any errors that occur.
 *
 * @param {string} videoFilePath   - The path of the video file to be split into segments.
 * @param {number} segmentDuration - The duration in seconds of each segment.
 * @example                        - splitVideoIntoSegments('C:/Videos/example.mp4', 8);  
 */
export function splitVideoIntoSegments(videoFilePath: string, segmentDuration: number): void {
    // Check if the video file exists
    if (!fs.existsSync(videoFilePath)) {
        console.error('File not found:', videoFilePath);
        return;
    }

    // Get the directory path and base name of the video file
    const directoryPath = path.dirname(videoFilePath);
    const baseName = path.basename(videoFilePath, path.extname(videoFilePath));
    
    // Create a directory for the video segments
    const cutDirectory = path.join(directoryPath, 'cut');
    ensureDirectoryExists(cutDirectory);

    // Use ffprobe to get the video's duration
    ffmpeg.ffprobe(videoFilePath, (err, metadata) => {
        if (err) {
            console.error('Error getting file info:', err.message);
            return;
        }

        const videoDuration = metadata.format.duration;
        if (videoDuration === undefined) {
            console.error('Undefined video duration.');
            return;
        }

        // Split the video into segments
        let startTime = 0;
        while (startTime < videoDuration) {
            const segmentPath = path.join(cutDirectory, `${baseName}_segment_${startTime}.mp4`);
            
            ffmpeg(videoFilePath)
                .setStartTime(startTime)
                .setDuration(segmentDuration)
                .output(segmentPath)
                .on('end', () => console.log(`Segment created: ${segmentPath}`))
                .on('error', err => console.error('Error creating segment:', err.message))
                .run();

            startTime += segmentDuration;
        }
    });
}