/** That file contains all domain specific language functions that we are using during creating audio. */

/** Imports */
import assert from 'assert';
import { Page } from 'playwright';
import * as fs from 'fs';
import { promises as fsPromises, mkdirSync } from 'fs';
import https from 'https';

/** Playwright Functions */
/**
 * @description         Navigate to a given URL.
 * @param page          Provide the page object.
 * @param url           Provide the URL to navigate to.
 * @usage               await goTo(page, 'https://www.google.com');
 */
export async function goTo(page: Page, url: string): Promise<void> {
    await page.goto(url);
    assert.equal(page.url(), url, `The page is not loaded.`);
}

/**
 * @description         Clicks on an element.
 * @param page          Provide the page object.
 * @param selector      Provide the selector of the element.
 */
export async function click(page: Page, selector: string): Promise<void> {
    // Verify that the element is ready for interaction.
    await isElementReadyForInteraction(page, selector);
    // Click the element.
    await page.click(selector);
}

/**
 * @description         Waits for an element to be present on the page.
 * @param page          Provide the page object. 
 * @param selector      Provide the selector of the element.
 * @param timeout       Provide the timeout in milliseconds.
 * @returns             True if the element is present on the page, false otherwise.
 * @usage               await checkElementPresence(page, '//*[@*='btn-group']/a', 5000);
 */
export async function checkElementPresence(page: Page, selector: string, timeout: number): Promise<boolean> {
    try {
        // Find the element with a timeout
        await page.waitForSelector(selector, { state: 'visible', timeout: timeout });
        // Return true if the element is found and visible
        return true;
    } catch (err) {
        // Return false if the element is not found or not visible
        return false;
    }
}

/**
 * @description         Waits for an element to be present on the page.
 * @param page          Provide the page object.
 * @param selector      Provide the selector of the element.
 * @returns             True if the element is present on the page, false otherwise.
 * @usage               await checkElementPresence(page, '//*[@*='btn-group']/a');
 */
export async function isElementReadyForInteraction(page: Page, selector: string): Promise<boolean> {
    try {
        // Check if the element is present and visible
        await page.waitForSelector(selector, { state: 'visible', timeout: 15000 });
        // Check if the element is visible and assign the result to a variable for later use in the function.
        const isVisible = await page.isVisible(selector);
        // Check if the element is visible
        if (!isVisible) {
            // Return false if the element is not visible
            return false;
        }

        // Check if the element is the only one in the DOM tree
        const elements = await page.$$(selector);

        // Return true if the element is the only one in the DOM tree
        return elements.length === 1;
    } catch (err) {
        // Return false in case of an error (for example, if the selector is not found)
        return false;
    }
}

/**
 * @description         Sends keys to an element.
 * @param page          Provide the page object.
 * @param selector      Provide the selector of the element.
 * @param textToEnter   Provide the text to enter.
 * @returns             True if the entered text matches the expected text, false otherwise.
 * @usage               await sendKeys(page, '//*[@*='btn-group']/a', 'Hello World!');
 */
export async function sendKeys(page: Page, selector: string, textToEnter: string): Promise<boolean> {
    // Verify that the element is ready for interaction.
    await isElementReadyForInteraction(page, selector);

    // Clear the text field from any previous text (prepare the text field for entering text)
    await page.fill(selector, '');

    // Enter text into the text field
    await page.fill(selector, textToEnter);

    // Get the value of the text field after entering the text
    const enteredText = await page.inputValue(selector);

    // Return true if the entered text matches the expected text, false otherwise.
    return enteredText === textToEnter;
}

/**
 * @description         Check a checkbox.
 * @param page          Provide the page object.
 * @param selector      Provide the selector of the element.
 * @usage               await checkBox(page, '//*[@*='btn-group']/a');
 */
