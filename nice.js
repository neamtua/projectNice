var Score = (function() {
    'use strict';
    var totalWords = 0;
    var destroyedWords = 0;
    var totalKeysPressed = 0;
    var totalKeysMissed = 0;
    var totalKeysHit = 0;
    
    function reset() {
        totalWords = 0;
        destroyedWords = 0;
        totalKeysPressed = 0;
        totalKeysMissed = 0;
        totalKeysHit = 0;
    }
    
    function hitKey() {
        totalKeysHit++;
    }
    
    function missKey() {
        totalKeysMissed++;
    }
    
    function pressKey() {
        totalKeysPressed++;
    }
    
    function destroyWord() {
        destroyedWords++;
    }
    
    function setTotalWords(total) {
        totalWords = total;
    }

    function cheating() {
        totalWords = 73;
        destroyedWords = 42;
        totalKeysPressed = 9001;
        totalKeysMissed = 1337;
        totalKeysHit = 'cheater';
    }

    // for debugging
    function returnStatistics() {
        return {
            totalWords: totalWords,
            destroyedWords: destroyedWords,
            totalKeysPressed: totalKeysPressed,
            totalKeysMissed: totalKeysMissed,
            totalKeysHit: totalKeysHit
        };
    }
    
    function generateStatistics() {
        var accuracy = Math.round(totalKeysHit*100/totalKeysPressed);
        accuracy = accuracy?accuracy:0;
        var text = '';
        text += 'You\'ve destroyed ' + destroyedWords + ' / ' + totalWords + ' words\n\n';
        text += 'You\'ve pressed ' + totalKeysPressed + ' keys\nand you\'ve hit ' + totalKeysHit + ' of them\nwith an accuracy of ' + accuracy + '%\n\n';
        return text;
    }
    
    return {
        hitKey: hitKey,
        missKey: missKey,
        pressKey: pressKey,
        destroyWord: destroyWord,
        setTotalWords: setTotalWords,
        reset: reset,
        cheating: cheating,
        returnStatistics: returnStatistics,
        generateStatistics: generateStatistics
    };
})();

var Soundtrack = (function() {
    'use strict';
    var
        tracks = ["/tracks/74028935", "/tracks/88890943", "/tracks/74028932", "/tracks/88886960", "/tracks/88890946"],
        random = false,
        current = -1,
        dom = {},
        settings = {}
    ;

    function next() {
        SC.streamStopAll();
        soundManager.stopAll();
        stream(
            random ? randomTrack() : nextTrack()
        );
    }

    function nextTrack() {
        current++;
        if (current > tracks.length) {
            current = 0;
        }
        return tracks[current];
    }

    function randomTrack() {
        var trackId;

        // random with a twist
        for (var index=0; index < 10; index++) {
            trackId = Math.random() * tracks.length;
            if (current != trackId) {
                current = trackId;
                break;
            }
        }

        return tracks[~~trackId];
    }

    function addTracks(scTracks) {
        console.log(scTracks);
        var total = scTracks.length;
        for (var index=0; index < total; index++) {
            var track = scTracks[index];
            tracks.push('/tracks/' + track.id)
        }
    }

    function load() {
        loadByPlaylist();
        loadByFilter();
    }

    function loadByFilter() {
        if (Config.Soundtrack.filter) {
            SC.get('/tracks', Config.Soundtrack.filter, addTracks);
        }
    }

    function loadByPlaylist() {
        if (Config.Soundtrack.playlist) {
            SC.get('/playlists/' + Config.Soundtrack.playlist, function(playlist) {
                console.log('playlist');
                addTracks(playlist.tracks)
            });
        }
    }

    function initDom() {
        dom.soundtrackInfo = document.getElementById('soundtrackInfo');
        dom.soundtrackNext = document.getElementById('soundtrackNext');
    }

    function initialize(data) {
        settings = data;
        SC.initialize(data);
        load();
        // init
        initDom();
        dom.soundtrackNext.onclick = next;
    }

    function play(sound) {
        sound.setVolume(Config.Soundtrack.volume);
        sound.play({
            onfinish: function() {
                play(this);
            }
        });
    }

    function process(info) {
        var trackInfo =
            'Music playing: <a href="' + info.permalink_url + '" target="_blank">' + info.title + '</a> by '+
            '<a href="' + info.user.permalink_url + '" target="_blank">' + info.user.username + '</a>'
        ;
        
        dom.soundtrackInfo.innerHTML = trackInfo;
    }

    function info(track) {
        SC.get(track, function(trackInfo, error) {
            if (error) {
                trackInfo = {
                    permalink_url: '#',
                    title: 'Error',
                    user: {
                        username: 'API',
                        permalink_url: '#'
                    }
                };
            }
            Logger.log(trackInfo);
            process(trackInfo);
        });
    }

    function stream(track) {
        Logger.event('Soundtrack', 'stream', track);
        info(track);
        SC.stream(track, play);
    }

    return {
        init: initialize,
        play: stream,
        next: next
    };
})();

