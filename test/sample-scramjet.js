
const fs = require("fs");
const scramjet = require('scramjet');

let out = fs.createReadStream("output.txt");
fs.createReadStream("input.txt")
    .pipe(new scramjet.StringStream("utf-8"))
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map((line) => {
        const m = line.match(/\w+/g);
        return (m ? m.length : 0) + "\n";
    })
    .tee((stream) => stream.pipe(out, {end: false}))
    .reduce((acc, m) => {
        acc.sum += (+m);
        acc.length++;
        return acc;
    }, {sum: 0, length: 0})
    .then((body) => out.end(
        "--- avg: " + body.sum / body.length
    ))
;




// end
