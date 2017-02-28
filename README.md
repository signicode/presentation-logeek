Simple tweet battle
---------------------

We like tweet battles, do we now? This is what I was about to show on the Feb 2016 Meet.js in Warsaw but sadly some
gimmicks helped me otherwise.

Before you do anything, get your twitter secrets in a JSON file much like this one:

    {
      "consumer_key": "scramjetscramjetscramjet",
      "consumer_secret": "BiGDAtaBigDataBUGDIDADUDADUPAJakNieTerazToKiedy",
      "access_token": "124901245-LOREmIP5uMD01oRS1TAmeT",
      "access_token_secret": "UGo021bOUGBJUOQWGF2"
    }

and put it in the directory above this one as `twitter-config.json`.

To run the sample do:

    node ./simple-status.js [--location=<geo_bbox>] [--lang=<iso-631-2-letter>] tag [tag...]

If you're "feeling lucky, punk" then go straight to:

    node ./simple-status.js '@potus'

Then point your browser to: [localhost:8080](http://localhost:8080)

Anything you like to look for it'll go to Twitter and crunch the similar hashtags.

Oh, and please do fork!

License
--------

See LICENSE (GNU AFFERO GENERAL PUBLIC LICENSE).
