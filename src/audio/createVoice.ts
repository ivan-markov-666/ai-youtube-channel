import assert from 'assert';
import { chromium, BrowserContext, Page } from 'playwright';
import * as fs from 'fs';
import { promises as fsPromises, mkdirSync } from 'fs';
import path from 'path';
import https from 'https';
import { createDirectory } from './mergeSongAndVoice';

const minWaitTime = 3000;
const maxWaitTime = 5000;
const rootDirectory = path.resolve(__dirname, '../..');

export async function createVoice() {
    const browser = await chromium.launch({ headless: false });
    const context: BrowserContext = await browser.newContext();
    const page: Page = await context.newPage();
    // Задаване на размера на прозореца на Full HD
    await page.setViewportSize({ width: 1920, height: 1080 });

    page.setDefaultTimeout(3600000); // Playwright globa timeout

    // Филтрирайте рекламните заявки
    // await filterRequests(page);

    // Create the directory where to put the downloaded files if it does not exist already.
    createDirectory(`${rootDirectory}/audio/downloaded`)
        .then(() => console.log('Папката е създадена успешно.'))
        .catch(err => console.error(err));

    // Navigate to 'https://ttsconverter.io/'.
    const loginTtsPage = `https://ttsconverter.io/login`;
    await goTo(page, loginTtsPage);

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
    console.log("Общтият брой на сценариите е:", scenarios.length);


    for (const [scenarioIndex, scenario] of scenarios.entries()) {
        const translatedText = scenario.translatedText;
        debugMessage(`${scenarioIndex + 1} - ${translatedText}`);
        const maximumAllowedCharactersNumber: number = Number(maximumAllowedCharactersNumberString);
        const textParts = splitTextIntoChunks(translatedText, maximumAllowedCharactersNumber - 10);

        for (const [textPartIndex, textPart] of textParts.entries()) {
            let isCorrectDomain;
            do {
                debugMessage2(`${textPartIndex + 1} - ${textPart}`);
                const textToSpeachInputTextElement = `//*[@*='input_text']`;
                await fillAndCheckInput(page, textToSpeachInputTextElement, textPart);
                await staticWait(2000); // Изчаква 2000 милисекунди (2 секунди)


                /** Select Eric Voice */
                const ericVoice = `//*[@id='radioPrimaryen-US-EricNeural']`;
                const changePitchElement1 = `((//*[@*='irs-grid'])[1]/following-sibling::span)[1]`;
                const changePitchElement2 = `((//*[@*='irs-grid'])[1]/following-sibling::span)[3]`;
                const changePitchElement3 = `//*[@*='voice_pitch_bin']`;
                const changeAudjustVoiceSpeedElement1 = `((//*[@*='irs-grid'])[3]/following-sibling::span)[1]`;
                const changeAudjustVoiceSpeedElement2 = `((//*[@*='irs-grid'])[3]/following-sibling::span)[3]`;
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

                await staticWait(5000); // Изчаква 5000 милисекунди (5 секунди)

                isCorrectDomain = await ensureCorrectDomain(page, 'ttsconverter.io', 'https://ttsconverter.io/');

                if (!isCorrectDomain) {

                    await staticWait(30000); // Изчаква 10000 милисекунди (10 секунди)
                    console.log("Redirected to wrong domain. Repeating the process.");
                    // Тук може да добавите код за ресетиране на някои стойности или действия, ако е необходимо
                }

                console.log("1");
                // Check if the 'Confirm' button is visible.
                const confirmNotARobotButtonElement = `//a[contains(text(),'Confirm')]`;
                console.log("2");
                const isCaptchaRequired = await checkElementPresence(page, confirmNotARobotButtonElement, 10000);
                console.log("3");
                if (isCaptchaRequired) {
                    console.log("4");
                    for (let i = 0; i < 3600; i++) {
                        console.log("5");
                        // This is the logic for waiting for filling the captcha and clicking the 'Confirm' button.
                        try {
                            console.log("6");
                            const confirmVerificationElement = `//*[contains(text(),'Great,')]`;
                            const result = await isElementReadyForInteraction(page, confirmVerificationElement);
                            if (result) {
                                console.log("7");
                                break;
                            }
                        } catch (error) {
                            console.log("8");
                            await staticWait(1000); // Изчаква 1000 милисекунди (1 секунда)
                        }
                    }
                }
            } while (!isCorrectDomain);

            // Download the audio file.
            const downloadButtonElement = `//*[@*='btn-group']/a`;

            const downloadLink = await getAttributeValue(page, downloadButtonElement, 'href');
            if (downloadLink === null) {
                throw new Error('Download link not found');
            }

            // Download the file and verify that the size of the downloaded file is the same as the expected size.
            try {
                const expectedSize = await getFileSize(downloadLink);
                console.log(`Expected file size: ${expectedSize} bytes`);
                const directoryPath = `${rootDirectory}/audio/downloaded/${scenarioIndex + 1}`;

                // Create folder where to put the downloaded files if it does not exist already.
                createDirectorySync(directoryPath);



                const downloadedFilePath = `${directoryPath}/${textPartIndex + 1}.mp3`;

                await downloadFile(downloadLink, downloadedFilePath);

                const stats = await fsPromises.stat(downloadedFilePath);
                if (stats.size === expectedSize) {
                    console.log('Файлът е изтеглен успешно и размерът му съвпада.');
                } else {
                    throw new Error(`Размерът на файла не съвпада. Очакван: ${expectedSize}, Получен: ${stats.size}`);
                }
            } catch (error) {
                console.error('Грешка при проверката или свалянето на файла:', error);
            }


            await goTo(page, 'https://ttsconverter.io/voices-list');
            await isElementReadyForInteraction(page, logoutButtonSelector);
            await goTo(page, 'https://ttsconverter.io/text-to-speech');
        }
    }
    await browser.close();
}

