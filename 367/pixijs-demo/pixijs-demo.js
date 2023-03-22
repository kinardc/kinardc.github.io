/*
Chase Kinard
- Main PixiJS script demonstrating event-based controls 
  and window boundaries.
*/
import KeyEvent from "./KeyEvent.js";

/* Initialize app and set up character sprite. */
let app = new PIXI.Application({ resizeTo: window, backgroundColor: 0x222222 }),
    sprite = PIXI.Sprite.from('knight.png');
sprite.height = sprite.width = 100;
sprite.x = 0, sprite.y = 0;
sprite.vx = 0, sprite.vy = 0;
document.body.appendChild(app.view);
app.stage.addChild(sprite);

/* Set up arrow key controls. */
let up = new KeyEvent("ArrowUp"),
    down = new KeyEvent("ArrowDown"),
    left = new KeyEvent("ArrowLeft"),
    right = new KeyEvent("ArrowRight");            
up.press = () => sprite.vy = -7;
down.press = () => sprite.vy = 7;
up.release = () => sprite.vy = 0;
down.release = () => sprite.vy = 0;
left.press = () => sprite.vx = -7;
right.press = () => sprite.vx = 7;
left.release = () => sprite.vx = 0;
right.release = () => sprite.vx = 0;

/* Update character position. */
const canvas = document.getElementsByTagName("canvas")[0],
    rightBound = canvas.offsetWidth - sprite.width,
    bottomBound = canvas.offsetHeight - sprite.height;
app.ticker.add((delta) => {
    const moveX = sprite.x + sprite.vx,
        moveY = sprite.y + sprite.vy;
    sprite.x = (moveX > 0 && moveX < rightBound) ? moveX : sprite.x;
    sprite.y = (moveY > 0 && moveY < bottomBound) ? moveY : sprite.y;
});