var Sharer = (function() {
    function fbShare() {
        var url = 'https://www.facebook.com/dialog/feed?';
        var query = [];
        query.push('app_id=' + Config.Sharer.FB.app_id);
        query.push('display=popup');
        query.push('link=' + window.location.href);
        query.push('redirect_uri=https://www.facebook.com');
        query.push('name=projectNice by Cardboard Coders');

        var fact = factoidGenerator.fact();
        if (fact) {
            query.push('caption=' + Score.generateStatistics().replace(/(\r\n|\n|\r)/gm," "));
            query.push('description=' + Score.generateStatistics().replace(/(\r\n|\n|\r)/gm," ") + ' Fact %23' + factoidGenerator.id() + ': ' + fact);
        } else {
            query.push('caption=Factoid Game');
            query.push('description=Come show us your typing skills.');
        }

        Logger.social('facebook', 'share', undefined, factoidGenerator.url());
        window.open(url + query.join('&'),'name','height=300, width=550');
    }

    function init(data) {
        if ('fb' in data) {
            document.getElementById(data.fb).onclick = fbShare;
        }
    }

    return {
        init: init,
        facebook: fbShare
    }
})();

var factoidGenerator = (function() {
    'use strict';
    var words, fact, id;

    function getWord() {
        return pluckWord();
    }

    function pluckWord() {
        var index = Math.floor(Math.random() * words.length);
        return words.splice(index, 1)[0];
    }

    function getFact() {
        return fact;
    }

    function getUrl() {
        return '/factoid/' + id + '/' + fact;
    }

    function process(data) {
        id = data.id;
        fact = data.fact;
        words = fact.split(' ').map(function(item) {
            return item.replace(/[^a-zA-Z]/gmi, '').trim();
        }).filter(Boolean);
        Logger.page(getUrl());
    }

    function init() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'projectNiceApi/api.php?endpoint=random&maxwords=40', false);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                var json;
                try {
                    json = xhr.status == 200
                        ? JSON.parse(xhr.responseText)
                        : null
                    ;
                } catch (e) {
                    json = null;
                }

                process(json === null ? Config.Factoid.default : json);
            }
        };
        xhr.send();
    }

    function getId() {
        return id;
    }

    function count() {
        return words.length;
    }

    return {
        init: init,
        count: count,
        url: getUrl,
        fact: getFact,
        word: getWord,
        id: getId
    };
})();

var Enemy = (function() {
    'use strict';

    function Enemy(word) {
        if (!(this instanceof Enemy)) {
            return new Enemy(word);
        }

        this.setWord(word);
    }

    Enemy.prototype.setSprite = function(sprite) {
        this.sprite = sprite;
        sprite.name = this.getWord();
    };

    Enemy.prototype.getSprite = function() {
        return this.sprite;
    };

    Enemy.prototype.getText = function() {
        return this.getSprite().getChildAt(0);
    };

    Enemy.prototype.setWord = function(word) {
        this.word = word.toLowerCase();
    };

    Enemy.prototype.getWord = function() {
        return this.word;
    };

    return Enemy;
}());

