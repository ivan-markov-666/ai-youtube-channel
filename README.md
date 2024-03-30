# ai-youtube-channel
This project allows you to create videos for your YouTube channel using AI.  
The project is a good example of end-to-end automation using different technologies like Playwright (for web automation), ffmpeg (for video editing), Node.js (for scripting), PowerShell (for scripting).
The project is split into different modules.  
- Automatically generate text content (that will be used for the video).
- Automatically make already generated text to speech and then create video.

## How it works?
Generate text contents using AI based on a topics that you have provide.  
Automatically generate TTS (text to speech) using the web version of the ttsconverter.io  
Add background music to the TTS audio.  
The videos are generated automatiocally by randomly selecting videos, that are merged together. The video duration is based on the audio duration.  
- You need to provide videos in specific specific format mp4. You can convert your videos using script form that project.
- You can check the video format using script from that project.
- You can cut used videos in specific seconds using script from that project. This is usefull if the video is too long and you want to use only a part of it.  
The result are videos that you can upload to your YouTube channel.  

## Prerequisites
Because the project is using different technologies, you need to install different tools.
- LLAMA2 API, ChatGPT API or similar large language model (I am using LM Studio, because it is the easiest way to use LLAMA2).
- Node.js
- Playwright
- PowerShell
- ffmpeg

## Set up
1. Clone the project.
2. Navigate to the project folder.
3. Run `npm install` to install all dependencies.
4. Install Playwright. You can do that by running `npx playwright install` in the project folder.
5. Register account in the https://ttsconverter.io. You will need to provide username and password in the .env file (see next point).
6. Create .env file in the root folder of the project. You can use .env.example file as a template. Provide all needed environment variables. Check .env.example file for more information.
7. Create topics.txt file in the `.\01.generateTextContent` folder. You can use topics-template-with-bullet-points.txt or topics-template-without-bullet-points.txt files as a template. Provide all needed data. Check the two templates for more information. You can add as many topics as you want. The script will generate content for all topics in the file.  
Here is an example of topics.txt file with Key Points section:
```
topic:
Theme: "Quantum Physics"
Quote: Particularly striking and remarkable about quantum mechanics is that Schrödinger, in his equation, was able to capture the essential mystery of quantum mechanics in a single mathematical equation. - Brian Greene
Key Points:
- The concept of quantum physics.
- Schrödinger equation.
- Quantum mechanics.

topic:
Theme: "The lion king animation from 1994"
Quote: Why Scar is mad at Mufasa?
Key Points:
- Relationship between Scar and Mufasa.
- Scar's jealousy.
- Scar's plan.
- Where is Simba in that 'picture'?
```
In the example above, the script will generate content for two topics. The first topic is about Quantum Physics and the second topic is about The lion king animation from 1994.  
You can add as many topics as you want. The script will generate content for all topics in the file.  

Similarly you can create topics.txt file without Key Points, just see the topics-template-without-bullet-points.txt file.  

## How to use the project
### Before start to using the project, lets understand what is the process of creating a video
1. Generate text content using AI.
2. Convert the text to speech using AI.
3. Add randomly selected background music.
4. Add randomly selected videos to the audio.
### Use the project
I. Automatically generate text content (that will be used for the video).  
0. Make sure that the AI API server is accessible (is running).  Make sure that .env file is configured correctly.
1. First we need to generate text content.
> npm run generate-text
2. Then we can generate videos including text to speech and background music.
> npm run generate-videos-with-audio
3. Used videos should be in the supported format. You can convert the videos with the following command:
> npm run convert-videos-correct-format
4. You can check the video format with the following command:
> npm run check-video-format
5. You can cut used videos in specific seconds using script from that project. This is usefull if the video is too long and you want to use only a part of it.
> npm run cut-videos