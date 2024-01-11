/*  This file is used to run the video.ps1 script. */

import { exec } from 'child_process';

exec('powershell.exe -ExecutionPolicy Bypass -File ./video.ps1', (err, stdout, stderr) => {
    if (err) {
        console.error(`exec error: ${err}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
});