var EnemyList = (function() {
    'use strict';

    var instance, game, player, list;

    function addToWorld(enemy) {
        var saucer = game.add.sprite(game.world.randomX, 0, 'saucer');

        saucer.anchor.setTo(0.5, 0.5);
        
        var text = game.add.text(saucer.width, -1 * saucer.height / 2, enemy.getWord().toUpperCase());

        text.font = 'Roboto';
        text.fontSize = 20;

        //  x0, y0 - x1, y1
        var grd = text.context.createLinearGradient(0, 0, 0, text.canvas.height);
        grd.addColorStop(0, '#94836f');
        grd.addColorStop(1, '#94836f');
        text.fill = grd;

        text.align = 'center';
        //text.stroke = '#000000';
        //text.strokeThickness = 2;
        text.setShadow(2, 2, 'rgba(0,0,0,0.5)', 2);
        saucer.addChild(text);

        game.physics.enable(saucer, Phaser.Physics.ARCADE);
        game.physics.arcade.moveToObject(saucer, player, false, game.rnd.integerInRange(5, 15) * 1000);

        enemy.setSprite(saucer);
    }

    function EnemyList() {
        if (!(this instanceof EnemyList)) {
            return new EnemyList();
        }
        if (instance) {
            return instance;
        }
        instance = this;
        list = [];
    }

    EnemyList.prototype.setGame = function(phaserGame) {
        game = phaserGame;
    };

    EnemyList.prototype.getGame = function() {
        return game;
    };

    EnemyList.prototype.setPlayer = function(obj) {
        player = obj;
    };

    EnemyList.prototype.getPlayer = function() {
        return player;
    };

    EnemyList.prototype.add = function(enemy) {
        if (!(enemy instanceof Enemy)) {
            enemy = Enemy(enemy.toUpperCase());
        }

        list.push(enemy);
        addToWorld(enemy);
    };

    EnemyList.prototype.all = function() {
        return list;
    };

    EnemyList.prototype.count = function() {
        return list.length;
    };

    EnemyList.prototype.offset = function(index) {
        return list[index];
    };

    EnemyList.prototype.remove = function(index) {
        var enemy = list[index];
        enemy.getSprite().kill();
        enemy.getText().destroy();
        list.splice(index, 1);
        this.explode(enemy);
        typeIt.targetUnlock();
    };

    EnemyList.prototype.explode = function(enemy) {
        var sprite = enemy.getSprite();
        var explosion = game.add.sprite(
            sprite.x - 50,
            sprite.y - 50,
            'explosion'
        );
        explosion.animations.add('kaboom');
        explosion.animations.play('kaboom', 15, false, true);
        kaboomfx.play('partial');
    };

    return EnemyList;
}());