async function checkElementPresence(page: Page, selector: string, timeout: number): Promise<boolean> {
    try {
        // Опит за намиране на елемента с определен таймаут
        await page.waitForSelector(selector, { state: 'visible', timeout: timeout });
        return true; // Елементът е намерен и е видим
    } catch (err) {
        // Елементът не е намерен в рамките на зададения таймаут
        return false;
    }
}


async function goTo(page: Page, url: string): Promise<void> {
    await page.goto(url);
    assert.equal(page.url(), url, `The page is not loaded.`);
}

async function click(page: Page, selector: string): Promise<void> {
    // Verify that the element is ready for interaction.
    await isElementReadyForInteraction(page, selector);
    // Click the element.
    await page.click(selector);
}

async function isElementReadyForInteraction(page: Page, selector: string): Promise<boolean> {
    try {
        // Проверява дали елементът е наличен и видим
        await page.waitForSelector(selector, { state: 'visible' });
        const isVisible = await page.isVisible(selector);
        if (!isVisible) {
            return false;
        }

        // Проверява дали елементът е единствен в DOM дървото
        const elements = await page.$$(selector);
        return elements.length === 1;
    } catch (err) {
        // В случай на грешка (например, ако селекторът не е намерен), връща false
        return false;
    }
}

async function fillAndCheckInput(page: Page, selector: string, textToEnter: string): Promise<boolean> {
    // Verify that the element is ready for interaction.
    await isElementReadyForInteraction(page, selector);

    // Изчистете текстовото поле
    await page.fill(selector, '');

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

async function getFileSize(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
        https.get(url, { method: 'HEAD' }, (response) => {
            const contentLength = response.headers['content-length'];
            if (contentLength) {
                resolve(parseInt(contentLength, 10));
            } else {
                reject(new Error('Content-Length header is not available'));
            }
        }).on('error', (err) => {
            reject(err);
        });
    });
}

function createDirectorySync(directoryPath: string): void {
    try {
        mkdirSync(directoryPath, { recursive: true });
        console.log(`Папката '${directoryPath}' беше успешно създадена.`);
    } catch (err) {
        console.error('Грешка при създаването на папката:', err);
    }
}

function debugMessage(text: string): void {
    console.log('\x1b[31m', text, '\x1b[0m');
}

function debugMessage2(text: string): void {
    console.log('\x1b[32m', text, '\x1b[0m');
}


async function filterRequests(page: Page) {
    await page.route('**/*', (route) => {
        const url = route.request().url();
        const blockedDomains = [
            'adservice.google.com',
            'doubleclick.net',
            'googleadservices.com',
            'fluct.jp', // Домейн на fluct Reseller
            'advertising.com', // Домейн на AOL Reseller
            'appnexus.com', // Домейн на AppNexus Reseller
            'contextweb.com', // Домейн на ContextWeb Reseller
            'orcinternational.com', // Домейн на ORC International Reseller
            'improvedigital.com', // Домейн на Improve Digital Reseller
            'indexexchange.com', // Домейн на IndexExchange Reseller
            'media.net', // Домейн на Media.net Reseller
            'onetag.com', // Домейн на OneTag Reseller
            'openx.com', // Домейн на OpenX Reseller
            'pubmatic.com', // Домейн на PubMatic Reseller
            'rhythmone.com', // Домейн на RhythmOne Reseller
            'rubiconproject.com', // Домейн на RubiconProject Reseller
            'smartadserver.com', // Домейн на SmartAdServer Reseller
            'smartclip.com', // Домейн на Smartclip Reseller
            'sovrn.com', // Домейн на Sovrn Reseller
            'spotxchange.com', // Домейн на SpotXChange Reseller
            'triplelift.com', // Домейн на Triple Lift Reseller
            'yahoo.com', // Домейн на Yahoo Reseller
            'stickyads.tv', // Домейн на StickyAds TV
            'google.com', // Домейн на Google Interactive Media Ads
        ];

        if (blockedDomains.some(domain => url.includes(domain))) {
            route.abort(); // Прекратяване на заявката
        } else {
            route.continue(); // Продължаване на заявката
        }
    });
}

async function ensureCorrectDomain(page: Page, expectedDomain: string, defaultUrl: string): Promise<boolean> {
    const currentUrl = page.url();
    if (!currentUrl.includes(expectedDomain)) {
        await page.goto(defaultUrl);
        return false; // Връща false, ако е наложило пренасочване
    }
    return true; // Връща true, ако домейнът е правилен
}