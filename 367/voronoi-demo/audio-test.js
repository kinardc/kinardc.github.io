
const button = document.getElementById("button");
if (button) {
    // play audio on click
    button.addEventListener('click', function () {
        console.log('playing!');
        audio.play();
        audio.addEventListener('playing', function () {
            console.log('audio started!');
        })
    });
}

const audio = new Audio();
audio.src = 'ghost-feet.mp3';