var typeIt = (function() {
    'use strict';

    var currentIndex = -1;
    var damage = 0;
    var hitPower = 1;

    function ememyToWord(enemy) {
        return enemy.getWord();
    }

    function addWord(word) {
        Logger.event('Stage', 'Creation', word);
        EnemyList().add(Enemy(word));
    }

    function debug(key) {
        if (!Config.Game.debug) {
            return false;
        }
        if (key != +key) {
            return false;
        }
        key = +key;
        switch (key) {
            case 1:
                Logger.log("Available enemies:", EnemyList().all());
                break;
            case 2:
                var word = factoidGenerator.word();
                Logger.log("Adding word: " + word);
                addWord(word);
                break;
            case 3:
                Logger.log("Available words:", EnemyList().all().map(ememyToWord));
                break;
            case 4:
                hitPower = 100;
                break;
            case 5:
                Score.cheating();
                EnemyList().getGame().state.start('Factoid');
                break;
            case 6:
            case 7:
            case 8:
            case 9:
            case 0:
        }
        return true;
    }

    function getTargetedWord() {
        return currentIndex === -1
            ? '_count: ' + EnemyList().count() + ' enemies alive'
            : getDamage(currentIndex) + '|' + EnemyList().offset(currentIndex).getWord()
        ;
    }

    function invalid(key) {
        Score.missKey();
        Logger.event('Stage', 'miss', getTargetedWord());
        console.warn('Invalid key.', key);
        return false;
    }

    function isLocked(index) {
        return index == currentIndex;
    }

    function targetUnlock() {
        currentIndex = -1;
        damage = 0;
    }

    function getRadian(sprite1, sprite2) {
        return EnemyList().getGame().math.angleBetweenPoints(
            sprite1.x,
            sprite1.y,
            sprite2.x,
            sprite2.y
        );
    }

    function lockOnTarget(enemy, index) {
        var doMove = false;
        if (doMove) {
            EnemyList().getPlayer().x = enemy.getSprite().x;
        } else {
            var player = EnemyList().getPlayer();
            // we have a random rotation issue
            player.rotation =
                EnemyList().getGame().math.angleBetweenPoints(player, enemy.getSprite()) -
                EnemyList().getGame().math.angleBetween(50,75,50,50)
            ;
        }

        // new target
        damage = 0;
        currentIndex = index;
        // lock
        enemy.getSprite().bringToTop();
        enemy.getSprite().loadTexture('saucer-targeted', 0);
        var text = enemy.getText();
        var grd = text.context.createLinearGradient(0, 0, 0, text.canvas.height);
        grd.addColorStop(0, '#9b5d44');
        grd.addColorStop(1, '#9b5d44');
        text.fill = grd;
    }

    function findWord(key) {
        var count = EnemyList().count();
        var closest = false;
        for (var index = 0; index < count; index++) {
            var enemy = EnemyList().offset(index);
            if (key !== enemy.getWord()[0]) {
                continue;
            }

            // check if closer
            if (closest) {
                var other = closest[0];
                if (other.getSprite().y > enemy.getSprite().y) {
                    continue;
                }
            }

            closest = [enemy, index];
        }

        if (closest) {
            lockOnTarget(closest[0], closest[1]);
            return closest[1];
        }

        return invalid(key);
    }

    function teslancoaie() {
        this.destroy();
    }

    function shoot(sprite) {
        fx.play('full');
        var player = EnemyList().getPlayer();
        var game = EnemyList().getGame();
        var tesla = game.add.graphics(player.x, player.y-20);
        var destination = {
            x: sprite.x - player.x,
            y: sprite.y + sprite.height/2 - player.y + 20
        };

        //tesla.blendMode = PIXI.blendModes.DIFFERENCE;
        tesla.lineStyle(2, 0x80CBC4, 0.7);
        tesla.quadraticCurveTo(
            game.rnd.integerInRange(-10, destination.x + 10),
            game.rnd.integerInRange(0, destination.y),
            destination.x,
            destination.y
        );
        game.time.events.add(Phaser.Timer.SECOND * 0.1, teslancoaie, tesla);
    }

    function hit(key, enemy) {
        Score.pressKey();
        var word = enemy.getWord();
        if (word[damage] != key) {
            return invalid(key);
        }

        shoot(enemy.getSprite());
        damage += hitPower;
        Score.hitKey();
        enemy.getText().setText(word.toUpperCase().substr(damage));
        if (damage >= word.length) {
            Score.destroyWord();
            EnemyList().remove(currentIndex);
            targetUnlock();
            Logger.event('Stage', 'destroyed', word);
        }
    }

    function press(key) {
        if (debug(key)) {
            Logger.event('Stage', 'debug', key);
            return;
        }

        // fix capslock issue
        key = key.toLowerCase();
        if (currentIndex === -1) {
            if (false === findWord(key)) {
                return;
            }
        }

        hit(key, EnemyList().offset(currentIndex));
    }

    function getDamage(index) {
        return isLocked(index)
            ? damage
            : 0
        ;
    }

    return {
        addWord: addWord,
        isLocked: isLocked,
        damaged: getDamage,
        targetUnlock: targetUnlock,
        press: press
    };
})();

