/*
Chase Kinard
- Create event handlers/listeners associated with
  the keyboard.
*/

export default class KeyEvent {
    #up = false;
    #down = false;
    press = undefined;
    release = undefined;

    constructor(value) {
        this.value = value;
        window.addEventListener("keydown", this.#downHandler, false);
        window.addEventListener("keyup", this.#upHandler, false);
    }

    removeListeners() {
        window.removeEventListener("keydown", this.#downHandler);
        window.removeEventListener("keyup", this.#upHandler);
    }

    #downHandler = (event) => {
        this.#handler(event, this.#onKeyDown);
    }
    #upHandler = (event) => {
        this.#handler(event, this.#onKeyUp);
    }
    
    #handler = (event, callback) => {
        if (event.key === this.value) { callback(); event.preventDefault(); }
    }
    #onKeyUp = () => {
        if (this.#down && this.release) { this.release(); }
        this.#down = false;
        this.#up = true;
    }
    #onKeyDown = () => {
        if (this.#up && this.press) { this.press(); }
        this.#down = true;
        this.#up = false;
    }
}