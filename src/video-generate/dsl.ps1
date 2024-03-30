# Задайте пътя до ffprobe.exe
$ffprobePath = "C:\Program Files\FFmpeg\ffmpeg-2023-07-02-git-50f34172e0-full_build\bin\ffprobe.exe"

# Function to retrieve a list of MP4 video files from a given directory.
function Get-Mp4Files {
    param (
        [string]$directoryPath  # Parameter for specifying the directory path
    )
    # Retrieves all .mp4 files within the specified directory and its subdirectories
    $mp4Files = Get-ChildItem -Path $directoryPath -Filter *.mp4 -Recurse -File | ForEach-Object {
        $_.FullName  # Extracts the full file path of each .mp4 file
    }
    return $mp4Files  # Returns the list of MP4 file paths
}

# Function to extract the duration of a video file.
function Get-VideoDuration {
    param (
        [string]$videoPath  # Parameter for specifying the path to the video file
    )
    # Executes ffprobe to obtain metadata about the video. 
    # '-v error' sets the logging level to show only errors.
    # '-show_entries format=duration' requests only the duration data.
    # '-of default=noprint_wrappers=1:nokey=1' formats the output to be plain text without additional information.
    $output = & $ffprobePath -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$videoPath"

    # Converts the output to a number and rounds it to two decimal places.
    $duration = [System.Math]::Round($output, 2)

    return $duration  # Returns the duration of the video
}

# Function to extract the duration of an audio file.
function Get-AudioDuration {
    param (
        [string]$audioPath  # Parameter for specifying the path to the audio file
    )
    # Executes ffprobe to obtain metadata about the audio. 
    # '-v error' sets the logging level to show only errors.
    # '-show_entries format=duration' requests only the duration data.
    # '-of default=noprint_wrappers=1:nokey=1' formats the output to be plain text without additional information.
    $output = & $ffprobePath -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$audioPath"

    # Converts the output to a number and rounds it to two decimal places.
    $duration = [System.Math]::Round($output, 2)

    return $duration  # Returns the duration of the audio file
}

# Function to randomly select a video file from an ArrayList of video files.
function Get-RandomVideo {
    param (
        [System.Collections.ArrayList]$videos  # Parameter for specifying the ArrayList of video files
    )
    # Randomly choose an index from the list of video files
    $randomIndex = Get-Random -Minimum 0 -Maximum $videos.Count

    # Retrieve the selected video file using the random index
    $selectedVideo = $videos[$randomIndex]

    # Remove the selected video file from the list to avoid reselection
    $videos.RemoveAt($randomIndex)

    return $selectedVideo  # Return the randomly selected video file
}

# Function to select random video files from an array of video files. This video file is removed from the list so that it will not be selected again.
# Checks if the duration of the selected video file is greater than or equal to the duration of the audio file. If it is smaller, a new random video file is selected. This is repeated until a video file with a duration greater than or equal to the duration of the audio file is found.
function Get-VideoSequenceForAudio {
    param (
        [System.Collections.ArrayList]$videos,  # ArrayList of video files
        [string]$audioPath                      # Path to the audio file
    )
    # Get the duration of the audio file
    $totalAudioDuration = Get-AudioDuration -audioPath $audioPath
    # Initialize an ArrayList to store the selected videos
    $selectedVideos = New-Object System.Collections.ArrayList
    # Initialize a variable to track the current total duration of selected videos
    $currentDuration = 0

    # Loop until the total duration of selected videos meets or exceeds the audio file's duration
    while ($videos.Count -gt 0 -and $currentDuration -lt $totalAudioDuration) {
        # Select a random video file
        $randomVideo = Get-RandomVideo -videos $videos
        # Get the duration of the selected video file
        $videoDuration = Get-VideoDuration -videoPath $randomVideo
        # Add the selected video to the final list
        [void]$selectedVideos.Add($randomVideo)
        # Update the current total duration
        $currentDuration += $videoDuration
        # Break the loop if the current duration meets or exceeds the audio duration
        if ($currentDuration -ge $totalAudioDuration) {
            break
        }
    }
    # Return the list of selected video clips and their total duration
    return $selectedVideos, $currentDuration
}

