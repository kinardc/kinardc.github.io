### Chase Kinard
# CIS 367 Term Project: Audio Visualizer
For my CIS 367 term project, I decided to create an audio visualizer. I was inspired to create an audio visualizer after discovering Daniel Aagentah on Instagram (@daniel.aagentah), a programmer/producer/audio-visual artist from the UK. This project was a great exploratory experience in how audio can be represented in different ways and how various methods (such as noise) can be applied to the audio data to create interesting animations.

## Project Description
This audio visualizer utilizes three.js to connect with WebGL, update/render meshes, and analyze audio data. Each animation frame, frequency data is retreived from the audio and used to change the position of vertices in each mesh. Additionally, the visualizer uses simplex noise to create smooth, fluid-like movement as the meshes are animated. 

The visualizer provides a control panel with options to change amplitude, movement (due to noise), wave shape, and frequency analysis (none, max, average).

## Instructions
This project is hosted with Github Pages and available to try out [here](https://kinardc.github.io/367/visualizer-demo/visualizer.html). The link should only be opened in Firefox as there are currently CORS errors occurring when running the project on Chromium browsers.

Alternatively, the project can be tested locally with local server utilities such as the Python HTTP server or the VSCode [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension. Open the project directory in VSCode, start the server, then go to `localhost:<port>/visualizer.html`. Again, the link should only be opened in Firefox.

## Screenshots
![Average Frequency](screenshots/average-frequency.png)
![High Amplitude](screenshots/high-amplitude.png)
![High Movement](screenshots/high-movement.gif)
![Positive Amplitude](screenshots/positive-amplitude.png)