export async function checkBox(page: Page, selector: string): Promise<void> {
    // Verify that the element is ready for interaction.
    await isElementReadyForInteraction(page, selector);
    // Focus the element
    await page.focus(selector);
    // Check the checkbox by pressing the space key on the keyboard (the space key is used to check a checkbox in that case)
    await page.keyboard.press('Space');
    // Verify that the checkbox is checked
    await page.isChecked(selector);
}

/**
 * @description         Get the text from an element.
 * @param page          Provide the page object.
 * @param selector      Provide the selector of the element.
 * @returns             The text from the element.
 * @usage               await getTextFromElement(page, '//*[@*='btn-group']/a');
 */
export async function getTextFromElement(page: Page, selector: string): Promise<string> {
    // Verify that the element is ready for interaction.
    // Returns the text from the element.
    return page.$eval(selector, (element: HTMLElement | SVGElement) => {
        // Check if the element has an innerText property
        if ('innerText' in element) {
            // Return the innerText property that contains the text from the element
            return element.innerText;
        }
        // Handle the case where the element does not have an innerText property
        else {
            return ''; // Return an empty string or handle it as you see fit
        }
    });
}

/**
 * @description             Changes the value of an attribute of an element.
 * @param page              Provide the page object.
 * @param xpathSelector     Provide the XPath selector of the element.
 * @param attributeName     Provide the name of the attribute.
 * @param attributeValue    Provide the value of the attribute.
 * @example                 await changeElementAttribute(page, "//*[@*='btn-group']/a", "href", "https://www.google.com");
 */
