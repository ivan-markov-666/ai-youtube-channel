import assert from 'assert';
import { chromium, Page } from 'playwright';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import https from 'https';




const minWaitTime = 3000;
const maxWaitTime = 5000;

export async function createVoice() {
    const browser = await chromium.launch({ headless: false }); // Задайте headless на false
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to 'https://ttsconverter.io/'.
    const loginTtsPage = `https://ttsconverter.io/login`;
    await page.goto(loginTtsPage);
    assert.equal(page.url(), loginTtsPage, `The login page is not loaded.`);

    // Login.
    const usernameInputTextElement = `//*[@*='txt_username']`;
    const passwordInputTextElement = `//*[@*='txt_password']`;
    const agreeWithTermsCheckboxElement = `//*[@*='i_agree']`;
    const loginButtonElement = `//*[@*='btnLogin']`;
    const logoutButtonSelector = `//*[@*='https://ttsconverter.io/logout']`;
    const username = 'magiclsd';
    const password = 'VnVlxW3i2ZOpCMfDDxla!#@';
    await fillAndCheckInput(page, usernameInputTextElement, username);
    await fillAndCheckInput(page, passwordInputTextElement, password);
    await checkBox(page, agreeWithTermsCheckboxElement);
    await waitRandomTime();
    await click(page, loginButtonElement);
    await isElementReadyForInteraction(page, logoutButtonSelector);

    // get all allowed characters number.
    const getAllowedCharacters = `(//*[@*='position-relative']/div)[2]`;
    const allowedCharactersText = await getTextFromElement(page, getAllowedCharacters);
    const maximumAllowedCharactersNumberString = extractNumberFromText(allowedCharactersText);
    // Verify that the maximum allowed characters number is not null or less than or equal to zero.
    if (maximumAllowedCharactersNumberString === null) {
        throw new Error(`The allowed characters number is null.`);
    }
    if (maximumAllowedCharactersNumberString <= 0) {
        throw new Error(`The allowed characters number is less than or equal to zero.`);
    }

    // Taking the text from the file and parsing it.
    const filePath = path.join(__dirname, '../../audio/TextForSpeach/text-for-speach.txt');
    const textFromFile = await readFileContents(filePath);
    const scenarios = parseScenarios(textFromFile);
    const translatedText = scenarios[0].translatedText;
    // Remove the prefix from the text.
    const prefixToRemove = "Описание на първия сценарий: ";
    const englishText = removePrefixFromText(translatedText, prefixToRemove);
    const maximumAllowedCharactersNumber: number = Number(maximumAllowedCharactersNumberString);
    const textParts = splitTextIntoChunks(englishText, maximumAllowedCharactersNumber - 10);
    const textToSpeachInputTextElement = `//*[@*='input_text']`;
    await fillAndCheckInput(page, textToSpeachInputTextElement, textParts[0]);
    await staticWait(2000); // Изчаква 5000 милисекунди (5 секунди)

    /** Select Eric Voice */
    const ericVoice = `//*[@id='radioPrimaryen-US-EricNeural']`;
    const changePitchElement1 = `((//*[@*='irs-grid'])[1]/following-sibling::span)[1]`;
    const changePitchElement2 = `((//*[@*='irs-grid'])[1]/following-sibling::span)[3]`;
    const changePitchElement3 = `//*[@*='voice_pitch_bin']`;
    const changeAudjustVoiceSpeedElement1 = `((//*[@*='irs-grid'])[2]/following-sibling::span)[1]`;
    const changeAudjustVoiceSpeedElement2 = `((//*[@*='irs-grid'])[2]/following-sibling::span)[3]`;
    const changeAudjustVoiceSpeedElement3 = `//*[@*='volume_range']`;
    const changePitchAttribute = `style`;
    const changePitchValue1 = `left: 0px; width: 45.1483%;`;
    const changePitchValue2 = `left: 43.6655%;`;
    const changePitchValue3 = `-5`;
    const changeAudjustVoiceSpeedValue1 = `left: 0px; width: 41.2669%;`;
    const changeAudjustVoiceSpeedValue2 = `left: 39.7842%;`;
    const changeAudjustVoiceSpeedValue3 = `-18`;

    await checkBox(page, ericVoice);

    await changeElementAttribute(page, changePitchElement1, changePitchAttribute, changePitchValue1);
    await changeElementAttribute(page, changePitchElement2, changePitchAttribute, changePitchValue2);
    await changeElementAttribute(page, changePitchElement3, changePitchAttribute, changePitchValue3);
    await changeElementAttribute(page, changeAudjustVoiceSpeedElement1, changePitchAttribute, changeAudjustVoiceSpeedValue1);
    await changeElementAttribute(page, changeAudjustVoiceSpeedElement2, changePitchAttribute, changeAudjustVoiceSpeedValue2);
    await changeElementAttribute(page, changeAudjustVoiceSpeedElement3, changePitchAttribute, changeAudjustVoiceSpeedValue3);



    // Press the 'Convert Now' button.
    const convertNowButtonElement = `//*[@*='Convert now']`;
    await click(page, convertNowButtonElement);

    // Download the audio file.
    const downloadButtonElement = `//*[@*='btn-group']/a`;
    const downloadLink = await getAttributeValue(page, downloadButtonElement, 'href');
    if (downloadLink === null) {
        throw new Error('Download link not found');
    }
    
    await downloadFile(downloadLink, 'C:/Users/test657/Desktop/script/audio/downloaded/downloaded.mp3');
    

    await staticWait(60000); // Изчаква 5000 милисекунди (5 секунди)

    // Crawling all elements of the 'textParts' array and printing each element to the console.
    // for (const [index, textPart] of textParts.entries()) {
    //     const textToSpeachInputTextElement = `//*[@*='input_text']`;
    //     await fillAndCheckInput(page, textToSpeachInputTextElement, textPart);

    //     const usedCharactersText = `(//*[@*='position-relative']/div)[2]/span`;
    //     const usedCharactersTextString = await getTextFromElement(page, usedCharactersText);
    //     console.log(`-----------------------The used characters text is: ${usedCharactersTextString}`);
    //     const usedCharactersNumber: number = Number(usedCharactersTextString);

    //     if (usedCharactersNumber > maximumAllowedCharactersNumber) {
    //         throw new Error(`The number of characters used in the text is greater than the allowed number of characters.`);
    //     }
    //     else {
    //         console.log(`The used characters number is: ${usedCharactersNumber}`);
    //     }
    //     console.log(`Част ${index + 1}:`, textPart);
    // }




    // console.log("Общтият брой на сценариите е:", scenarios.length);

    // Navigate to 'https://ttsconverter.io/convert'.

    await browser.close();
}

