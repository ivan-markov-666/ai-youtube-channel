# This file contains the main script for creating videos with sound.

# Include the methods.ps1 file
. .\src\video-generate\dsl.ps1

# Call the method for importing the values from the .env file
Import-DotEnv

# Assing the path to the directory with video files (mp4) for processing. Call the value from the .env file.
# In this directory, there must be subdirectories with video (mp4) files.
$directory = $env:VIDEOS_FOLDER_PATH

# Assing the path to the directory with audio files (mp3) for processing.
# In this directory, there must be subdirectories with audio (mp3) files.
$audioFilesFolderPath = ".\02.generateTTS\final-audio"

# Assing the path to the directory where we will save the new video files (this will be the folder with the final result).
$resultFolder = ".\result"

# Get the number of files in the 'audioFilesFolderPath' directory
$audioDirectoryCount = Get-DirectoryCount -directoryPath $audioFilesFolderPath

# Show the how many files are in the 'audioFilesFolderPath' directory
Write-Host "Number of directories in the directory: $audioDirectoryCount"

# Check if $numberOfFiles is less than 1
if ($audioDirectoryCount -lt 1) {
    # Throw an error
    Throw "Error: The value of numberOfFiles must be 1 or more."
}
# Otherwise, if $numberOfFiles is equal or greater than 1
else {
    # Clear the $resultFolder directory
    Clear-Directory -directoryPath $resultFolder
    # Loop from 1 to $audioDirectoryCount
    for ($i = 1; $i -le $audioDirectoryCount; $i++) {
        # Show the current iteration number
        Write-Host "Processing iteration number $i"

        # Update the path to the audio file for the current iteration
        $currentAudioPath = ".\02.generateTTS\final-audio\$i\audio$i.mp3"

        # Check if the audio file exists in the current iteration directory ($currentAudioPath)
        if (-not (Test-Path -Path $currentAudioPath)) {
            # If the audio file does not exist, show an error message and continue to the next iteration
            Write-Host "The audio file does not exist: $currentAudioPath"
            # Continue to the next iteration
            continue
        }

        # Assing the path to the directory where we will save the new video files for the current iteration.
        $currentResultFolderPath = $env:OUTPUT_FOLDER_PATH
        # Create the directory for the current iteration
        New-Directory -directoryPath $currentResultFolderPath

        # Get the video files from the directory and process these files
        $mp4FilesArray = Get-Mp4Files -directoryPath $directory

        # Get the selected video files and the total duration of the selected video files
        $selectedVideos, $totalSelectedDuration = Get-VideoSequenceForAudio -videos $mp4FilesArray -audioPath $currentAudioPath

        # Assing the path to the output video file for the current iteration, which will be without sound.
        $outputVideoPath = "$currentResultFolderPath\video$i.mp4"
        # Assing the path to the output video file for the current iteration, which will be with sound.
        $outputVideoWithAudioPath = "$currentResultFolderPath\$i.mp4"

        # Merging video files into one video file without sound (the output video file will be saved in the $outputVideoPath directory)
        Merge-Videos $selectedVideos $outputVideoPath

        # Adding audio to video (the output video file will be saved in the $outputVideoWithAudioPath directory) 
        Add-AudioToVideo -videoPath $outputVideoPath -audioPath $currentAudioPath -outputVideoPath $outputVideoWithAudioPath

        # Show the path to the output video file for the current iteration, which will be without sound.
        Write-Host "Video with sound for iteration $i is created: $outputVideoWithAudioPath"

        # Remove the video file without sound
        Remove-File -filePath $outputVideoPath
    }
}