#!/usr/bin/env node

/* eslint-disable no-process-exit, node/shebang */

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
    .do(() => ++i%100 || console.log(`${i} tweets processed`))
    .map(({entities}) => entities)
    .map(entities => {
        const ret = entities.hashtags
            .map(a => "#" + a.text.toLowerCase());
        
        if (options.mentions) 
            return ret.concat(
                (entities.user_mentions || [])
                    .map(a => "@" + a.screen_name.toLowerCase())
            );
        
        return ret;
    })
    .flatten()
    .filter(a => !cfg.track || cfg.track.indexOf(a) === -1)
    .use((stream) => new scramjet.MultiStream([60, 300, 900].map(
        (timeSpan) => stream
            .pipe(mw.functions.topn(mw.FixedTimeWindow, {span: timeSpan * 1e3, n: 15}))
            .tap()
            .pipe(new scramjet.DataStream())
            .map((topn) => ({span: timeSpan, list: topn}))
    )))
    .mux()
    .each((el) => {
        data["v" + el.span] = el.list;
        push.update(data);
    })
    .catch((e) => {
        console.error(e && e.stack);
        process.exit(1);
    });

push.start(port, 1e3);