export async function changeElementAttribute(page: Page, xpathSelector: string, attributeName: string, attributeValue: string): Promise<void> {
    // Change the value of the attribute of the element using the evaluate function
    await page.evaluate(({ xpathSelector, attributeName, attributeValue }) => {
        // Find the element using the XPath selector and assign it to a variable
        const element = document.evaluate(xpathSelector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLElement;
        // Check if the element exists
        if (element) {
            // Change the value of the attribute of the element
            element.setAttribute(attributeName, attributeValue);
        }
    },
        // Pass the arguments to the evaluate function
        { xpathSelector, attributeName, attributeValue });
}

/**
 * @description         Gets the value of an attribute of an element.
 * @param page          Page object.
 * @param selector      Selector of the element.
 * @param attributeName Name of the attribute. 
 * @returns             The value of the attribute.
 * @example             getAttributeValue(page, "//*[@*='btn-group']/a", "href") // Should return the value of the href attribute.
 */
export async function getAttributeValue(page: Page, selector: string, attributeName: string) {
    // Get the value of the attribute of the element using the evaluate function
    const attributeValue = await page.getAttribute(selector, attributeName);
    // Return the value of the attribute
    return attributeValue;
}

/**
 * @description         Downloads a file from a given URL.
 * @param url           Provide the URL of the file.
 * @param outputPath    Provide the path to the output file.
 * @returns             Promise that resolves after the download.
 * @usage               await downloadFile('https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png', './google-logo.png');
 */
export async function downloadFile(url: string, outputPath: string): Promise<void> {
    try {
        // Create the directory if it does not exist
        return new Promise((resolve, reject) => {
            // Create the file stream
            const file = fs.createWriteStream(outputPath);
            // Download the file using the https module (the file is downloaded in chunks)
            https
                // Get the file from the URL 
                .get(url, (response) => {
                    // Pipe the response into the file stream
                    response.pipe(file);
                    // Close the file stream after the download is complete
                    file.on('finish', () => {
                        // Close the file stream after the download is complete
                        file.close();
                        // Resolve the promise (the promise resolves after the download is complete)
                        resolve();
                    });
                })
                // Handle the error (reject the promise)
                .on('error', async (err) => {
                    try {
                        // Delete the file if the download fails (use fsPromises here)
                        await fsPromises.unlink(outputPath);
                        // Reject the promise (the promise rejects if the download fails)
                        reject(err);
                    } catch (unlinkErr) {
                        // Reject the promise if the file cannot be deleted
                        reject(unlinkErr);
                    }
                });
        });
    }
    // Handle the error
    catch (err) {
        // Log the error
        console.error('Error downloading file:', err);
        // Throw the error
        throw err;
    }
}

/**
 * @description         Gets the size of a file from a given URL.
 * @param url           Provide the URL of the file.
 * @returns             Promise that resolves after the download.
 * @usage               await getFileSize('https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png');
 */
export async function getFileSize(url: string): Promise<number> {
    // Get the file size using the https module and return a promise
    return new Promise((resolve, reject) => {
        // Get the file size using the https module
        https
            // Get the file from the URL
            .get(url, { method: 'HEAD' }, (response) => {
                // Get the content length from the response headers
                const contentLength = response.headers['content-length'];
                // Resolve the promise if the content length is available
                if (contentLength) {
                    // Resolve the promise with the content length
                    resolve(parseInt(contentLength, 10));
                }
                // Reject the promise if the content length is not available
                else {
                    // Reject the promise with an error
                    reject(new Error('Content-Length header is not available'));
                }
            })
            // Handle the error (reject the promise)
            .on('error', (err) => {
                // Reject the promise with an error
                reject(err);
            });
    });
}


/**
 * @description            Ensures that the domain is correct.
 * @param page             Provide the page object.
 * @param expectedDomain   Provide the expected domain.
 * @param defaultUrl       Provide the default URL.
 * @returns                Promise that resolves after the check.
 * @usage                  await ensureCorrectDomain(page, 'https://www.google.com', 'https://www.google.com');
 */
export async function ensureCorrectDomain(page: Page, expectedDomain: string, defaultUrl: string): Promise<boolean> {
    try {
        // Get the current URL
        const currentUrl = page.url();
        // Check if the current URL is the same as the expected URL
        if (!currentUrl.includes(expectedDomain)) {
            // Navigate to the default URL
            await page.goto(defaultUrl);
            // Return false, if the domain is not correct
            return false;
        }
        // Return true, if the domain is correct
        return true;
    } catch (err) {
        // Handle the error
        console.error('Error checking the domain:', err);
        // Throw the error
        throw err;
    }
}


/** System Functions */

/**
 * @description     Generates a random number in a given range.
 * @param min       Provide the minimum value of the range.
 * @param max       Provide the maximum value of the range.
 * @returns         Returns a random number in the given range.
 * @usage           getRandomInt(1, 10);
 */
function getRandomInt(min: number, max: number): number {
    // Check if the minimum value is smaller than the maximum value
    if (min >= max) {
        throw new Error('The minimum value should be smaller than the maximum value.');
    }
    // Choose a random number for min value.
    min = Math.ceil(min);
    // Choose a random number for max value.
    max = Math.floor(max);
    // Return a random number in the given range.
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * @description     Waits for a random amount of time in a given range.
 * @param minMs     Minimum amount of time to wait in milliseconds.
 * @param maxMs     Maximum amount of time to wait in milliseconds.
 * @returns         Promise that resolves after the wait.
 */
export async function randomWait(minMs: number, maxMs: number): Promise<void> {
    // Check if the minimum value is smaller than the maximum value
    if (minMs >= maxMs) {
        throw new Error('The minimum value should be smaller than the maximum value.');
    }
    // Choose a random number for min value.
    const waitTime = getRandomInt(minMs, maxMs);
    // Return a promise that resolves after the wait.
    return new Promise(resolve => setTimeout(resolve, waitTime));
}

/**
 * @description             Waits for a random amount of time in a given range (Static Wait).
 * @param milliseconds      Provide the amount of time to wait in milliseconds.
 * @returns                 Promise that resolves after the wait.
 */
export function staticWait(milliseconds: number): Promise<void> {
    // Return a promise that resolves after the wait.
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/**
 * @description         Read data from a file.
 * @param filePath      Provide the path to the file.
 * @returns             The contents of the file.
 * @example             readFileContents('./scenarios.txt');
 */
export async function readFileContents(filePath: string): Promise<string> {
    try {
        // Read the file contents
        const data = await fsPromises.readFile(filePath, { encoding: 'utf-8' });
        // Return the file contents as a string (utf-8 encoding)
        return data;
    } catch (error) {
        // Handle the error
        console.error('Error reading file:', error);
        // Throw the error
        throw error;
    }
}

/**
 * @description         Declare the interface for the scenario.
 * @interface           Scenario
 * @property {string}   title           The title of the scenario.
 * @property {string}   tts             The translated text of the scenario.
 * @property {string}   description     The description of the scenario.
 */
interface Scenario {
    title: string;
    tts: string;
    description: string;
}

/**
 * @description         Parses a text into scenarios.
 * @param text          Provided text.
 * @returns             Array of scenarios.
 * @usage               parseScenarios(text);
 */
export function parseScenarios(text: string): Scenario[] {
    // Define the regular expression for parsing the text into scenarios
    const scenarioRegex = /Title: "(.+?)"\s+TTS:\s+([\s\S]+?)\s+Description:\s*([\s\S]*?)(?=Title:|$)/gs;
    // Define the array of scenarios that will be returned by the function (initially empty)
    const scenarios: Scenario[] = [];
    // Define the variable that will hold the match result
    let match;
    // Loop through the matches and push them to the array of scenarios (scenarios)
    while ((match = scenarioRegex.exec(text)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        const [_, title, tts, description] = match;
        // Push the scenario to the array of scenarios
        scenarios.push({ title, tts, description });
    }
    // Return the array of scenarios
    return scenarios;
}

/**
 * @description             Creates a directory.
 * @param directoryPath     Provide the path to the directory.
 * @usage                   await createDirectory('./my-directory');
 */
export function createDirectorySync(directoryPath: string): void {
    try {
        // Create the directory
        mkdirSync(directoryPath, { recursive: true });
        // Log a success message
        console.log(`The folder '${directoryPath}' was cerated successfully.`);
    } catch (err) {
        // Log an error message
        console.error('Error during creating the folder', err);
    }
}

/**
 * @description             Debug message 1.
 * @param text              Provide the text to log.
 * @usage                   debugMessage('Debug message 1');
 */
export function debugMessage(text: string): void {
    // Log the text in red color
    console.log('\x1b[31m', text, '\x1b[0m');
}

/**
 * @description             Debug message 2.
 * @param text              Provide the text to log.
 * @usage                   debugMessage2('Debug message 2');
 */
export function debugMessage2(text: string): void {
    // Log the text in green color
    console.log('\x1b[32m', text, '\x1b[0m');
}

/**
 * @description             Validates that an element is present on the page.
 * @param page              Provide the page object.
 * @param selector          Provide the selector of the element.
 * @returns                 True if the element is present on the page, false otherwise.
 */
export async function validateElementPresent(page: Page, selector: string): Promise<boolean> {
    for (let i = 0; i < 15; i++) {
        const element = await isElementReadyForInteraction(page, selector);
        if (!element) {
            await staticWait(1000);
        }
        else {
            const isElementStillPresent = await page.locator(selector).isVisible();
            if (isElementStillPresent) {
                return true;
            }
            else {
                return false;
            }
        }
    }
    return false;
}

/**
 * @description             Validates that an element is NOT present on the page.
 * @param page              Provide the page object.
 * @param selector          Provide the selector of the element.
 * @returns                 True if the element is NOT present on the page, false otherwise.
 */
export async function validateElementNotPresent(page: Page, selector: string): Promise<boolean> {
    for (let i = 0; i < 15; i++) {
        const element = await isElementReadyForInteraction(page, selector);
        if (!element) {
            await staticWait(1000);
            return false;
        }
        else {
            const isElementStillPresent = await page.locator(selector).isVisible();
            if (isElementStillPresent) {
                return true;
            }
            else {
                return false;
            }
        }
    }
    return false;
}