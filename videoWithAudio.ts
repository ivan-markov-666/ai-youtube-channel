import { exec } from 'child_process';

// Define the function with a type for the 'command' parameter
function runCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err) {
                console.error(`exec error: ${err}`);
                reject(err);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            resolve(); // No value to resolve, so use resolve() for a void Promise
        });
    });
}

// Usage of the function remains the same
runCommand('npm run generate-tts')
    .then(() => {
        return runCommand('powershell.exe -ExecutionPolicy Bypass -File ./video.ps1');
    })
    .catch(err => {
        console.error('Error occurred:', err);
    });
