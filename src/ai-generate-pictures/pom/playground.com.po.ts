/** 
 * This is a POM file.
 * That file contains the Page Object Model for the playground.com
 **/

/** Imports */
import { goTo, sendKeys, validateElementPresent, checkBox, randomWait, click, validateElementNotPresent, getTextFromElement, readFileContents, parseScenarios, debugMessage, debugMessage2, staticWait, changeElementAttribute, ensureCorrectDomain, checkElementPresence, getAttributeValue, getFileSize, createDirectorySync, downloadFile } from '../../domain-specific-language/dsl';
import { Page } from 'playwright';
import * as dotenv from 'dotenv';
import path from 'path';
const base64ToImage = require('base64-to-image');

// Declare the process.env variable.
dotenv.config();

/** Define Variables */
// Define the base URL to the TTS site.
if (!process.env.AI_PICTURE_BASE_URL) {
    throw new Error("AI_PICTURE_BASE_URL is not defined in your .env file");
}
const baseUrl = process.env.AI_PICTURE_BASE_URL;
// Define the google username.
if (!process.env.GOOGLE_USERNAME) {
    throw new Error("GOOGLE_USERNAME is not defined in your .env file");
}
const googleUsername = process.env.GOOGLE_USERNAME;
// Define the google password.
if (!process.env.GOOGLE_PASSWORD) {
    throw new Error("GOOGLE_PASSWORD is not defined in your .env file");
}
const googlePassword = process.env.GOOGLE_PASSWORD;
// The root directory of the project.
const rootDirectory = path.resolve(__dirname, '../../..');


/** Define locators */
// Login page locators.
// "Continue with Google" button.
const continueWithGoogle_Button = `//*[@href="/login"]/following::button`;
// "Email or phone" text field.
const emailOrPhone_TextField = `//*[@type="email"]`;
// "Next" button.
const next_Button = `//*[contains(text(),'Next')]/parent::button`;
// "Password" text field.
const password_TextField = `//*[@type="password"]`;
// Validate page locator.
const create_Button = `(//*[contains(text(),'Create')])[1]`;

// Create page locators.
// select "Filter" button.
const filter_Button = `//*[@*='filter-select-button']`;
// "Ultra Light" value.
const ultraLight_Value = `//*[contains(text(),'Ultra Lighting')]/parent::button`;
// Prompt text field.
const prompt_TextField = `//*[@id='prompt-textarea']`;
// Negative Prompt text field.
const negativePrompt_TextField = `//*[@id='negative-prompt-textarea']`;
// "Generate" button.
const generate_Button = `//*[@id='generate-image']`;
// Download image element.
const downloadImage_Element = `//*[@data-testid='create-image-card']/img`;
// Element visible before the picture is generated. This element is used (like wait) to check if the picture is generated.
const isPictureReadyForDownload_ValidationElement = `//*[@id='restore-options']`;
// "X" button of anoying comapring between two images pop-up.
const x_button = `//*[contains(text(),'Skip')]/parent::li/following-sibling::li/button`;

/**
 * @description         Login to the playground.com website with google.
 * @param page          The page object.
 * @usage               await loginWithGoogle(page);
 */
export async function loginWithGoogle(page: Page) {
    // Navigate to 'https://playground.com/login'.
    await goTo(page, `${baseUrl}/login`);
    // Click the 'Login' button.
    await click(page, continueWithGoogle_Button);
    // Fill the 'Email or phone' text field with correct data.
    await sendKeys(page, emailOrPhone_TextField, googleUsername);
    // Click the 'Next' button.
    await click(page, next_Button);
    // Fill the 'Password' text field with correct data.
    await sendKeys(page, password_TextField, googlePassword);
    // Click the 'Next' button.
    await click(page, next_Button);
    // Click the "Create" button.
    await click(page, create_Button);
}

/**
 * @description         Make preparations before generating the pictures. Configure the AI.
 * @param page          The page object.
 * @usage               await beforeGeneratePictures(page);
 */
export async function beforeGeneratePictures(page: Page) {
    // Navigate to 'https://playground.com/create'.
    await goTo(page, `${baseUrl}/create`);
    // Click the 'Filter' button.
    await click(page, filter_Button);
    // Click the 'Ultra Light' value.
    await click(page, ultraLight_Value);
}