var projectTut = (function() {
    var steps, game, tutText;

    function noop() {}
    function yesop() {return true}

    function reset() {
        steps = [];
    }

    function add(check, process) {
        steps.push([check || noop, process || noop]);
    }

    function init() {
        Logger.page('/tutorial');
        // reset
        reset();
        // easy shorthand
        game = EnemyList().getGame();
        // add enemy
        add(yesop, function() {
            Logger.event('Tutorial', 'first enemy', 'Enemy Appeared');
            game.input.keyboard.enabled = false;
            EnemyList().add('word');
        })
        // check that it fell a bit
        add(function() {
            var item = EnemyList().offset(0);
            if (item === undefined) {
                return true;
            }

            return item.getSprite().y > 100;
        }, function() {
            Logger.event('Tutorial', 'first enemy', 'Enemy Described');
            game.stopEnemies();
            tutText = game.add.text(0, 125, "You are not targeting any enemy.\nTarget an enemy by typing it's first letter.");
            tutText.font = 'Roboto';
            tutText.fontSize = 20;
            game.input.keyboard.enabled = true;
        });
        // check that it's been targeted
        add(function() {
            return game.input.keyboard.isDown(Phaser.Keyboard.W);
        }, function() {
            Logger.event('Tutorial', 'first enemy', 'Enemy Shot');
            // game logic back on track
            game.input.keyboard.enabled = false;
            game.startEnemies();
            // cleanup
            tutText.destroy();
            tutText = null;
        });
        // tell him how to destroy
        add(function() {
            var item = EnemyList().offset(0);
            if (item === undefined) {
                return true;
            }

            return item.getSprite().y > 150;
        }, function() {
            Logger.event('Tutorial', 'first enemy', 'Enemy Destroyed');
            game.stopEnemies();
            tutText = game.add.text(0, 125, [
                "When an enemy is left without any letters it is destroyed.",
                "Targeted enemies need to be destroyed before you can advance to a new enemy.",
                "Continue to shoot the remaining letters."
            ].join("\n"));
            tutText.font = 'Roboto';
            tutText.fontSize = 20;
            game.input.keyboard.enabled = true;
        });
        // wait for him to shoot it down
        add(function() {
            return EnemyList().count() === 0;
        }, function() {
            Logger.event('Tutorial', 'first enemy', 'Good Job');
            tutText.destroy();
            EnemyList().add('Good');
            EnemyList().add('Job');
        });
        // continue to start menu
        add(function() {
            return EnemyList().count() === 0;
        }, function() {
            Logger.event('Tutorial', 'first enemy', 'Finished');
            game.state.start('MainMenu');
        });
    }

    function check() {
        // nothing to check, possibly an error o.O
        if (steps.length === 0) {
            return false;
        }
        return steps[0][0]();
    }

    function advance() {
        var advance = steps[0][1];
        steps.shift();
        return advance();
    }

    return {
        init: init,
        check: check,
        advance: advance
    }
})();

