/** Description: This file contains creates the voice using TTS. */

/** Imports */
import { chromium, BrowserContext, Page } from 'playwright';
import path from 'path';
import { playgroundCom } from './pom/playground.com.po';

/** Configuration */
// The minimum time to wait in milliseconds.
const minWaitTime = 3000;
// The maximum time to wait in milliseconds.
const maxWaitTime = 5000;
// The root directory of the project.
const rootDirectory = path.resolve(__dirname, '../..');
// Playwright Global Timeout.
const playwrightGlobalTimeout = 3600000; // 1 hour

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


        // Create TTS using ttsconverter.io.
        // You can add another TTS service here (by replacing ttsconverterIo with the name of the new function), by creating a new facade function in new POM file and calling it here.
        await playgroundCom(page);
   
    await browser.close();
}

