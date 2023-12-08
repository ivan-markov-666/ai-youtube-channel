# Включване на файла methods.ps1
. .\methods.ps1

# Дефиниране на пътя към файл за изход
$outputFile = ".\video-files-information\videosProperties.txt"
# Задайте пътя до директорията с видео файлове (mp4) за обработка.
$directory = ".\videos\converted\"

# Проверка дали файлът съществува
if (Test-Path $outputFile) {
    # Изтриване на файла, ако съществува
    Remove-Item $outputFile
}

# Вземаме всички mp4 файлове от директорията и записваме резултата в масив от стрингове (пътища към файловете) с име $mp4FilesArray.
$mp4FilesArray = Get-Mp4Files -directoryPath $directory 

# Анализиране на всички видео файлове в директорията и записване на резултатите в текстов файл.
foreach ($video in $mp4FilesArray) {
    # Извикване на функцията за анализиране на видео файл с ffprobe и записване на резултатите в текстов файл
    Get-VideoFileInformation -videoPath $video -outputFilePath $outputFile
}
