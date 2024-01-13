import { exec } from "child_process";

exec("pwsh -ExecutionPolicy Bypass -File ./video.ps1", (err, stdout, stderr) => {
    if (err) {
        console.error(`Error: ${err.message}`);
        return;
    }
    if (stderr) {
        console.error(`Stderr: ${stderr}`);
    }
    console.log(`Output: ${stdout}`);
});
