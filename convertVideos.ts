/** This file will be used to convert the video files to a standardized format. It works only for mp4 file. */

// Import the necessary modules
import path from 'path';
import { ensureDirectoryExists, convertVideos, containsVideoFiles } from './src/domain-specific-language/dsl-ts';
import * as dotenv from 'dotenv';
// Declare the process.env variable.
dotenv.config();

// Check if the VIDEOS_RAW_FORMAT_FOLDER_PATH variable is defined in the .env file.
if (!process.env.VIDEOS_RAW_FORMAT_FOLDER_PATH) {
    throw new Error("VIDEOS_RAW_FORMAT_FOLDER_PATH is not defined in your .env file");
}
// Assign the path to the directory containing the video files to be converted to a variable
const videoFolderPath = process.env.VIDEOS_RAW_FORMAT_FOLDER_PATH;
// Assign the name of the directory where the converted video files should be saved to a variable
const convertedDirectoryName = 'converted';
// Check that the videoFolderPath contains video files
const hasVideos = containsVideoFiles(videoFolderPath);
if (!hasVideos) {
    // If the directory does not contain video files, stop the program and throw an error message to the console
    throw new Error(`No video files found in the directory. Please provide folder containing video files. Please provide video file with .mp4, .avi, .mov, .wmv, .mkv format or add new extension in the 'src/video-generate/dsl.ts' method.`);
}

// Assign the path to the directory where the converted video files should be saved to a variable
const convertedDirectory = path.join(videoFolderPath, convertedDirectoryName);
// Ensure that the directory exists
ensureDirectoryExists(convertedDirectory);
// Convert the video files in the directory to a standardized format and save them in the converted directory
convertVideos(videoFolderPath, convertedDirectoryName);