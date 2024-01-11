/*  This file will be used to split the video files into smaller parts.
 *  The videos will be split into two parts. The first part will be taken from the beginning of the video file and it will be saved as result in the cut directory.
 */

// Import the necessary modules
import { trimVideos } from './src/video-generate/dsl';

// Assign the path to the directory containing the video files that will be split to a variable
const videoFolderPath = './videos/landscape/converted/';
// The interval in seconds at which the video files should be split (this will be the duration of the result video files)
const splitSeconds = 6;

// Split the video files in two parts, and save the first part in the cut directory
trimVideos(videoFolderPath, splitSeconds);
