import { exec } from 'child_process';

const execute = (command: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`error: ${error.message}`);
                reject(error);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }
            console.log(`stdout: ${stdout}`);
            resolve();
        });
    });
};

const runScriptsSequentially = async () => {
    try {
        await execute('ts-node generateTTS.ts');
        console.log('generateTTS.ts script has been executed.');
        await execute('ts-node video.ts');
    } catch (error) {
        console.error('An error occurred:', error);
    }
};

runScriptsSequentially();