# Function to merge multiple video files into a single video file.
function Merge-Videos {
    param (
        $videos,               # Array of video file paths to be merged
        [string]$outputVideoPath  # Path for the output merged video file
    )
    # Initialize the ffmpeg command
    $ffmpegCommand = "ffmpeg"
    # Add each video file to the ffmpeg command
    for ($i = 0; $i -lt $videos.Count; $i++) {
        $ffmpegCommand += " -i `"$($videos[$i])`""
    }

    # Create the filter chain for scaling and concatenating
    $filterComplex = ""
    for ($i = 0; $i -lt $videos.Count; $i++) {
        # Scale each video stream to a specific resolution and set the Display Aspect Ratio (DAR)
        $filterComplex += "[${i}:v]scale=1920x1080,setdar=16/9[v$i];"
    }
    # Concatenate the processed video streams
    for ($i = 0; $i -lt $videos.Count; $i++) {
        $filterComplex += "[v$i]"
    }
    $filterComplex += "concat=n=$($videos.Count):v=1:a=0[v]"

    # Add the filter chain to the ffmpeg command
    $ffmpegCommand += " -filter_complex `"$filterComplex`" -map `[v]` `"$outputVideoPath`""

    # Execute the ffmpeg command
    Invoke-Expression $ffmpegCommand
}

# Function to add an audio track to a video file.
function Add-AudioToVideo {
    param (
        [string]$videoPath,         # Path to the video file
        [string]$audioPath,         # Path to the audio file
        [string]$outputVideoPath    # Path for the output video file with the added audio
    )
    # Get the durations of both the video and audio files
    $videoDuration = Get-VideoDuration -videoPath $videoPath
    $audioDuration = Get-AudioDuration -audioPath $audioPath

    # Initialize the ffmpeg command to combine video and audio
    $ffmpegCommand = "ffmpeg -i `"$videoPath`" -i `"$audioPath`""

    # Check if the video is longer than the audio
    if ($videoDuration -gt $audioDuration) {
        # If the video is longer, trim it to match the length of the audio
        $ffmpegCommand += " -t $audioDuration"
    }

    # Add the audio to the video and specify the output file format
    # '-c:v copy' copies the video stream as is
    # '-c:a aac' encodes the audio stream to AAC
    # '-strict experimental' allows using experimental features, necessary for some audio codecs
    $ffmpegCommand += " -c:v copy -c:a aac -strict experimental `"$outputVideoPath`""

    # Execute the ffmpeg command
    Invoke-Expression $ffmpegCommand
}

# Function to get the count of directories within a specified directory.
function Get-DirectoryCount {
    param (
        [string]$directoryPath  # Parameter for specifying the directory path
    )

    try {
        # Retrieve all items in the directory and filter only the directories
        $directories = Get-ChildItem -Path $directoryPath -Directory

        # Return the count of directories
        return $directories.Count
    }
    catch {
        # In case of an error, display an error message and return null
        Write-Host "Error: $_"
        return $null
    }
}

# Function to create a new directory.
function New-Directory {
    param (
        [string]$directoryPath  # Parameter for specifying the path of the new directory
    )

    try {
        # Check if the directory already exists
        if (-not (Test-Path -Path $directoryPath)) {
            # Create the directory if it does not exist
            New-Item -Path $directoryPath -ItemType Directory
            Write-Host "Directory created successfully: $directoryPath"
        }
        else {
            # Inform if the directory already exists
            Write-Host "Directory already exists: $directoryPath"
        }
    }
    catch {
        # Catch any errors during the directory creation process and display an error message
        Write-Host "Error creating directory: $_"
    }
}

# Function to remove a file.
function Remove-File {
    param (
        [string]$filePath  # Parameter for specifying the path of the file to be removed
    )

    try {
        # Check if the file exists
        if (Test-Path -Path $filePath) {
            # Remove the file using Remove-Item cmdlet with Force parameter to ensure deletion
            Remove-Item -Path $filePath -Force
            Write-Host "File successfully deleted: $filePath"
        }
        else {
            # Inform if the file does not exist
            Write-Host "File does not exist: $filePath"
        }
    }
    catch {
        # Catch any errors during the file removal process and display an error message
        Write-Host "Error deleting file: $_"
    }
}

# Function to clear all contents of a specified directory.
function Clear-Directory {
    param (
        [string]$directoryPath  # Parameter for specifying the path of the directory to be cleared
    )

    try {
        # Check if the directory exists
        if (Test-Path -Path $directoryPath) {
            # Delete all files and subdirectories within the directory
            Get-ChildItem -Path $directoryPath -Recurse | Remove-Item -Force -Recurse
            Write-Host "Directory has been cleared: $directoryPath"
        }
        else {
            # Inform if the directory does not exist
            Write-Host "Directory does not exist: $directoryPath"
        }
    }
    catch {
        # Catch any errors during the clearing process and display an error message
        Write-Host "Error during deletion: $_"
    }
}

# Function to retrieve a specific value from a .env file based on a key.
function Get-EnvValue {
    param (
        [string]$key  # Parameter for specifying the key whose value is to be retrieved
    )

    # Read the contents of the .env file, silently continue on error
    $lines = Get-Content ".\.env" -ErrorAction SilentlyContinue
    foreach ($line in $lines) {
        # Check if the current line contains the key
        if ($line -match "$key=(.*)") {
            # If found, extract the value part using a regex match
            # Use .Trim('') to remove single quotes from the beginning and end of the value
            return $matches[1].Trim("'")
        }
    }

    # Return null if the key is not found in the .env file
    return $null
}
