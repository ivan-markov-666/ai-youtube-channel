/** Description: This file creates text content automatically using AI. */

/** Imports **/
import { appendFileSync } from 'fs';
import { readMessagesFromFilePath, sendRequestToAI, recreateFile, removeEmptyNewLines, AIResponse } from './src/ai-generate-content/createTextContentFromPrompt';
import * as dotenv from 'dotenv';
dotenv.config();

/** Declarations **/
// Verify that the necessary environment variables are defined in the .env file.
if (!process.env.AI_TEXT_BASE_URL) {
    throw new Error("AI_TEXT_BASE_URL is not defined in your .env file");
}
if (!process.env.GENERATE_KEY_POINTS_SYSTEM_MESSAGE) {
    throw new Error("GENERATE_KEY_POINTS_SYSTEM_MESSAGE is not defined in your .env file");
}
if (!process.env.GENERATE_THEME_SYSTEM_MESSAGE_1) {
    throw new Error("GENERATE_THEME_SYSTEM_MESSAGE_1 is not defined in your .env file");
}
if (!process.env.GENERATE_THEME_SYSTEM_MESSAGE_2) {
    throw new Error("GENERATE_THEME_SYSTEM_MESSAGE_2 is not defined in your .env file");
}
if (!process.env.GENERATE_DESCRIPTION_SYSTEM_MESSAGE) {
    throw new Error("GENERATE_DESCRIPTION_SYSTEM_MESSAGE is not defined in your .env file");
}
// The base URL of the AI server
const baseUrl = process.env.AI_TEXT_BASE_URL;
// The path to the file containing the message to be sent to the AI server
const fileContainingMessagesForAi = './01.generateTextContent/topics.txt';
// The path to the file where the response from the AI server will be saved
const outputFilePath = './02.generateTTS/TextForSpeach/text-for-speach.txt';
// System message to be sent to the AI
const keyPointsSystemMessage = process.env.GENERATE_KEY_POINTS_SYSTEM_MESSAGE;
const themeSystemMessage1 = process.env.GENERATE_THEME_SYSTEM_MESSAGE_1
const themeSystemMessage2 = process.env.GENERATE_THEME_SYSTEM_MESSAGE_2
const descriptionSystemMessage = process.env.GENERATE_DESCRIPTION_SYSTEM_MESSAGE;
// If true, a description will be generated for the text. If false, no description will be generated.
const generateDescriptionToggle = false;
// Define the text function that will be executed when the script is run from the command line.
async function text() {

    // Check if the output file exists and delete it if it does exist, then create it again (to clear it). We need to have an empty file before we start writing to it.
    recreateFile(outputFilePath);

    // Read the messages from the file and store them in an array of strings (each string is a message) and then process each message.
    // The messages are separated by the word "topic:".
    // This is the word that we use to separate the messages in the file.
    // The word "topic:" is not included in the messages.
    // For more details see the file "topics.txt" in the folder "01.generateTextContent".
    const messagesForAi = readMessagesFromFilePath(fileContainingMessagesForAi, 'topic:');
    // Array for storing all key points from all messages.
    let allKeyPointsText = [];

    // Process each message from the file.
    for (const messageForAi of messagesForAi) {
        // Define variables for storing the theme, the quote and the key points.
        let theme = '';
        let quote = '';
        let keyPoints: string[] = [];
        // Flag for indicating if we are recording key points.
        let recordingKeyPoints = false;

        // Loop through each line of the message and process it.
        for (const line of messageForAi) {
            // If the line starts with "Theme:", then we are recording the theme.
            if (line.startsWith('Theme:')) {
                // Get the theme from the line.
                theme = line.substring('Theme:'.length).trim();
                // Log the theme to the console.
                console.log('Theme:', theme);
            }
            // If the line starts with "Quote:", then we are recording the quote.
            else if (line.startsWith('Quote:')) {
                // Get the quote from the line.
                quote = line.substring('Quote:'.length).trim();
                // Log the quote to the console.
                console.log('Quote:', quote);
            }
            // If the line starts with "Key Points:", then we are recording the key points.  
            else if (line.startsWith('Key Points:')) {
                // Set the flag to true.
                recordingKeyPoints = true;
                // Continue to the next line.
                continue;
            }
            // If the 'recordingKeyPoints' flag is true, then we are recording the key points.
            else if (recordingKeyPoints) {
                // Push the line to the array of key points.
                keyPoints.push(line);
            }
        }

        // Record the response to the file (append it to the file).
        appendFileSync(outputFilePath, `Title: ${theme}\n\nTTS:\n${quote}\n`);

        // Define a variable for storing the generated text.
        let aiGeneratedTextWithNoNewLines = "";

        // Process each key point from the message.
        if (keyPoints.length > 0) {
            // Loop through each key point and process it.
            for (const point of keyPoints) {
                // Send a request to the AI server and get the response.
                // The response will contain the generated text for the key point.
                const keyPointResponse: AIResponse = await sendRequestToAI(`${keyPointsSystemMessage}\n${theme}\nPlease generate text for that bullet point.`, point, baseUrl);
                // Get the value of the key point from the response.
                let keyPointValue = "";
                // Check if the response contains a message.
                if (keyPointResponse.choices && keyPointResponse.choices.length > 0 && keyPointResponse.choices[0].message) {
                    // Get the value of the message.
                    keyPointValue = keyPointResponse.choices[0].message.content;
                }
                // Remove empty new lines from the text.
                keyPointValue = removeEmptyNewLines(keyPointValue);
                // Push the key point value to the array of key points.
                allKeyPointsText.push(keyPointValue);
                // Record the response to the file (append it to the file).
                appendFileSync(outputFilePath, keyPointValue);
            }
        }
        // If there are no key points, then generate text for the theme and the quote.
        else {
            // Send a request to the AI server and get the response.
            // The response will contain the generated text for the theme and the quote.
            const aiGeneratedText: AIResponse = await sendRequestToAI(`${themeSystemMessage1}\n${theme}\n${themeSystemMessage2}`, quote, baseUrl);
            // Check if the response contains a message.
            if (aiGeneratedText.choices && aiGeneratedText.choices.length > 0 && aiGeneratedText.choices[0].message) {
                // Get the value of the message.
                aiGeneratedTextWithNoNewLines = aiGeneratedText.choices[0].message.content;
            }
            // Remove empty new lines from the text.
            aiGeneratedTextWithNoNewLines = removeEmptyNewLines(aiGeneratedTextWithNoNewLines);
            // Record the response to the file (append it to the file).
            appendFileSync(outputFilePath, aiGeneratedTextWithNoNewLines);
        }

        // Generate description for the text if the flag is true.
        if (generateDescriptionToggle) {
            // Check if there are any key points.
            if (keyPoints.length > 0) {
                // Combine all key points into one text (separated by a space).
                const combinedKeyPointsText = allKeyPointsText.join(" ");
                // Send a request to the AI server and get the response.
                // The response will contain the generated description for the text.
                const descriptionResponse: AIResponse = await sendRequestToAI(descriptionSystemMessage, combinedKeyPointsText, baseUrl);
                // Define a variable for storing the generated description.
                let description = "";
                // Check if the response contains a message.
                if (descriptionResponse.choices && descriptionResponse.choices.length > 0 && descriptionResponse.choices[0].message) {
                    // Get the value of the message.
                    description = descriptionResponse.choices[0].message.content;
                }

                // Record the response to the file (append it to the file).
                appendFileSync(outputFilePath, `\n\nDescription:\n${description}\n\n`);
            }
            // If there are no key points, then generate description for the generated text from the AI based on the theme and the quote.
            else {
                // Send a request to the AI server and get the response.
                // The response will contain the generated description for the text.
                const descriptionResponse: AIResponse = await sendRequestToAI(descriptionSystemMessage, aiGeneratedTextWithNoNewLines, baseUrl);
                // Define a variable for storing the generated description.
                let description = "";
                // Check if the response contains a message.
                if (descriptionResponse.choices && descriptionResponse.choices.length > 0 && descriptionResponse.choices[0].message) {
                    // Get the value of the message.
                    description = descriptionResponse.choices[0].message.content;
                }

                // Record the response to the file (append it to the file).
                appendFileSync(outputFilePath, `\n\nDescription:\n${description}\n\n`);
            }
        }
        // If the flag is false, then just record an empty description.
        else {
            // Record the response to the file (append it to the file).
            appendFileSync(outputFilePath, `\n\nDescription:\n\n`);
        }
    }
}

// Run the text function to start the script.
text();
