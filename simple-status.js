#!/usr/bin/env node

const TwitJet = require('./lib/twit-jet');
const push = require("./lib/push-io");
const mw = require("movwin");
const scramjet = require("scramjet");

const options = require("yargs").argv;

const cfg = {};
if (options._.length) cfg.track = options._;
if (options.loc) cfg.locations =  options.loc;
if (options.follow) cfg.follow =  options.follow;
if (options.lang) cfg.language =  options.lang;

console.log("Crunching tweets for... ", cfg);

const data = {};

new TwitJet(require('../twitter-config.json'))
    .statuses(cfg, 'tweet')
    .map(
        (tweet) => Object.assign({
            text: options._.filter(
                (a) => tweet.text.toLowerCase().indexOf(a.toLowerCase()) >= 0
            )
        }, tweet.entities)
    )
    .flatMap(
        (a) => {
            const ret = a.hashtags
                .map(a => '#' + a.text)
                .filter(a => a)
                .map(a => a.toLowerCase())
                .concat(
                    (a.user_mentions || [])
                        .map(a => '@' + a.screen_name.toLowerCase())
                );
            return ret;
        }
    )
    .filter(
        a => !cfg.track || cfg.track.indexOf(a) === -1
    )
    .use(
        (stream) => new scramjet.MultiStream([300, 900, 3600].map(
            (span) =>
                stream.pipe(
                    mw.functions.topn(mw.FixedTimeWindow, {
                        span: span * 1e3,
                        n: 15,
                    })
                )
                .pipe(new scramjet.DataStream())
                .map(
                    (topn) => ({
                        span: span,
                        list: topn
                    })
                )
        ))
    )
    .mux()
    .each(
        (el) => {
            data['v' + el.span] = el.list;
            push.update(data);
        }
    )
    .on(
        "error", (e) => console.error(e && e.stack)
    )
;

push.start(8081, 1e3);
