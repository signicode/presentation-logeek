#!/usr/bin/env node

/* eslint-disable node/shebang */

const TwitJet = require("./lib/twit-jet");
const push = require("./lib/push-io");
const mw = require("movwin");
const scramjet = require("scramjet");

const options = require("yargs").argv;

let port = 8081;
const cfg = {};

if (options._.length) cfg.track = options._;
if (options.loc) cfg.locations =  options.loc;
if (options.follow) cfg.follow =  options.follow;
if (options.lang) cfg.language =  options.lang;
if (options.port) port =  options.port;

console.log("Crunching tweets for... ", cfg);

const data = {};
let i = 0;

// eslint-disable-next-line node/no-unpublished-require
new TwitJet(require("./twitter-config.json"))
    .statuses(cfg, "tweet")
    .do(() => ++i%100 || console.log(`${i} twits processed`))
    .map((tweet) => Object.assign({
        text: options._.filter(
            (a) => tweet.text.toLowerCase().indexOf(a.toLowerCase()) >= 0
        )
    }, tweet.entities))
    .flatMap((a) => {
        const ret = a.hashtags
            .map(a => "#" + a.text)
            .filter(a => a)
            .map(a => a.toLowerCase());
        
        if (options.mentions) 
            return ret.concat(
                (a.user_mentions || [])
                    .map(a => "@" + a.screen_name.toLowerCase())
            );
        
        return ret;
    })
    .filter(a => !cfg.track || cfg.track.indexOf(a) === -1)
    .use((stream) => new scramjet.MultiStream([300, 900, 3600].map(
        (span) => {
            const str = stream
                .pipe(mw.functions.topn(mw.FixedTimeWindow, {span: span * 1e3, n: 15}))
                .tap();
            
            return str.pipe(new scramjet.DataStream())
                .map((topn) => ({span: span, list: topn}));
        }
    )))
    .mux()
    .each((el) => {
        data["v" + el.span] = el.list;
        push.update(data);
    })
    .on("error", (e) => console.error(e && e.stack))
;

push.start(port, 1e3);
