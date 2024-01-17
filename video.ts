/** 
 * This script executes a single PowerShell script: video.ps1 using Node.js.
 * It uses the child_process module from Node.js to execute the script.
 */

// Importing modules
import { exec } from "child_process"; // Importing the exec function from the child_process module for executing shell commands

/**
 * Executes a PowerShell script (video.ps1) and handles the output returned from it.
 * Uses 'pwsh' to execute the script with ExecutionPolicy set to Bypass, removing any execution restrictions.
 * Logs an error message to the console in case of an error.
 */
exec("pwsh -ExecutionPolicy Bypass -File ./video.ps1", (err, stdout, stderr) => {
    // Error handling
    if (err) {
        console.error(`Error: ${err.message}`); // Logs an error message if an error occurs
        return;
    }
    // Handling standard error output
    if (stderr) {
        console.error(`Stderr: ${stderr}`); // Logs the standard error output
    }
    // Handling standard output
    console.log(`Output: ${stdout}`); // Logs the standard output from the script
});
