import { existsSync, unlinkSync, writeFileSync, readFileSync } from 'fs';
import fetch from 'node-fetch';


interface AIResponse {
    choices: { message: { content: string } }[];
}

export async function extendTextIfNecessary(originalText: string, maxWords: number, systemMessage: string): Promise<string> {
    let extendedText = originalText;
    while (!hasMoreThanWords(extendedText, maxWords)) {
        const response: AIResponse = await sendRequestToAI(systemMessage, extendedText);
        if (response.choices && response.choices.length > 0 && response.choices[0].message) {
            extendedText += " " + response.choices[0].message.content;
        } else {
            break;  // Прекъсва цикъла, ако AI не връща отговор
        }
    }
    return extendedText;
}

export function hasMoreThanWords(str: string, maxWords: number): boolean {
    const words = str.split(/\s+/);
    return words.length > maxWords;
}

export function removeEmptyNewLines(str: string): string {
    // Премахва редове, които съдържат само пространство и нов ред
    return str.replace(/^\s*[\r\n]/gm, '');
}

export function recreateFile(filePath: string): void {
    // Проверява дали файлът съществува
    if (existsSync(filePath)) {
        // Изтрива файлът ако съществува
        unlinkSync(filePath);
    }

    // Създава празен файл или презаписва съществуващ файл
    writeFileSync(filePath, '', { encoding: 'utf8' });
}

export function readMessagesFromFilePath(filePath: string, messageType: string): string[][] {
    const fileContent = readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');

    const messages: string[][] = [];
    let currentMessage: string[] = [];
    let recording = false;

    for (let line of lines) {
        line = line.trim();

        if (line.startsWith(messageType)) {
            if (currentMessage.length > 0) {
                messages.push(currentMessage);
            }
            currentMessage = [];
            recording = true;
        } else if (recording && line) {
            currentMessage.push(line);
        }
    }

    // Добавя последното съобщение, ако има такова
    if (currentMessage.length > 0) {
        messages.push(currentMessage);
    }

    return messages;
}


function timeoutPromise(milliseconds: number): [Promise<never>, () => void] {
    let timeoutId: NodeJS.Timeout;
    const promise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`Timeout след ${milliseconds} милисекунди`));
        }, milliseconds);
    });

    const cancelTimeout = () => clearTimeout(timeoutId);

    return [promise, cancelTimeout];
}


export async function sendRequestToAI(systemMessage: string, messageToAI: string): Promise<any> {
    const url = 'http://localhost:1234/v1/chat/completions';
    const body = {
        messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: messageToAI }
        ],
        temperature: 0.7,
        max_tokens: -1,
        stream: false
    };

    // Задаване на 4 часа timeout
    const fetchPromise = fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }).then(response => {
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        return response.json();
    });

    const [timeout, cancelTimeout] = timeoutPromise(14400000);

    try {
        const response = await Promise.race([fetchPromise, timeout]);
        cancelTimeout();
        return response;
    } catch (error) {
        cancelTimeout();
        throw error;
    }
}