/** 
 * This is a POM file.
 * That file contains the Page Object Model for the ttsconverter.io
 **/

/** Imports */
import path from 'path';
import { goTo, sendKeys, checkBox, randomWait, click, isElementReadyForInteraction, getTextFromElement, readFileContents, parseScenarios, debugMessage, debugMessage2, staticWait, changeElementAttribute, ensureCorrectDomain, checkElementPresence, getAttributeValue, getFileSize, createDirectorySync, downloadFile } from '../../domain-specific-language/dsl-playwright';
import { Page } from 'playwright';
import { promises as fsPromises } from 'fs';
import * as dotenv from 'dotenv';
// Declare the process.env variable.
dotenv.config();

/** Define Variables */
// Define the base URL to the TTS site.
if (!process.env.TTS_BASE_URL) {
    throw new Error("TTS_BASE_URL is not defined in your .env file");
}
const baseUrl = process.env.TTS_BASE_URL;
// Define the file conitaning the text to be converted to speach.
const textForSpeachfilePathString = '../../../02.generateTTS/TextForSpeach/text-for-speach.txt';
// Define the attribute to be changed. That attribute is used for changing the pitch and the audjust voice speed.
const changePitchAttribute = `style`;
// Define the value to be changed. That value is used for changing the pitch the voice.
const changePitchValue1 = `left: 0px; width: 45.1483%;`;
// Define the value to be changed. That value is used for changing the pitch the voice.
const changePitchValue2 = `left: 43.6655%;`;
// Define the value to be changed. That value is used for changing the pitch the voice.
const changePitchValue3 = `-5`;
// Define the value to be changed. That value is used for changing the audjust voice speed.
const changeAudjustVoiceSpeedValue1 = `left: 0px; width: 41.2669%;`;
// Define the value to be changed. That value is used for changing the audjust voice speed.
const changeAudjustVoiceSpeedValue2 = `left: 39.7842%;`;
// Define the value to be changed. That value is used for changing the audjust voice speed.
const changeAudjustVoiceSpeedValue3 = `-18`;
// Username data.
if (!process.env.TTS_USERNAME) {
    throw new Error("TTS_USERNAME is not defined in your .env file");
}
const username = process.env.TTS_USERNAME;
// Password data.
if (!process.env.TTS_PASSWORD) {
    throw new Error("TTS_PASSWORD is not defined in your .env file");
}
const password = process.env.TTS_PASSWORD;

/** Define locators */
// Login page locators.
// Username input text element.
const usernameInputTextElement = `//*[@*='txt_username']`;
// Password input text element.
const passwordInputTextElement = `//*[@*='txt_password']`;
// 'I agree with the terms and conditions' checkbox.
const agreeWithTermsCheckboxElement = `//*[@*='i_agree']`;
// Login button element.
const loginButtonElement = `//*[@*='btnLogin']`;
// Logout button element.
const logoutButtonSelector = `//*[@*='https://ttsconverter.io/logout']`;

// TTS page locators.
// The maximum allowed characters number.
const getAllowedCharacters = `(//*[@*='position-relative']/div)[2]`;
// Text to speach input text element.
const textToSpeachInputTextElement = `//*[@*='input_text']`;
// Select 'Eric' Voice locators.
// Eric voice.
const ericVoice = `//*[@id='radioPrimaryen-US-EricNeural']`;
// Change pitch. Element 1 for changing the attribute value.
const changePitchElement1 = `((//*[@*='irs-grid'])[1]/following-sibling::span)[1]`;
// Change pitch. Element 2 for changing the attribute value.
const changePitchElement2 = `((//*[@*='irs-grid'])[1]/following-sibling::span)[3]`;
// Change pitch. Element 3 for changing the attribute value.
const changePitchElement3 = `//*[@*='voice_pitch_bin']`;
// Change audjust voice speed. Element 1 for changing the attribute value.
const changeAudjustVoiceSpeedElement1 = `((//*[@*='irs-grid'])[3]/following-sibling::span)[1]`;
// Change audjust voice speed. Element 2 for changing the attribute value.
const changeAudjustVoiceSpeedElement2 = `((//*[@*='irs-grid'])[3]/following-sibling::span)[3]`;
// Change audjust voice speed. Element 3 for changing the attribute value.
const changeAudjustVoiceSpeedElement3 = `//*[@*='volume_range']`;
// Convert now button element.
const convertNowButtonElement = `//*[@*='Convert now']`;
// 'Confirm' button element.
const confirmNotARobotButtonElement = `//a[contains(text(),'Confirm')]`;
// Element containing the text 'Great, ' inside it.
const confirmVerificationElement = `//*[contains(text(),'Great,')]`;
// Download the audio file button.
const downloadButtonElement = `//*[@*='btn-group']/a`;


/**
 * @description Trims the text and extracts the number from it.
 * @param text  The text to be trimmed and extracted from.
 * @returns     The extracted number or null if no number is found.
 * @example     extractNumberFromText("0/1000 characters per conversion. Get more characters") // Should return 1000
 */
