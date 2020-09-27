const Twit = require("twit");
const scramjet = require("scramjet");

const observe = (input, output, eventName, focus) => {
    if (focus && focus.indexOf(eventName) === -1)
        return input;

    if (focus.length > 1 && focus !== eventName)
        return input.on(
            eventName,
            (item) => output.write({item: item, type: eventName})
        );
    else
        return input.on(
            eventName,
            (item) => output.write(item)
        );
};

class TwitJet {

    constructor(options) {
        this.twit = new Twit(options);
    }

    statuses(filter, focus) {
        const ref = this.twit.stream("statuses/filter", filter);
        const ret = new scramjet.DataStream();

        observe(ref, ret, "tweet", focus);
        observe(ref, ret, "delete", focus);
        observe(ref, ret, "limit", focus);
        observe(ref, ret, "warning", focus);

        ref.on("end", () => ret.end());
        ref.on("error", (e) => ret.emit("error", e));
        return ret;
    }

    users() {
        throw new Error("Not yet implemented");
    }

}



module.exports = TwitJet;
