/** This file wii be used to check the video format. You can use for analyze video files, before convert them to a standardized format. */

// Import the necessary modules
import { analyzeVideoFile } from './src/video-generate/dsl';
import * as dotenv from 'dotenv';
// Declare the process.env variable.
dotenv.config();

// Check if the VIDEOS_RAW_FORMAT_FOLDER_PATH variable is defined in the .env file.
if (!process.env.VIDEOS_CHECK_FILE) {
    throw new Error("VIDEOS_CHECK_FILE is not defined in your .env file");
}
// Assign the path to the video file to be analyzed to a variable
const videoFilePath = process.env.VIDEOS_CHECK_FILE;

// Analyze the video file and log the metadata to the console if the analysis is successful or log an error message if the analysis fails
analyzeVideoFile(videoFilePath)
    .then(metadata => {
        console.log('Metadata:', metadata);
        // You can calculate the 'metadata' by your needs. For example, you can calculate the duration of the video file. Or you can calculate the width and height of the video file. Etc.
    })
    // Log an error message if the analysis fails
    .catch(error => console.error(error));
