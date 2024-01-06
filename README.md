# ai-youtube-channel
This project allows you to create videos for your YouTube channel using AI.  
The project is a good example of end-to-end automation using different technologies like Playwright (for web automation), ffmpeg (for video editing), Node.js (for scripting), PowerShell (for scripting).
The project is split into different modules.  
- Automatically generate text content (that will be used for the video).
- Automatically make already generated text to speech and then create video.

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

## How to use the project
I. Automatically generate text content (that will be used for the video).  
1. First we need to generate text content. To do that, we need to provide a topic for what content we want to generate. You can add your own topics in the `.\01.precondition\scenarious\topics.txt` file.  
The file need to follow the next format:  
- topic:  
- Theme:  
- Quote:  
- Key Points:  
If you don't provide a 'Key Points' section, the script will generate content based on your 'Theme' and 'Quote' sections.
2. Provide you API baseURL. You can do that by setting the `BASE_URL` environment variable in the .env file. If the file doesn't exist, create it in the root folder of the project. Add 'BASE_URL=your_api_base_url' in the file. You can use any solution for AI API. I am using LM Studio, because it is the easiest way to use LLAMA2.
3. Run `npm run generate-content` to generate content. The script will generate content for all topics in the `.\01.precondition\scenarious\topics.txt` file.
II. Automatically make already generated text to speech and then create video.


Dev Comments:
- Трябва да засегна това, че тази технология показва пример за автоматизация от край до край. Използвани са различни технологии.
- Трябва да обясня, че автоматизацията е проста и затова не използва някакви значими дизайн патерни и DSL (Domain Specific Language).
