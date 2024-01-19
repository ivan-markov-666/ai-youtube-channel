/** Description: This file contains creates the voice using TTS. */

/** Imports */
import { chromium, BrowserContext, Page } from 'playwright';
import path from 'path';
import { loginWithGoogle, beforeGeneratePictures, generatePicture, downloadPicture } from './pom/playground.com.po';
import { ensureDirectoryExists, deleteDirectoryContents, readFileContents, parseScenarios, debugMessage, splitIntoSentences } from '../domain-specific-language/dsl'

/** Configuration */
// The minimum time to wait in milliseconds.
const minWaitTime = 3000;
// The maximum time to wait in milliseconds.
const maxWaitTime = 5000;
// The root directory of the project.
const rootDirectory = path.resolve(__dirname, '../..');
// Define the file conitaning the text to be converted to speach.
const textForSpeachfilePathString = '/02.generateTTS/TextForSpeach/text-for-speach.txt';
// Playwright Global Timeout.
const playwrightGlobalTimeout = 3600000; // 1 hour
// Define the negative prompt for generating pictures.
const negativePrompt = "ugly, deformed, noisy, blurry, distorted, out of focus, bad anatomy, extra limbs, poorly drawn face, poorly drawn hands, missing fingers, ugly, deformed, noisy, blurry, distorted, grainy, text";

/** Functions */
export async function AiGeneratedPictures() {
    // Create the browser instance.
    const browser = await chromium.launch({ headless: false });
    // Create a new browser context.
    const context: BrowserContext = await browser.newContext();
    // Create a new page.
    const page: Page = await context.newPage();

    // Set the the browser size window to a Full HD (1920x1080).
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Playwright globa timeout.
    // Set the default timeout for all the actions to value assigned to the playwrightGlobalTimeout variable.
    page.setDefaultTimeout(playwrightGlobalTimeout);

    // Prepare the folder structure.
    prepareFolderStructure();

    // Define the path to the file containing the text to be converted to speach. We will use that text to create pictures.
    const textForSpeachfilePath = path.join(rootDirectory, textForSpeachfilePathString);

    // Taking the text from the file and parsing it.
    const textFromFile = await readFileContents(textForSpeachfilePath);
    // Parse the text into scenarios. Each scenario is an object with a TTS property. The TTS property contains the text that will be converted to speach.
    const scenarios = parseScenarios(textFromFile);
    // Print the number of scenarios to the console.
    console.log("Total number of scenarios:", scenarios.length);
    // Iterate through the scenarios.


    // Login to the playground.com website.
    await loginWithGoogle(page);
    // Make preparations before generating the pictures.
    await beforeGeneratePictures(page);

    // Use for...of loop to iterate through the scenarios.
    for (const [scenarioIndex, scenario] of scenarios.entries()) {
        // Assign the TTS scenario to a variable.
        const tts = scenario.tts;
        // Split the scenario into sentences and assign the result to a variable.
        const sentences = splitIntoSentences(tts);

        // Use forEach to iterate through all the sentences.
        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i];
            // Генериране на картината
            await generatePicture(page, sentence, negativePrompt);
            // Изтегляне на картината
            await downloadPicture(page, (i + 1).toString());
        }

    }




    // Close the browser.
    await browser.close();
}

/**
 * @description This function prepares the folder structure for the generated pictures.
 * @returns     void
 * @usage       prepareFolderStructure();
 */
function prepareFolderStructure() {
    // Create the directory for the generated pictures if it doesn't exist.
    ensureDirectoryExists(`${rootDirectory}/03.generatePictures/downloaded`);
    // Delete the contents of the generated pictures directory.
    deleteDirectoryContents(`${rootDirectory}/03.generatePictures/downloaded`);
}

