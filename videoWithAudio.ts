/** 
 * This script sequentially runs two scripts: generateTTS.ts and video.ts. 
 * It utilizes Node.js's child_process module to execute these scripts and handle errors.
 */

// Import modules
import { exec } from 'child_process'; // Importing the exec function from the child_process module for executing shell commands

/**
 * Executes a shell command and returns a promise.
 * @param {string} command - The shell command to be executed.
 * @returns {Promise<void>} - A promise that resolves when the command execution is complete, or rejects if an error occurs.
 */
const execute = (command: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Execute the command and handle the callback
        exec(command, (error, stdout, stderr) => {
            // Handle errors
            if (error) {
                console.error(`error: ${error.message}`);
                reject(error);
                return;
            }
            // Log standard error output
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }
            // Log standard output
            console.log(`stdout: ${stdout}`);
            resolve();
        });
    });
};

/**
 * Runs the generateTTS.ts and video.ts scripts sequentially.
 * Logs a message on successful execution or throws an error if any script fails.
 */
const runScriptsSequentially = async () => {
    try {
        // Execute the first script and log on success
        await execute('ts-node generateTTS.ts');
        console.log('generateTTS.ts script has been executed.');

        // Execute the second script
        await execute('ts-node video.ts');
    } catch (error) {
        // Handle and throw errors encountered during script execution
        throw new Error(`An error occurred: ${error}` );
    }
};

// Execute the function to run scripts sequentially
runScriptsSequentially();