/**
 * @description                          Generate a picture.
 * @param page                           The page object.
 * @param prompt_TextField_Value         The value to be entered in the 'Prompt' text field.
 * @param negativePrompt_TextField_Value The value to be entered in the 'Negative Prompt' text field.
 * @usage                                await generatePicture(page);
 */
export async function generatePicture(page: Page, prompt_TextField_Value: string, negativePrompt_TextField_Value: string) {
    // Fill the 'Prompt' text field with correct data.
    await sendKeys(page, prompt_TextField, prompt_TextField_Value);
    // Fill the 'Negative Prompt' text field with correct data.
    await sendKeys(page, negativePrompt_TextField, negativePrompt_TextField_Value);
    // Click the 'Generate' button.
    await click(page, generate_Button);
}

/**
 * @description         Close the voting images pop-up.
 * @param page          The page object.
 * @usage               await closeVotingImagesPopUp(page);
 */
async function closeVotingImagesPopUp(page: Page) {
    for (let i = 0; i < 10; i++) {
        const x_buttonBoolean = await validateElementPresent(page, x_button);
        if (x_buttonBoolean) {
            await click(page, x_button);
            break;
        }
        else {
            await staticWait(1000);
        }
    }

}

/**
 * @description         Wait until the image is ready for download. There is timeout of 120 seconds.
 * @param page          The page object.
 * @usage               await waitGeneratePicture(page);
 */
async function waitGeneratePicture(page: Page) {
    let flagCounter = 0;
    for (let i = flagCounter; i < 120; i++) {
        // Wait for the picture to be generated.
        const isPictureReadyForDownload = await validateElementNotPresent(page, isPictureReadyForDownload_ValidationElement);
        // If the picture is generated, break the loop.
        if (!isPictureReadyForDownload) {
            break;
        }
        flagCounter = i;
        // If the picture is not generated, wait 1 second and try again.
        await staticWait(1000);
    }
    if (flagCounter === 120) {
        // If the picture is not generated, throw an error.
        throw new Error("The picture is not generated!");
    }
}

/**
 * @description             Download the picture.
 * @param page              The page object.
 * @param pictureFileName   The name of the file under which the image will be saved.
 * @usage                   await downloadPicture(page, pictureFileName);
 */
export async function downloadPicture(page: Page, pictureFileName: string) {
    // Wait until the image is ready for download.
    await waitGeneratePicture(page);
    // Close the voting images pop-up.
    await closeVotingImagesPopUp(page);

    // Download the picture by extraction the value from the 'src' attribute of the 'downloadImage_Element' element.
    const downloadImage_Element_Value = await getAttributeValue(page, downloadImage_Element, 'src');
    // Check if the 'downloadImage_Element_Value' variable is defined.
    if (!downloadImage_Element_Value) {
        // If the 'downloadImage_Element_Value' variable is not defined, throw an error.
        throw new Error("downloadImage_Element_Value is not defined! Please check the 'downloadImage_Element' locator!");
    }
    // Download the picture by converting from base64 to image.
    await base64PictureConvertor(downloadImage_Element_Value, `${rootDirectory}/03.generatePictures/downloaded/`, pictureFileName)
}

/**
 * Converts a base64 string to an image and saves it to a given path.
 *
 * @param base64Str Base64 encoded string representing the image.
 * @param path The path where the converted image should be saved.
 * @param pictureFileName The name of the file under which the image will be saved.
 * @returns A promise that resolves upon successful image saving.
 */
async function base64PictureConvertor(base64Str: string, path: string, pictureFileName: string): Promise<void> {
    // Define the optional object.
    const optionalObj = {
        'fileName': pictureFileName,   // The name of the file under which the image will be saved.
        'type': 'jpg',          // The format of the image.
        'debug': true           // Provides additional information for debugging.
    };

    try {
        // Convert the base64 string to an image and save it to the specified path.
        await base64ToImage(base64Str, path, optionalObj);
        // Log a message to the console.
        console.log('Image successfully saved.');
    } catch (error) {
        // Throw an error.
        throw new Error("Error while converting the image: " + error);
    }
}
