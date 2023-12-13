# Включване на файла methods.ps1
. .\methods.ps1

# Задайте пътя до директорията с видео файлове (mp4) за обработка.
# $directory = ".\videos\landscape\converted\cut\"
# Задаване на пътя на аудио файл.
# $audioPath = ".\audio\audio_faded.mp3"
# Пътят на крайния видео файл, който ще е без звук.
# $outputVideoPath = ".\result\final-video.mp4"
# Пътят на крайния видео файл, който ще е със звук.
# $outputVideoWithAudioPath = ".\result\final-video-with-audio.mp4"




$directoryPath = ".\audio\final-audio"
$allAvailableAudioFiles = Get-DirectoryCount -directoryPath $directoryPath
Write-Host "Брой директории в директорията: $allAvailableAudioFiles"

for ($i = 0; $i -lt $allAvailableAudioFiles; $i++) {
    # Вземете пътя на всяка директория
    $currentDirectory = (Get-ChildItem -Path $directoryPath -Directory)[$i].FullName
    $iteration = $i + 1
    $speachAudioFile = "$currentDirectory\audio$iteration.mp3"



    $directory = ".\videos\landscape\converted\cut\$iteration"
## Вземане на видео файловете от директорията и принтиране на броя на файловете и пътищата към тях.
# Вземаме всички mp4 файлове от директорията и записваме резултата в масив от стрингове (пътища към файловете) с име $mp4FilesArray.
$mp4FilesArray = Get-Mp4Files -directoryPath $directory 
# Принтиране на броя на файловете в масива $mp4FilesArray (броя на mp4 файловете в директорията).
$numberOfFiles = $mp4FilesArray.Count
Write-Host "Брой mp4 файлове в директорията: $numberOfFiles"
# Итериране през всеки файл и принтиране на неговия път използвайки foreach цикъл.
foreach ($file in $mp4FilesArray) {
    Write-Host "Файл: $file"
}

# Принтиране на първия mp4 файл от масива $mp4FilesArray.
if ($mp4FilesArray.Count -gt $iteration) {
    Write-Host "Първи файл: $($mp4FilesArray[$iteration])"
}
else {
    Write-Host "Няма намерени mp4 файлове."
}

## Вземане на продължителността на видео файло.
# Присвояване на пътя на първия mp4 файл от масива $mp4FilesArray на променливата $videoPath.
$videoPath = $mp4FilesArray[$iteration]
# Вземане на продължителността на първия mp4 файл от масива $mp4FilesArray.
$duration = Get-VideoDuration -videoPath $videoPath
# Принтиране на продължителността на първия mp4 файл от масива $mp4FilesArray.
Write-Host "Продължителността на видеото е: $duration секунди"

## Вземане на продължителността на аудио файла.
$audioDuration = Get-AudioDuration -audioPath $speachAudioFile
# Принтиране на продължителността на аудио файла.
Write-Host "Продължителността на аудиото е: $audioDuration секунди"

## Избиране на произволен елемент от масива mp4FilesArray и премахване на избрания елемент от масива (избор измежду произволен видео клип, който няма да се паде повторно). Това се случва докато масива не остане празен. 
# Създаване на ArrayList с видео файловете от масива $mp4FilesArray (така ще можем да премахваме елементи от него).
$mp4FilesArray = New-Object System.Collections.ArrayList
# Добавяне на всички елементи от масива $mp4FilesArray в ArrayList.
$mp4FilesArray.AddRange((Get-Mp4Files -directoryPath $directory))
# Вземане на произволен видео файл от списъка с видео файлове
$randomVideo = Get-RandomVideo -videos $mp4FilesArray
# Принтиране на произволния видео файл
Write-Host "Произволен видео файл: $randomVideo"
# # Принтиране на останалите видео файлове в списъка
# Write-Host "Останалите видео файлове са: $mp4FilesArray"
# Вземане на произволен видео файл от списъка с видео файлове
$randomVideo = Get-RandomVideo -videos $mp4FilesArray
# Принтиране на произволния видео файл
Write-Host "Произволен видео файл: $randomVideo"
# Вземане на произволен видео файл от списъка с видео файлове
$randomVideo = Get-RandomVideo -videos $mp4FilesArray
# Принтиране на произволния видео файл
Write-Host "Произволен видео файл: $randomVideo"
# Създаване на ArrayList с видео файловете от масива $mp4FilesArray (така ще можем да премахваме елементи от него).
$mp4FilesArray = New-Object System.Collections.ArrayList
# Добавяне на всички елементи от масива $mp4FilesArray в ArrayList.
$mp4FilesArray.AddRange((Get-Mp4Files -directoryPath $directory))
# Вземане на произволен видео файл от списъка с видео файлове
$selectedVideos, $totalSelectedDuration = Get-VideoSequenceForAudio -videos $mp4FilesArray -audioPath $speachAudioFile
# Принтиране на избраните видео файлове и тяхната продължителност (в секунди).
foreach ($video in $selectedVideos) {
    Write-Host "Избрано видео: $video"
    $duration = Get-VideoDuration -videoPath $video
    Write-Host "Продължителност на видеото: $duration секунди"
}
# Принтиране на общата продължителност на избраните видео клипове.
Write-Host "Обща продължителност на избраните видео клипове: $totalSelectedDuration секунди"
# Принтиране на продължителността на аудио файла.
Write-Host "Продължителността на аудиото е: $audioDuration секунди"

## Изготвяне на видео файл съставен от произволните видео файлове.
# Масив с пътища към видео файловете
$videos = @(
    $selectedVideos
)
$outputVideoPath = ".\result\final-video-$iteration.mp4"
# Извикване на функцията за съединяване
try {
    Merge-Videos $videos $outputVideoPath
    Write-Host "Видеоклипът е създаден успешно."
}
catch {
    Write-Host "Грешка: $_"
}

# Пример за използване на функцията
$createNewFolder = ".\result\final-video-with-audio\$iteration"
New-Directory -directoryPath $createNewFolder

$outputVideoWithAudioPath = ".\result\final-video-with-audio\$iteration\$iteration.mp4"

## Съединяване на крайния видео файл с аудио файла.
Add-AudioToVideo -videoPath $outputVideoPath -audioPath $speachAudioFile -outputVideoPath $outputVideoWithAudioPath
}



