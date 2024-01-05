
import { appendFileSync } from 'fs';
import { readMessagesFromFilePath, sendRequestToAI, recreateFile, removeEmptyNewLines, hasMoreThanWords } from './src/ai-generate-content/createTextContentFromPrompt';

interface AIResponse {
    choices: { message: { content: string } }[];
}

async function main() {
    const message2FilePath = './01.precondition/scenarious/message2.txt';
    const outputFilePath = './audio/TextForSpeach/text-for-speach.txt';

    // Проверяваме дали файлът съществува и го създаваме/изтриваме
    recreateFile(outputFilePath);

    const message2Content = readMessagesFromFilePath(message2FilePath, 'текст съобщение 2:');
    let allKeyPointsText = []; // Масив за съхранение на всички генерирани keyPointValue2

    for (const message2Array of message2Content) {
        let theme = '';
        let quote = '';
        let keyPoints: string[] = [];
        let recordingKeyPoints = false;

        for (const line of message2Array) {
            if (line.startsWith('Theme:')) {
                theme = line.substring('Theme:'.length).trim();
                console.log('Theme:', theme);
            } else if (line.startsWith('Quote:')) {
                quote = line.substring('Quote:'.length).trim();
                console.log('Quote:', quote);
            } else if (line.startsWith('Key Points:')) {
                recordingKeyPoints = true;
                continue;
            } else if (recordingKeyPoints) {
                keyPoints.push(line);
            }
        }

        // Записване на отговора във файл
        appendFileSync(outputFilePath, `Title: ${theme}\n\nTranslated Text:\n${quote}\n`);

        // Обработка на всеки ключов пункт
        if (keyPoints.length > 0) {
            for (const point of keyPoints) {
                const keyPointResponse: AIResponse = await sendRequestToAI(`Imagine you're a pastor speaking in front of a group of devout Christians in a church. Please give extended texts related to every bullet point, but please do not add a counter to the text. Just create free text without any countering. I am providing you a bullet point related to the current theme:\n${theme}\nPlease generate text for that bullet point.`, point);
                let keyPointValue = "";
                if (keyPointResponse.choices && keyPointResponse.choices.length > 0 && keyPointResponse.choices[0].message) {
                    keyPointValue = keyPointResponse.choices[0].message.content;
                }
                let keyPointValue2 = removeEmptyNewLines(keyPointValue);
                allKeyPointsText.push(keyPointValue2);
                // appendFileSync(outputFilePath, `Key Point ${[point]}:${keyPointValue2}`);
                appendFileSync(outputFilePath, keyPointValue2);
            }
        } else {

            const aiGeneratedText: AIResponse = await sendRequestToAI(`Imagine you're a pastor speaking in front of a group of devout Christians in a church. Please give extended texts related to the theme and to the quote from the Bible. Please try to not add a counter to the text. Just create free text without any countering. The theme is:\n${theme}\nPlease generate text for that quote from the Bible.`, quote);
            let aiGeneratedTextWithNoNewLines = "";
            if (aiGeneratedText.choices && aiGeneratedText.choices.length > 0 && aiGeneratedText.choices[0].message) {
                aiGeneratedTextWithNoNewLines = aiGeneratedText.choices[0].message.content;
            }
            aiGeneratedTextWithNoNewLines = removeEmptyNewLines(aiGeneratedTextWithNoNewLines);
            appendFileSync(outputFilePath, aiGeneratedTextWithNoNewLines);
        }

        // // Комбиниране на всички keyPointValue2 в един текст
        // const combinedKeyPointsText = allKeyPointsText.join(" ");

        // // Изпращане на заявка към AI за генериране на описание
        // const descriptionResponse: AIResponse = await sendRequestToAI("A text should be made to be placed on YouTube as a description of the text that I am now providing you with.", combinedKeyPointsText);
        // let description = "";
        // if (descriptionResponse.choices && descriptionResponse.choices.length > 0 && descriptionResponse.choices[0].message) {
        //     description = descriptionResponse.choices[0].message.content;
        // }

        // // Записване на отговора във файл
        // appendFileSync(outputFilePath, `\n\nDescription:\n${description}\n\n`);
        appendFileSync(outputFilePath, `\n\nDescription:\n\n`);
    }
}

main();