async function click(page: Page, selector: string): Promise<void> {
    // Verify that the element is ready for interaction.
    await isElementReadyForInteraction(page, selector);
    // Click the element.
    await page.click(selector);
}

async function isElementReadyForInteraction(page: Page, selector: string): Promise<void> {
    // Проверява дали елементът е наличен и видим
    await page.waitForSelector(selector, { state: 'visible' });
    const isVisible = await page.isVisible(selector);
    if (!isVisible) {
        throw new Error(`The element with selector ${selector} is NOT VISIBLE.`);
    }

    // Check if the element is only one in the DOM tree.
    const elements = await page.$$(selector);
    if (elements.length !== 1) {
        throw new Error(`The element with selector ${selector} is NOT UNIQUE in the DOM tree. ${elements.length} elements found.`);
    }

}

async function fillAndCheckInput(page: Page, selector: string, textToEnter: string): Promise<boolean> {
    // Verify that the element is ready for interaction.
    await isElementReadyForInteraction(page, selector);

    // Въведете текст в текстовото поле
    await page.fill(selector, textToEnter);

    // Получете стойността на текстовото поле
    const enteredText = await page.inputValue(selector);

    // Проверете дали въведеният текст съвпада с очаквания
    return enteredText === textToEnter;
}

async function checkBox(page: Page, selector: string): Promise<void> {
    // Verify that the element is ready for interaction.
    await isElementReadyForInteraction(page, selector);
    await page.focus(selector);
    await page.keyboard.press('Space');
    await page.isChecked(selector);
}


/**
 * Функция за генериране на произволно число в даден диапазон
 * @param min Минимална стойност на диапазона
 * @param max Максимална стойност на диапазона
 * @returns Произволно число в зададения диапазон
 */
function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Функция за статично изчакване с произволна продължителност в даден диапазон
 * @param minMs Минимална продължителност на изчакването в милисекунди
 * @param maxMs Максимална продължителност на изчакването в милисекунди
 */
async function randomWait(minMs: number, maxMs: number): Promise<void> {
    const waitTime = getRandomInt(minMs, maxMs);
    return new Promise(resolve => setTimeout(resolve, waitTime));
}

// Пример за използване на функцията за произволно изчакване в асинхронна функция.
async function waitRandomTime() {
    console.log("Стартиране на произволно изчакване");

    // Изчакайте произволно време между minWaitTime и minWaitTime милисекунди.
    await randomWait(minWaitTime, maxWaitTime);

    console.log("Изчакването приключи");
}

/**
 * Изчаква зададен брой милисекунди.
 * @param milliseconds Брой милисекунди за изчакване.
 * @returns Promise, който се разрешава след изчакването.
 */
function staticWait(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}


