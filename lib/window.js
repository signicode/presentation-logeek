const scramjet = require("scramjet");

class TimeFrameMovingWindow {
    constructor(options) {
        this.items = [];
        this.ts = [];

        if (options.change)
            this._change = options.change;

        if (options.push)
            this._push = options.push;
        if (options.shift)
            this._shift = options.shift;

        this._window = options.time;

        this._pushed = false;
    }

    push(chunk, ts) {
        this._pushed = true;
        if (this._push) {
            this._push(chunk, ts);
        }
        this.items.push(chunk);
        this.ts.push(ts);
    }

    run(refTs) {

        refTs = refTs || Date.now();

        const pos = this.items.find((item) => item[1] < refTs - this._window);

        let removed = null;
        if (pos > -1) {
            removed = this.items.splice(0, pos + 1);
            if (this._shift)
                this._shift(removed);
        }

        if (this._pushed || removed) {
            this._pushed = false;
            this._value = this._change(this.items.map(a => a[0])); // optimize!
        }

        return this;
    }

    get value() {
        return this._value;
    }
}

class StaticCountMovingWindow {

    constructor(options) {
        this.items = [];

        if (options.change)
            this._change = options.change;

        if (options.push)
            this._push = options.push;

        if (options.shift)
            this._shift = options.shift;

        this.window = options.count;

        this._pushed = false;
    }

    push(chunk) {
        this.pushed = true;
        if (this._push) {
            this._push(chunk);
        } else {
            this.items.push(chunk);
        }
    }

    run(refTs) {

        refTs = refTs || Date.now();

        const pos = this.items.find((item) => item[1] < refTs - this._window);

        let removed = null;
        if (pos > -1) {
            removed = this.items.splice(0, pos + 1);
            if (this._shift)
                this._shift(removed);
        }

        if (this._pushed || removed) {
            this._value = this._change(this.items);
        }

        return this;
    }

    get value() {
        return this._value;
    }
}

module.exports = class MovingWindowStream extends scramjet.DataStream {

    static get StaticCountMovingWindow() {
        return StaticCountMovingWindow;
    }

    static get TimeFrameMovingWindow() {
        return TimeFrameMovingWindow;
    }

    constructor(options) {
        options = Object.assign({
            count: 0,
            time: 0,
            window: null,
            updateInterval: 200,
            push: null,
            shift: null,
            change: null
        }, options);

        options.parallelTransform = (chunk) => {
            const ts = Date.now();
            this.window.push(chunk, ts);
            if (this.nextUpdate < ts) {
                this.nextUpdate = ts + options.updateInterval;
                return this.window.run(ts).value;
            } else {
                return scramjet.DataStream.filter;
            }
        };

        super(options);

        this.nextUpdate = 0;

        if (options.WindowClass) {
            this.window = new options.WindowClass(options);
        } else if (options.time) {
            this.window = new TimeFrameMovingWindow(options);
        } else if (options.count) {
            this.window = new StaticCountMovingWindow(options);
        } else {
            throw new Error("Only time and window options are available or a window object must be passed.");
        }

    }

};