export function extractNumberFromText(text: string): number | null {
    try {
        // Tgat regular expression finds numbers in the text (after the '/' symbol).
        const regex = /\/(\d+)/;
        // The match variable contains the result of the search.
        const match = text.match(regex);
        // If there is a match, return the number after the '/' symbol (the second group in the match).
        return match ? parseInt(match[1]) : null; // Взема числото след символа '/' (втората група в съвпадението)
    }
    // Handle the error.
    catch (error) {
        // Print the error to the console.
        console.error(error);
        // Return null.
        return null;
    }
}

/**
 * @description         Splits a text into chunks of a given size.
 * @param text          Provided text.
 * @param maxChunkSize  Maximum size of the chunk.
 * @returns             Array of strings.
 * @example             splitTextIntoChunks("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra...", 990)
 */
export function splitTextIntoChunks(text: string, maxChunkSize: number): string[] {
    // The regular expression finds sentences in the text.
    const sentences = text.match(/[^\.!\?]+[\.!\?]+["']?|[^\.!\?]+$/g) || [];
    // The current chunk.
    let currentChunk = '';
    // The array of chunks.
    let chunks: string[] = [];
    // Iterate through the sentences.
    for (const sentence of sentences) {
        // Check if adding this sentence will exceed the maximum allowed size.
        if (currentChunk.length + sentence.length > maxChunkSize) {
            // If so, save the current chunk and start a new one.
            chunks.push(currentChunk);
            // The new chunk will be the current sentence.
            currentChunk = sentence;
        }
        // If not, add the sentence to the current chunk.
        else {
            // Add the sentence to the current chunk.
            currentChunk += sentence;
        }
    }

    // Add the last chunk if there is one.
    if (currentChunk) {
        // Add the last chunk to the array of chunks.
        chunks.push(currentChunk);
    }

    // Return the array of chunks.
    return chunks;
}

/**
 * @description         Facade function for the ttsconverter.io website that converts text to speach and downloads the audio file to the local machine in the specified directory.
 * @param page          The page object.
 * @param minWaitTime   Provided minimum wait time.
 * @param maxWaitTime   Provided maximum wait time.
 * @param rootDirectory The root directory of the project.
 * @example             ttsconverterIo(page, 1000, 2000, 'C:/Users/username/Desktop/Project')
 */
export async function ttsconverterIo(page: Page, minWaitTime: number, maxWaitTime: number, rootDirectory: string) {
    // Navigate to 'https://ttsconverter.io/'.
    await goTo(page, `${baseUrl}login`);

    // LOGIN PAGE
    // Enter username into the username input field.
    await sendKeys(page, usernameInputTextElement, username);
    // Enter password into the password input field.
    await sendKeys(page, passwordInputTextElement, password);
    // Check the 'I agree with the terms and conditions' checkbox.
    await checkBox(page, agreeWithTermsCheckboxElement);
    // Wait for a random amount of time between minWaitTime and maxWaitTime.
    await randomWait(minWaitTime, maxWaitTime);
    // Click the 'Login' button.
    await click(page, loginButtonElement);
    // Wait for the logout button to be visible. This means that the login was successful and the user is logged in.
    await isElementReadyForInteraction(page, logoutButtonSelector);

    // TTS PAGE
    // Get all allowed characters number.
    const allowedCharactersText = await getTextFromElement(page, getAllowedCharacters);
    // Extract the maximum allowed characters number.
    const maximumAllowedCharactersNumberString = extractNumberFromText(allowedCharactersText);
    // Verify that the maximum allowed characters number is not null or less than or equal to zero.
    if (maximumAllowedCharactersNumberString === null) {
        // Throw an error.
        throw new Error(`The allowed characters number is null.`);
    }
    // Verify that the maximum allowed characters number is not less than or equal to zero.
    if (maximumAllowedCharactersNumberString <= 0) {
        // Throw an error.
        throw new Error(`The allowed characters number is less than or equal to zero.`);
    }

    // Define the path to the file containing the text to be converted to speach.
    const textForSpeachfilePath = path.join(__dirname, textForSpeachfilePathString);
    // Taking the text from the file and parsing it.
    const textFromFile = await readFileContents(textForSpeachfilePath);
    // Parse the text into scenarios. Each scenario is an object with a TTS property. The TTS property contains the text that will be converted to speach.
    const scenarios = parseScenarios(textFromFile);
    // Print the number of scenarios to the console.
    console.log("Total number of scenarios:", scenarios.length);
    // Iterate through the scenarios.
    for (const [scenarioIndex, scenario] of scenarios.entries()) {
        // Assign the TTS property of the scenario to a variable.
        const tts = scenario.tts;
        // Print the scenario to the console.
        debugMessage(`${scenarioIndex + 1} - ${tts}`);
        // Get the maximum allowed characters number. That value can be get dynamically from the website.
        const maximumAllowedCharactersNumber: number = Number(maximumAllowedCharactersNumberString);
        // Split the text into chunks of maximumAllowedCharactersNumber - 10 characters.
        const textParts = splitTextIntoChunks(tts, maximumAllowedCharactersNumber - 10);
        // Iterate through the text parts.
        for (const [textPartIndex, textPart] of textParts.entries()) {
            // Define the isCorrectDomain variable outside of the do-while loop.
            let isCorrectDomain;
            do {
                // Print the text part to the console.
                debugMessage2(`${textPartIndex + 1} - ${textPart}`);
                // Send the text part to the text to speach input text element.
                await sendKeys(page, textToSpeachInputTextElement, textPart);
                // Wait for 2 seconds.
                // Bad practice, but there is no other way to do it in this case.
                await staticWait(2000);
                // Select the 'Eric' voice.
                await checkBox(page, ericVoice);
                // Change the pitch the voice.
                await changeElementAttribute(page, changePitchElement1, changePitchAttribute, changePitchValue1);
                await changeElementAttribute(page, changePitchElement2, changePitchAttribute, changePitchValue2);
                await changeElementAttribute(page, changePitchElement3, changePitchAttribute, changePitchValue3);
                // Change the audjust voice speed.
                await changeElementAttribute(page, changeAudjustVoiceSpeedElement1, changePitchAttribute, changeAudjustVoiceSpeedValue1);
                await changeElementAttribute(page, changeAudjustVoiceSpeedElement2, changePitchAttribute, changeAudjustVoiceSpeedValue2);
                await changeElementAttribute(page, changeAudjustVoiceSpeedElement3, changePitchAttribute, changeAudjustVoiceSpeedValue3);

                // Press the 'Convert Now' button.
                await click(page, convertNowButtonElement);
                // Wait for 5 seconds.
                // This is a bad practice, but there is no other way to do it in this case.
                await staticWait(5000);
                // Check if the domain is correct.
                isCorrectDomain = await ensureCorrectDomain(page, 'ttsconverter.io', baseUrl);
                // If the domain is not correct, wait for 10 seconds and print a message to the console.
                if (!isCorrectDomain) {
                    // Wait for 10 seconds.
                    staticWait(10000);
                    // Print a message to the console.
                    console.log("Redirected to wrong domain.");
                }

                // Next block of code is for handling the captcha.
                // However, it is not working properly and it is not used for now, but it is left here for future development.
                // Check if the 'Confirm' button is visible. This means that the captcha is required.
                const isCaptchaRequired = await checkElementPresence(page, confirmNotARobotButtonElement, 10000);
                if (isCaptchaRequired) {
                    for (let i = 0; i < 3600; i++) {
                        // This is the logic for waiting for filling the captcha and clicking the 'Confirm' button.
                        try {

                            const result = await isElementReadyForInteraction(page, confirmVerificationElement);
                            if (result) {
                                break;
                            }
                        } catch (error) {
                            await staticWait(1000);
                        }
                    }
                }
            }
            // If the domain is not correct, repeat the process.
            while (!isCorrectDomain);

            // Get the download link.
            const downloadLink = await getAttributeValue(page, downloadButtonElement, 'href');
            // Verify that the download link is not null.
            if (downloadLink === null) {
                // Throw an error.
                throw new Error('Download link not found');
            }

            // Download the file and verify that the size of the downloaded file is the same as the expected size.
            try {
                // Get the size of the file.
                const expectedSize = await getFileSize(downloadLink);
                // Print the expected size to the console.
                console.log(`Expected file size: ${expectedSize} bytes`);
                // Create the directory path.
                const directoryPath = `${rootDirectory}/02.generateTTS/downloaded/${scenarioIndex + 1}`;
                // Create folder where to put the downloaded files if it does not exist already.
                createDirectorySync(directoryPath);
                // Create the file path.
                const downloadedFilePath = `${directoryPath}/${textPartIndex + 1}.mp3`;
                // Download the file.
                await downloadFile(downloadLink, downloadedFilePath);
                // Get the size of the downloaded file.
                const fileSize = await fsPromises.stat(downloadedFilePath);
                // If the size of the downloaded file is the same as the expected size, print a message to the console.
                if (fileSize.size === expectedSize) {
                    // Print a message to the console.
                    console.log('The file was downloaded successfully and the size of the file matches.');
                }
                // If the size of the downloaded file is not the same as the expected size, throw an error.
                else {
                    // Throw an error.
                    throw new Error(`The size of the file does not match. Expected: ${expectedSize}, Received: ${fileSize.size}`);
                }
            }
            // Handle the error.
            catch (error) {
                // Print the error to the console.
                console.error('Error while checking or downloading the file:', error);
            }

            // Navigate to the voices list page.
            await goTo(page, `${baseUrl}voices-list`);
            // Wait for the logout button to be visible. This means that the login was successful and the user is logged in.
            await isElementReadyForInteraction(page, logoutButtonSelector);
            // Navigate to the text to speach page.
            await goTo(page, `${baseUrl}text-to-speech`);
        }
    }
}

