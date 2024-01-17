/** Description: This file creates the voice using TTS and merges it with a song. **/

/** Imports **/
import { AiGeneratedPictures } from './src/ai-generate-pictures/aiGeneratePictures';
import * as dotenv from 'dotenv';
// Declare the process.env variable.
dotenv.config();

// Check if the AI_PICTURE_BASE_URL variable is defined in the .env file.
if (!process.env.AI_PICTURE_BASE_URL) {
    throw new Error("AI_PICTURE_BASE_URL is not defined in your .env file");
}
// Assign the path to the background music folder to a variable.
const generateImageUrl = process.env.AI_PICTURE_BASE_URL;

/** Define the audio function. **/
async function images() {
    // Call the AiGeneratedPictures function to generate the pictures.
    AiGeneratedPictures();
}

// Call the audio function.
images();