async function getTextFromElement(page: Page, selector: string): Promise<string> {
    return page.$eval(selector, (element: HTMLElement | SVGElement) => {
        if ('innerText' in element) {
            return element.innerText;
        } else {
            // Handle the case where the element does not have an innerText property
            return ''; // Return an empty string or handle it as you see fit
        }
    });
}

/**
 * @description Trims the text and extracts the number from it.
 * @param text  The text to be trimmed and extracted from.
 * @returns     The extracted number or null if no number is found.
 * @example     extractNumberFromText("0/1000 characters per conversion. Get more characters") // Should return 1000
 */
function extractNumberFromText(text: string): number | null {
    const regex = /\/(\d+)/; // Този регулярен израз открива числа след символа '/'
    const match = text.match(regex);
    return match ? parseInt(match[1]) : null; // Взема числото след символа '/' (втората група в съвпадението)
}


/** Parsing the scenarios from the text file. */
// Reading data from txt file
async function readFileContents(filePath: string): Promise<string> {
    try {
        const data = await fsPromises.readFile(filePath, { encoding: 'utf-8' });
        return data;
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}

// Declare the interface for the scenario.
interface Scenario {
    title: string;
    translatedText: string;
    description: string;
}

function parseScenarios(text: string): Scenario[] {
    const scenarioRegex = /Title: "(.+?)"\s+Translated Text:\s+(.+?)\s+Description:\s+(.+?)(?=Title:|$)/gs;
    const scenarios: Scenario[] = [];
    let match;

    while ((match = scenarioRegex.exec(text)) !== null) {
        const [_, title, translatedText, description] = match;
        scenarios.push({ title, translatedText, description });
    }

    return scenarios;
}

/**
 * @description Counts the number of characters in a string.
 * @param str   The string to count the characters from.
 * @returns     The number of characters in the string.
 */
function countCharacters(str: string): number {
    return str.length;
}

/**
 * @description     Removes a prefix from a text.
 * @param text      Provided text.
 * @param prefix    Prefix to be removed.
 * @returns         Return text without the prefix.
 * @example         removePrefixFromText("Описание на първия сценарий: Join us in this insightful exploration...", "Описание на първия сценарий: ") // Should print "Join us in this insightful exploration..."
 */
function removePrefixFromText(text: string, prefix: string): string {
    const regex = new RegExp("^" + escapeRegExp(prefix));
    return text.replace(regex, '');
}

// 
/**
 * @description     Escapes special characters in a string for use in a regular expression.
 *                  This function is needed to avoid problems if the prefix contains special characters that are used in regular expressions.
 * @param string    Provided string.
 * @returns         Return string with escaped special characters.
 */
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


/**
 * @description         Splits a text into chunks of a given size.
 * @param text          Provided text.
 * @param maxChunkSize  Maximum size of the chunk.
 * @returns             Array of strings.
 * @example             splitTextIntoChunks("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra...", 990)
 */
function splitTextIntoChunks(text: string, maxChunkSize: number): string[] {
    const sentences = text.match(/[^\.!\?]+[\.!\?]+["']?|[^\.!\?]+$/g) || [];
    let currentChunk = '';
    let chunks: string[] = [];

    for (const sentence of sentences) {
        // Проверява дали добавянето на това изречение ще надхвърли максималния размер
        if (currentChunk.length + sentence.length > maxChunkSize) {
            // Ако е така, запазва текущия фрагмент и започва нов
            chunks.push(currentChunk);
            currentChunk = sentence;
        } else {
            // Добавя изречението към текущия фрагмент
            currentChunk += sentence;
        }
    }

    // Добавя последния фрагмент, ако има такъв
    if (currentChunk) {
        chunks.push(currentChunk);
    }

    return chunks;
}

// Функция за промяна на стойността на атрибут на елемент
async function changeElementAttribute(page: Page, xpathSelector: string, attributeName: string, attributeValue: string): Promise<void> {
    await page.evaluate(({ xpathSelector, attributeName, attributeValue }) => {
        const element = document.evaluate(xpathSelector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLElement;
        if (element) {
            element.setAttribute(attributeName, attributeValue);
        }
    }, { xpathSelector, attributeName, attributeValue });
}



/**
 * @description         Gets the value of an attribute of an element.
 * @param page          Page object.
 * @param selector      Selector of the element.
 * @param attributeName Name of the attribute. 
 * @returns             The value of the attribute.
 * @example             getAttributeValue(page, "//*[@*='btn-group']/a", "href") // Should return the value of the href attribute.
 */
async function getAttributeValue(page: Page, selector: string, attributeName: string) {
    const attributeValue = await page.getAttribute(selector, attributeName);
    return attributeValue;
}

async function downloadFile(url: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(outputPath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', async (err) => {
            try {
                await fsPromises.unlink(outputPath); // Use fsPromises here
                reject(err);
            } catch (unlinkErr) {
                reject(unlinkErr);
            }
        });
    });
}