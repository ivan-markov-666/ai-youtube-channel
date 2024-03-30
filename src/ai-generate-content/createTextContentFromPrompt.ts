/** Description: This file contains methods for extending text using AI. */

/** Imports **/
import { existsSync, unlinkSync, writeFileSync, readFileSync } from 'fs';
import fetch from 'node-fetch';

/** Interfaces **/
// Define the interface for the response from the AI server.
export interface AIResponse {
    // The response is an array of choices. Each choice has a message. The message has content. The content is a string.
    choices: { message: { content: string } }[];
}

/** Methods **/
/**
 * @description             This function can extend the text if it is not long enough. It uses AI to extend the text.
 * @param originalText      Provide the original text that needs to be extended.
 * @param maxWords          Provide the maximum number of words that the text should have. If the text is shorter than this number, it will be extended. If the text is longer than this number, it will not be extended. 
 * @param systemMessage     Provide a message that will be sent to the AI. This message should be a system message that will be sent to the AI. It should not be a message that the user has written.
 * @returns                 Returns a promise that will resolve with the extended text.
 * @example                 const extendedText = await extendText("This text should be extendet.", 1000, "Please extend this text.");
 */
export async function extendText(originalText: string, maxWords: number, systemMessage: string, baseURL: string): Promise<string> {
    // Initialize extendedText with the original text. We are doying this because we want to keep the original text and return it if is enough long.
    let extendedText = originalText;
    // Check if the text is shorter than maxWords
    while (!hasMoreThanWords(originalText, maxWords)) {
        // Send a request to AI with the system message and the current text
        const response: AIResponse = await sendRequestToAI(systemMessage, extendedText, baseURL);
        // Check if AI returned a valid response
        if (response.choices && response.choices.length > 0 && response.choices[0].message) {
            // Append AI's response to the current text
            extendedText += " " + response.choices[0].message.content;
        } else {
            // Break the loop if AI does not return a response
            break;
        }
    }
    // Return the extended text
    return extendedText;
}

/**
 * @description             Checks if a given string has more words than the specified maximum number of words.
 * @param str               Provide the string to be checked.
 * @param maxWords          Provide the maximum number of words to check against the string.
 * @returns                 Returns true if the string has more than the specified number of words, otherwise returns false.
 * @example                 const hasMoreThanWords = hasMoreThanWords("This is a test string", 3)
 */
export function hasMoreThanWords(str: string, maxWords: number): boolean {
    // Split the string into words based on spaces
    const words = str.split(/\s+/);
    // Check if the number of words is greater than maxWords
    return words.length > maxWords;
}

/**
 * @description             Removes lines that contain only whitespace and newline characters from a string.
 * @param str               Provide the string from which to remove empty new lines.
 * @returns                 Returns the new string (with empty new lines removed).
 * @example                 const cleanedString = removeEmptyNewLines("This is a test\n\n string\n  \nwith empty lines.");
 */
export function removeEmptyNewLines(str: string): string {
    // Remove lines that contain only space and newline characters
    // The regular expression /^\s*[\r\n]/gm matches lines with only whitespaces
    // ^\s* matches any whitespace characters at the beginning of a line
    // [\r\n] matches the newline characters
    // The 'g' flag is for global search, and 'm' flag is for multiline search
    return str.replace(/^\s*[\r\n]/gm, '');
}

/**
 * @description             Recreates a file at the specified path. If the file exists, it is deleted and a new empty file is created. If it does not exist, a new empty file is created.
 * @param filePath          Provide the path of the file to recreate.
 * @example                 recreateFile("/path/to/file.txt");
 */
export function recreateFile(filePath: string): void {
    // Check if the file exists
    if (existsSync(filePath)) {
        // Delete the file if it exists
        unlinkSync(filePath);
    }

    // Create an empty file or overwrite an existing file
    // This writes an empty string ('') to the file, effectively creating an empty file
    // The { encoding: 'utf8' } option ensures the file is written with UTF-8 encoding
    writeFileSync(filePath, '', { encoding: 'utf8' });
}

/**
 * @description             Reads and groups messages from a file based on a specified message type. Each message is considered as a block of lines starting with the message type.
 * @param filePath          Provide the path of the file from which to read messages.
 * @param messageType       Provide the specific message type to look for. Each message starts with this type.
 * @returns                 Returns an array of message arrays, where each message array contains lines of a single message.
 * @example                 const messages = readMessagesFromFilePath("/path/to/file.txt", "INFO");
 */