window.onload = function() {
    var game, saucerCreateTime, projectNice;

    projectNice = {
        Boot: {
            // meh
            preload: function() {
                Sharer.init({
                    fb: 'shareFB'
                })
            },
            create: function() {
                Soundtrack.init(Config.Soundtrack);
                // set game arcade mode
                this.physics.startSystem(Phaser.Physics.ARCADE);
                // Block backspace
                this.input.keyboard.addKeyCapture(Phaser.Keyboard.BACKSPACE);
                // move to preloader
                this.state.start('Preloader');
            }
        },
        Preloader: {
            fontConfig: {
                google: {
                    families: ['Roboto']
                }
            },
            preload: function() {
                // we should really wait for the font to load
                // @see http://examples.phaser.io/_site/view_full.html?d=text&f=google+webfonts.js&t=google%20webfonts
                window.WebFontConfig = this.fontConfig;
                this.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');
                this.load.image('player', '/assets/images/player.png?cache');
                this.load.image('saucer', '/assets/images/enemy.png?cache');
                this.load.image('saucer-targeted', '/assets/images/enemyTargeted.png?cache');
                this.load.image('start-button', '/assets/images/start-button.png?cache');
                this.load.image('tutorial-button', '/assets/images/tutorial-button.png?cache');
                this.load.image('background', '/assets/images/game-background.png?cache');
                this.load.image('start-background', '/assets/images/start-background.png?cache');
                this.load.spritesheet('explosion', '/assets/images/explosion.png', 100, 100);
                this.load.audio('sfx', '/assets/audio/pewpew.ogg');
                this.load.audio('kaboomsfx', '/assets/audio/explosion.ogg');
            },
            create: function() {
                fx = game.add.audio('sfx');
                fx.addMarker('full', 1, 1.0, 0.05);
                kaboomfx = game.add.audio('kaboomsfx');
                kaboomfx.addMarker('partial', 1, 1.0, 1);
                this.game.add.sprite(0, 0, 'start-background');
                
                // set background
                //this.stage.setBackgroundColor('#2d3337');
                Soundtrack.play("/tracks/88890947");
                this.state.start('MainMenu');
            }
        },
        MainMenu: {
            start: function() {
                this.state.start('Game');
                Soundtrack.next();
            },
            tutorial: function() {
                this.state.start('Tutorial');
                Soundtrack.next();
            },
            create: function() {
                //Soundtrack.next();
                this.game.add.sprite(0, 0, 'start-background');
                this.add.button(this.world.centerX - 84 / 2, (this.world.height - 47) / 2, 'start-button', this.start, this);
                this.add.button(this.world.centerX - 84 / 2, (this.world.height - 47) / 2 + 50, 'tutorial-button', this.tutorial, this);
            }
        },
        Tutorial: {
            makePlayer: function() {
                this.game.add.sprite(0, 0, 'background');
                var player = this.add.sprite(this.world.centerX, this.world.height - 72 - 32, 'player');
                player.anchor.setTo(0.5, 0.5);
                this.physics.enable(player, Phaser.Physics.ARCADE);
                return player;
            },
            checkStep: function() {
                if (projectTut.check()) {
                    projectTut.advance();
                }
            },
            pauseEnemies: function(doPause) {
                var count = EnemyList().count();
                for (var index = 0; index < count; index++) {
                    EnemyList().offset(index).getSprite().body.enable = !doPause;
                }
            },
            stopEnemies: function() {
                this.pauseEnemies(true);
            },
            startEnemies: function() {
                this.pauseEnemies(false);
            },
            update: function() {
                this.checkStep();
            },
            create: function() {
                // set game on enemy list
                EnemyList().setGame(this);
                // set main player
                EnemyList().setPlayer(this.makePlayer());
                // Capture all key presses
                this.input.keyboard.addCallbacks(this, null, null, typeIt.press);
                // tutorify
                projectTut.init();
            }
        },
        Game: {
            makeSaucer: function(time) {
                if (!factoidGenerator.count()) {
                    if (!EnemyList().count()) {
                        this.state.start('Factoid');
                    }
                    return;
                }
                if (time < saucerCreateTime) {
                    return;
                }

                EnemyList().add(factoidGenerator.word());
                saucerCreateTime = time + this.rnd.integerInRange(0.3, 2) * 1000;
            },
            makePlayer: function() {
                this.game.add.sprite(0, 0, 'background');
                var player = this.add.sprite(this.world.centerX, this.world.height - 72 - 32, 'player');
                player.anchor.setTo(0.5, 0.5);
                this.physics.enable(player, Phaser.Physics.ARCADE);
                return player;
            },
            create: function() {
                // init current phrase in preparation for stages
                factoidGenerator.init();
                // Capture all key presses
                this.input.keyboard.addCallbacks(this, null, null, typeIt.press);
                // reset score
                Score.reset();
                // set instant create
                saucerCreateTime = this.time.now;
                Score.setTotalWords(factoidGenerator.count());
                // set game on enemy list
                EnemyList().setGame(this);
                // set main player
                EnemyList().setPlayer(this.makePlayer());
                
                // build cityscape
                //makeCity();
            },
            worldSmash: function() {
                var enemies = EnemyList().all();
                for (var index = enemies.length; index;) {
                    var enemy = enemies[--index];
                    var sprite = enemy.getSprite();

                    if (sprite.y > 584) {
                        EnemyList().remove(index);
                        Logger.event('Stage', 'collision', typeIt.damaged(index) + '|' + enemy.getWord());
                    }
                }
            },
            update: function() {
                this.worldSmash();
                this.makeSaucer(this.time.now);
            }
        },
        Factoid: {
            keys: [],
            preload: function() {
            },
            next: function() {
                this.state.start('Game');
                Soundtrack.next();
            },
            safeFact: function() {
                 var words = factoidGenerator.fact().split(' ');
                 words.unshift('Fact #' + factoidGenerator.id() + ': ');
                 var count = words.length;
                 var fact = [];
                 var line = 0;
                 
                 for (var index=0;index<count;index++) {
                    var word = words[index];
                    line += word.length;
                    if (line > 25) {
                        // add word to next line
                        line = word.length;
                        word = '\n' + word;
                    }
                    fact.push(word);
                 }
                 fact.push('\n\nClick or space to continue ...');
                 return fact.join(' ');
            },
            create: function() {
                this.game.add.sprite(0, 0, 'start-background');
                
                var statistics = game.add.text(game.world.centerX, 125, Score.generateStatistics());
                statistics.anchor.setTo(0.5);
                statistics.font = 'Roboto';
                statistics.fontSize = 20;
                var grdStats = statistics.context.createLinearGradient(0, 0, 0, statistics.canvas.height);
                grdStats.addColorStop(0, '#25789f');
                grdStats.addColorStop(1, '#25789f');
                statistics.fill = grdStats;
                statistics.align = 'center';
                
                var fact = game.add.text(game.world.centerX, game.world.centerY, this.safeFact());
                fact.anchor.setTo(0.5);

                fact.font = 'Roboto';
                fact.fontSize = 20;

                //  x0, y0 - x1, y1
                var grdFact = fact.context.createLinearGradient(0, 0, 0, fact.canvas.height);
                grdFact.addColorStop(0, '#C85858');
                grdFact.addColorStop(1, '#C85858');
                fact.fill = grdFact;

                fact.align = 'center';
                //text.stroke = '#000000';
                //text.strokeThickness = 2;
                //text.setShadow(5, 5, 'rgba(0,0,0,0.5)', 5);

                this.keys = [Phaser.Keyboard.SPACEBAR, Phaser.Keyboard.ENTER];
                game.input.onDown.add(this.next, this);
            },
            update: function() {
                var len = this.keys.length;
                for (var index=0; index < len; index++) {
                    if (this.input.keyboard.isDown(this.keys[index])) {
                        this.next();
                    }
                }
            }
        }
    };

    game = new Phaser.Game(360, 640, Phaser.CANVAS, 'projectNice');

    // Add and start the 'main' state to start the game
    game.state.add('Boot', projectNice.Boot);
    game.state.add('Preloader', projectNice.Preloader);
    game.state.add('MainMenu', projectNice.MainMenu);
    game.state.add('Tutorial', projectNice.Tutorial);
    game.state.add('Game', projectNice.Game);
    game.state.add('Factoid', projectNice.Factoid);
    game.state.start('Boot');
};