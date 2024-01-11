npm run generate-tts

Write-Host "----------------------------ei go na"

# Включване на файла methods.ps1
. .\methods.ps1

# Задайте пътя до директорията с видео файлове (mp4) за обработка.
$directory = ".\videos\landscape\converted\cut\"

# Задайте пътя до директорията, чийто брой поддиректории искате да намерите
$audioFilesFolderPath = ".\02.generateTTS\final-audio"

# Задайте пътя до директорията, където ще записваме новите видео файлове
$resultFolder = ".\result"

# Извикване на функцията и запазване на резултата в променлива
$audioDirectoryCount = Get-DirectoryCount -directoryPath $audioFilesFolderPath

# Показване на резултата
Write-Host "Брой директории в директорията: $audioDirectoryCount"

# Проверка дали $numberOfFiles е по-малко от 1
if ($audioDirectoryCount -lt 1) {
    Write-Host "Грешка: Стойността на numberOfFiles трябва да бъде 1 или повече."
}
else {
    # Пример за използване на функцията
    Clear-Directory -directoryPath $resultFolder
    # Цикъл от 1 до $audioDirectoryCount
    for ($i = 1; $i -le $audioDirectoryCount; $i++) {
        Write-Host "Обработка на итерация номер $i"

        # Актуализиране на пътя към аудио файла за текущата итерация
        $currentAudioPath = ".\02.generateTTS\final-audio\$i\audio$i.mp3"

        # Проверка дали аудио файлът съществува
        if (-not (Test-Path -Path $currentAudioPath)) {
            Write-Host "Аудио файлът не съществува: $currentAudioPath"
            continue
        }

        # Създаване на поддиректория в .\result за текущото видео
        $currentResultFolderPath = ".\result"
        New-Directory -directoryPath $currentResultFolderPath

        # Вземане на видео файловете от директорията и обработка на тези файлове
        $mp4FilesArray = Get-Mp4Files -directoryPath $directory
        $selectedVideos, $totalSelectedDuration = Get-VideoSequenceForAudio -videos $mp4FilesArray -audioPath $currentAudioPath

        # Пътят на крайния видео файл за текущата итерация, който ще е без звук.
        $outputVideoPath = "$currentResultFolderPath\video$i.mp4"
        # Пътят на крайния видео файл за текущата итерация, който ще е със звук.
        $outputVideoWithAudioPath = "$currentResultFolderPath\$i.mp4"

        # Съединяване на видео файловете
        Merge-Videos $selectedVideos $outputVideoPath

        # Добавяне на аудио към видео
        Add-AudioToVideo -videoPath $outputVideoPath -audioPath $currentAudioPath -outputVideoPath $outputVideoWithAudioPath

        Write-Host "Видео със звук за итерация $i е създадено: $outputVideoWithAudioPath"

        Remove-File -filePath $outputVideoPath
    }
}