const request = require('request-promise');
const fs = require("fs");
const scramjet = require('scramjet');

fs.createReadStream("input.txt")
    .pipe(new scramjet.StringStream("utf-8"))
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .filter((line) => request.get('https://api.getridoffitlhywords.com/boolean', line))
    .stringify((line) => {
        const m = line.match(/\w+/g);
        return (m ? m.length : 0) + "\n";
    })
    .pipe(fs.createReadStream("output.txt"))
;




// end