# ## Вземане на видео файловете от директорията и принтиране на броя на файловете и пътищата към тях.
# # Вземаме всички mp4 файлове от директорията и записваме резултата в масив от стрингове (пътища към файловете) с име $mp4FilesArray.
# $mp4FilesArray = Get-Mp4Files -directoryPath $directory 
# # Принтиране на броя на файловете в масива $mp4FilesArray (броя на mp4 файловете в директорията).
# $numberOfFiles = $mp4FilesArray.Count
# Write-Host "Брой mp4 файлове в директорията: $numberOfFiles"
# # Итериране през всеки файл и принтиране на неговия път използвайки foreach цикъл.
# foreach ($file in $mp4FilesArray) {
#     Write-Host "Файл: $file"
# }
# # Показване на всички намерени mp4 файлове в директорията.
# $mp4FilesArray
# # Принтиране на първия mp4 файл от масива $mp4FilesArray.
# if ($mp4FilesArray.Count -gt 0) {
#     Write-Host "Първи файл: $($mp4FilesArray[0])"
# }
# else {
#     Write-Host "Няма намерени mp4 файлове."
# }

# ## Вземане на продължителността на видео файло.
# # Присвояване на пътя на първия mp4 файл от масива $mp4FilesArray на променливата $videoPath.
# $videoPath = $mp4FilesArray[0]
# # Вземане на продължителността на първия mp4 файл от масива $mp4FilesArray.
# $duration = Get-VideoDuration -videoPath $videoPath
# # Принтиране на продължителността на първия mp4 файл от масива $mp4FilesArray.
# Write-Host "Продължителността на видеото е: $duration секунди"

# ## Вземане на продължителността на аудио файла.
# $audioDuration = Get-AudioDuration -audioPath $audioPath
# # Принтиране на продължителността на аудио файла.
# Write-Host "Продължителността на аудиото е: $audioDuration секунди"

# ## Избиране на произволен елемент от масива mp4FilesArray и премахване на избрания елемент от масива (избор измежду произволен видео клип, който няма да се паде повторно). Това се случва докато масива не остане празен. 
# # Създаване на ArrayList с видео файловете от масива $mp4FilesArray (така ще можем да премахваме елементи от него).
# $mp4FilesArray = New-Object System.Collections.ArrayList
# # Добавяне на всички елементи от масива $mp4FilesArray в ArrayList.
# $mp4FilesArray.AddRange((Get-Mp4Files -directoryPath $directory))
# # Вземане на произволен видео файл от списъка с видео файлове
# $randomVideo = Get-RandomVideo -videos $mp4FilesArray
# # Принтиране на произволния видео файл
# Write-Host "Произволен видео файл: $randomVideo"
# # # Принтиране на останалите видео файлове в списъка
# # Write-Host "Останалите видео файлове са: $mp4FilesArray"
# # Вземане на произволен видео файл от списъка с видео файлове
# $randomVideo = Get-RandomVideo -videos $mp4FilesArray
# # Принтиране на произволния видео файл
# Write-Host "Произволен видео файл: $randomVideo"
# # Вземане на произволен видео файл от списъка с видео файлове
# $randomVideo = Get-RandomVideo -videos $mp4FilesArray
# # Принтиране на произволния видео файл
# Write-Host "Произволен видео файл: $randomVideo"
# # Създаване на ArrayList с видео файловете от масива $mp4FilesArray (така ще можем да премахваме елементи от него).
# $mp4FilesArray = New-Object System.Collections.ArrayList
# # Добавяне на всички елементи от масива $mp4FilesArray в ArrayList.
# $mp4FilesArray.AddRange((Get-Mp4Files -directoryPath $directory))
# # Вземане на произволен видео файл от списъка с видео файлове
# $selectedVideos, $totalSelectedDuration = Get-VideoSequenceForAudio -videos $mp4FilesArray -audioPath $audioPath
# # Принтиране на избраните видео файлове и тяхната продължителност (в секунди).
# foreach ($video in $selectedVideos) {
#     Write-Host "Избрано видео: $video"
#     $duration = Get-VideoDuration -videoPath $video
#     Write-Host "Продължителност на видеото: $duration секунди"
# }
# # Принтиране на общата продължителност на избраните видео клипове.
# Write-Host "Обща продължителност на избраните видео клипове: $totalSelectedDuration секунди"
# # Принтиране на продължителността на аудио файла.
# Write-Host "Продължителността на аудиото е: $audioDuration секунди"

# ## Изготвяне на видео файл съставен от произволните видео файлове.
# # Масив с пътища към видео файловете
# $videos = @(
#     $selectedVideos
# )
# # Извикване на функцията за съединяване
# try {
#     Merge-Videos $videos $outputVideoPath
#     Write-Host "Видеоклипът е създаден успешно."
# }
# catch {
#     Write-Host "Грешка: $_"
# }

# ## Съединяване на крайния видео файл с аудио файла.
# Add-AudioToVideo -videoPath $outputVideoPath -audioPath $audioPath -outputVideoPath $outputVideoWithAudioPath