export function readMessagesFromFilePath(filePath: string, messageType: string): string[][] {
    // Read the content of the file as a string with UTF-8 encoding
    const fileContent = readFileSync(filePath, 'utf8');
    // Split the file content into lines
    const lines = fileContent.split('\n');

    // Initialize an array to store groups of messages. Each group is an array of strings.
    const messages: string[][] = [];

    // Initialize an array to store lines of the current message being processed.
    let currentMessage: string[] = [];

    // A boolean flag to track whether the current line being read should be recorded as part of a message.
    let recording = false;

    // Iterate through each line in the 'lines' array.
    // This loop processes each line to identify and group lines that belong to the same message type.
    for (let line of lines) {
        // Trim whitespace from the beginning and end of each line
        line = line.trim();

        // Check if the line starts with the specified message type
        if (line.startsWith(messageType)) {
            // If a message is already being recorded, push it to the messages array
            if (currentMessage.length > 0) {
                messages.push(currentMessage);
            }
            // Start recording a new message
            currentMessage = [];
            // Set the recording flag to true
            recording = true;
        } else if (recording && line) {
            // If currently recording and the line is not empty, add it to the current message
            currentMessage.push(line);
        }
    }

    // Add the last message if it exists
    if (currentMessage.length > 0) {
        // Push the last message to the messages array
        messages.push(currentMessage);
    }

    // Return the array of messages.
    // Each element in 'messages' is an array representing a single message,
    // where each array element is a line of that message.
    return messages;
}



/**
 * @description             Creates a promise that rejects after a specified timeout, along with a function to cancel the timeout.
 * @param milliseconds      The number of milliseconds to wait before the promise is rejected.
 * @returns                 A tuple containing the promise and a function to cancel the timeout.
 * @example                 const [promise, cancel] = timeoutPromise(5000);
 */
function timeoutPromise(milliseconds: number): [Promise<never>, () => void] {
    let timeoutId: NodeJS.Timeout; // Declare a variable to hold the timeout ID

    // Create a new Promise that will never resolve but will reject after the specified milliseconds
    const promise = new Promise<never>((_, reject) => {
        // Set a timeout that will trigger the rejection of the promise after the specified milliseconds.
        // The 'timeoutId' is used to reference this timeout, allowing it to be cleared if necessary.
        timeoutId = setTimeout(() => {
            // Reject the promise with an error after the timeout period
            reject(new Error(`Timeout after ${milliseconds} milliseconds`));
        }, milliseconds);
    });

    // Define a function to cancel the timeout
    const cancelTimeout = () => clearTimeout(timeoutId);

    // Return the promise and the cancel function as a tuple
    return [promise, cancelTimeout];
}

/**
 * @description             Sends a request to an AI service and returns the response.
 * @param systemMessage     A system message to be sent as part of the request.
 * @param messageToAI       A user message to be sent to the AI.
 * @param baseUrl           The base URL of the AI service.
 * @returns                 A Promise resolving to the response from the AI service.
 * @throws                  An error if the request fails or if the request times out.
 * @example                 const response = await sendRequestToAI("System message", "Hello AI", "https://api.example.com/ai");
 */
export async function sendRequestToAI(systemMessage: string, messageToAI: string, baseUrl: string): Promise<any> {
    // Create the request body with the system and user messages, along with other parameters
    const body = {
        messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: messageToAI }
        ],
        temperature: 0.7,
        max_tokens: -1,
        stream: false
    };

    // Create a fetch promise to POST the request to the AI service
    const fetchPromise = fetch(baseUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }).then(response => {
        // Check if the response is OK, throw an error otherwise
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        // Parse the response to JSON
        return response.json();
    });

    // Set a 4-hour timeout for the request
    const [timeout, cancelTimeout] = timeoutPromise(14400000);

    try {
        // Use Promise.race to wait for either the fetch promise or the timeout to resolve/reject
        const response = await Promise.race([fetchPromise, timeout]);
        // Cancel the timeout if the fetch promise resolves or rejects before the timeout
        cancelTimeout();
        // Return the response from the fetch promise
        return response;
    } catch (error) {
        // Cancel the timeout in case of an error
        cancelTimeout();
        // Rethrow the error to be handled by the caller
        throw error;
    }
}
