# Задайте пътя до ffprobe.exe
$ffprobePath = "C:\Program Files\FFmpeg\ffmpeg-2023-07-02-git-50f34172e0-full_build\bin\ffprobe.exe"

# Функция за извличане на списък с видео файлове (mp4) от дадена директория.
function Get-Mp4Files {
    param (
        [string]$directoryPath
    )
    $mp4Files = Get-ChildItem -Path $directoryPath -Filter *.mp4 -Recurse -File | ForEach-Object {
        $_.FullName
    }
    return $mp4Files
}

# Функция за извличане на продължителността на видео файл
function Get-VideoDuration {
    param (
        [string]$videoPath
    )
    # Изпълнение на ffprobe за получаване на метаданни за видеото
    $output = & $ffprobePath -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$videoPath"
    # Преобразуване на изхода в число
    $duration = [System.Math]::Round($output, 2)
    return $duration
}

# Функция за извличане на продължителността на аудио файл
function Get-AudioDuration {
    param (
        [string]$audioPath
    )
    # Изпълнение на ffprobe за получаване на метаданни за аудиото
    $output = & $ffprobePath -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$audioPath"
    # Преобразуване на изхода в число
    $duration = [System.Math]::Round($output, 2)
    return $duration
}

# Функция за избирането на произволен видео файлове от ArrayList с видео файлове. Този видео файл се премахва от списъка, за да не бъде избран отново.
function Get-RandomVideo {
    param (
        [System.Collections.ArrayList]$videos
    )
    # Избиране на произволен индекс от списъка с видео файлове
    $randomIndex = Get-Random -Minimum 0 -Maximum $videos.Count
    # Връщане на произволния видео файл
    $selectedVideo = $videos[$randomIndex]
    # Премахване на избрания видео файл от списъка, за да не бъде избран отново
    $videos.RemoveAt($randomIndex)
    return $selectedVideo
}

# Функция за избиране на произволен видео файлове от масив с видео файлове. Този видео файл се премахва от списъка, за да не бъде избран отново.
# Проверява се дали продължителността на избрания видео файл е по-голяма или равна на продължителността на аудио файла. Ако е по-малка, то се избира нов произволен видео файл. Това се повтаря докато не се намери видео файл с продължителност по-голяма или равна на продължителността на аудио файла.
function Get-VideoSequenceForAudio {
    param (
        [System.Collections.ArrayList]$videos,
        [string]$audioPath
    )
    # Получаване на продължителността на аудио файла
    $totalAudioDuration = Get-AudioDuration -audioPath $audioPath
    $selectedVideos = New-Object System.Collections.ArrayList
    $currentDuration = 0
    while ($videos.Count -gt 0 -and $currentDuration -lt $totalAudioDuration) {
        # Избиране на произволен видео файл
        $randomVideo = Get-RandomVideo -videos $videos
        # Получаване на продължителността на избрания видео файл
        $videoDuration = Get-VideoDuration -videoPath $randomVideo
        # Добавяне на видео файла в крайния списък
        [void]$selectedVideos.Add($randomVideo)
        # Обновяване на текущата продължителност
        $currentDuration += $videoDuration
        # Проверка дали текущата продължителност е по-голяма или равна на продължителността на аудиото
        if ($currentDuration -ge $totalAudioDuration) {
            break
        }
    }
    # Връщане на избраните видео клипове и общата продължителност
    return $selectedVideos, $currentDuration
}

# Функция за анализиране на видео файл с ffprobe и записване на резултатите в текстов файл (по подразбиране в същата директория, където се намира видео файлът).
function Get-VideoFileInformation {
    param (
        [string]$videoPath,
        [string]$outputFilePath
    )
    # Проверка дали файлът за запис съществува
    if (-not (Test-Path $outputFilePath)) {
        # Създаване на файл за запис, ако не съществува
        New-Item -Path $outputFilePath -ItemType "file" -Force
    }
    # Изпълнение на ffprobe и записване на резултатите
    $ffprobeOutput = & $ffprobePath -v error -show_entries stream=width, height, pix_fmt -of default=noprint_wrappers=1:nokey=1 "$videoPath"
    # Записване на информацията в текстовия файл
    Add-Content -Path $outputFilePath -Value "Video File: $videoPath"
    Add-Content -Path $outputFilePath -Value $ffprobeOutput
    Add-Content -Path $outputFilePath -Value "----------------------"
}

# Функция за съединяване на видео файлове от масив
function Merge-Videos($videos, $outputVideoPath) {
    $ffmpegCommand = "ffmpeg"
    # Добавяне на видео файловете към командата
    for ($i = 0; $i -lt $videos.Count; $i++) {
        $ffmpegCommand += " -i `"$($videos[$i])`""
    }

    # Създаване на филтъра за мащабиране и съединяване
    $filterComplex = ""
    for ($i = 0; $i -lt $videos.Count; $i++) {
        # Мащабиране и установяване на Display Aspect Ratio (DAR) за всеки видео поток
        $filterComplex += "[${i}:v]scale=1920x1080,setdar=16/9[v$i];"
    }
    # Конкатениране на обработените видео потоци
    for ($i = 0; $i -lt $videos.Count; $i++) {
        $filterComplex += "[v$i]"
    }
    $filterComplex += "concat=n=$($videos.Count):v=1:a=0[v]"

    # Добавяне на филтъра към командата
    $ffmpegCommand += " -filter_complex `"$filterComplex`" -map `[v]` `"$outputVideoPath`""

    # Изпълнение на командата
    Invoke-Expression $ffmpegCommand
}

# Функция за добавяне на аудио към видео файл.
function Add-AudioToVideo {
    param (
        [string]$videoPath,
        [string]$audioPath,
        [string]$outputVideoPath
    )
    # Получаване на продължителността на видео и аудио файла
    $videoDuration = Get-VideoDuration -videoPath $videoPath
    $audioDuration = Get-AudioDuration -audioPath $audioPath

    # Създаване на ffmpeg командата
    $ffmpegCommand = "ffmpeg -i `"$videoPath`" -i `"$audioPath`""

    # Проверка дали видеото е по-дълго от аудиото
    if ($videoDuration -gt $audioDuration) {
        # Ако видеото е по-дълго, то се срязва до дължината на аудиото
        $ffmpegCommand += " -t $audioDuration"
    }

    # Добавяне на аудиото към видеото и съхранение на резултата в изходния файл
    $ffmpegCommand += " -c:v copy -c:a aac -strict experimental `"$outputVideoPath`""

    # Изпълнение на командата
    Invoke-Expression $ffmpegCommand
}
