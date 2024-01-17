/** 
 * This is a POM file.
 * That file contains the Page Object Model for the ttsconverter.io.po.ts file.
 **/

/** Imports */
import path from 'path';
import { goTo, sendKeys, checkBox, randomWait, click, isElementReadyForInteraction, getTextFromElement, readFileContents, parseScenarios, debugMessage, debugMessage2, staticWait, changeElementAttribute, ensureCorrectDomain, checkElementPresence, getAttributeValue, getFileSize, createDirectorySync, downloadFile } from '../../tts-generate-audio/domain-specific-language/dsl';
import { Page } from 'playwright';
import { promises as fsPromises } from 'fs';
import * as dotenv from 'dotenv';
// Declare the process.env variable.
dotenv.config();

/** Define Variables */
// Define the base URL to the TTS site.
if (!process.env.AI_PICTURE_BASE_URL) {
    throw new Error("AI_PICTURE_BASE_URL is not defined in your .env file");
}
const baseUrl = process.env.AI_PICTURE_BASE_URL;
// Define the google username.
const googleUsername = "suzdaikartinkov@gmail.com";
// Define the google password.
const googlePassword = "VnR3Iya,@o1$LXC~WSdwTT0aP5.cljllKjQQlD1}_V;5-&seSb";


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

/**
 * @description         Facade function for the playground.com website that created pictures and downloads them to the local machine in the specified directory.
 * @param page          The page object.
 * @example             ttsconverterIo(page, 1000, 2000, 'C:/Users/username/Desktop/Project')
 */
export async function playgroundCom(page: Page) {
    // Login to the site.
    await loginWithGoogle(page);
    // Make preparations before generating the pictures.
    await beforeGeneratePictures(page);
    // Generate a picture.
    await generatePicture(page);
    await staticWait(1000000);
}

async function loginWithGoogle(page: Page) {
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

async function beforeGeneratePictures(page: Page) {
    // Navigate to 'https://playground.com/create'.
    await goTo(page, `${baseUrl}/create`);
    // Click the 'Filter' button.
    await click(page, filter_Button);
    // Click the 'Ultra Light' value.
    await click(page, ultraLight_Value);
}

async function generatePicture(page: Page) {
    // Fill the 'Prompt' text field with correct data.
    await sendKeys(page, prompt_TextField, "A picture of a cat");
    // Fill the 'Negative Prompt' text field with correct data.
    await sendKeys(page, negativePrompt_TextField, "ugly, deformed, noisy, blurry, distorted, out of focus, bad anatomy, extra limbs, poorly drawn face, poorly drawn hands, missing fingers, ugly, deformed, noisy, blurry, distorted, grainy, text");
    // Click the 'Generate' button.
    await click(page, generate_Button);
}

async function downloadPicture(page: Page) {
    // Download the picture by extraction the value from the 'src' attribute of the 'downloadImage_Element' element.
    const downloadImage_Element_Value = await getAttributeValue(page, downloadImage_Element, 'src');
    if (!downloadImage_Element_Value) {
        throw new Error("downloadImage_Element_Value is not defined! Please check the 'downloadImage_Element' locator!");
    }
    // Download the picture.
    await downloadFile(downloadImage_Element_Value, './image1.jpg');
}