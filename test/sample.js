
const fs = require("fs");


const body = fs.readFileSync("input.txt")
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map((line) => {
        const m = line.match(/\w+/g);
        return m ? m.length : 0;
    })
    .reduce((acc, m) => {
        acc.push(m);
        acc.sum = (acc.sum || 0) + m;
        return acc;
    }, [])
;

fs.writeFileSync(body.join("\n") + "\n" +
    "--- avg: " + body.sum / body.length);
