var Config = (function() {
    function getSoundtrackConfig() {
        return {
            volume: 20,
            client_id: '{{ SOUNCLOUD_CLIENT_ID }}',
            playlist: '63234681',
            filter: {
                genres: 'chiptunes',
                license: 'cc-by-sa',
                track_type: 'loop'
            }
        }
    }

    function getSharerConfig() {
        return {
            FB: {
                app_id: '{{ FACEBOOK_APP_ID }}'
            }
        }
    }


    function getFactoidConfig() {
        return {
            default: {
                id: 0,
                fact:
                    'A projectNice service announcement: ' + "\n"
                    + 'When database is unreachable, factoids are gone. ' + "\n"
                    + 'Thank you for understanding, ' + "\n" + 'Cardboard Coders'
            }
        }
    }

    function getGameConfig() {
        return {
            debug: true
        }
    }

    function getLoggerConfig() {
        return {
            enabled: true,
            appName: 'projectNice',
            appVersion: 'koding@hackathon',
            gaAccount: '{{ GA-ACCOUNT }}'
        }
    }

    return {
        Soundtrack: getSoundtrackConfig(),
        Sharer: getSharerConfig(),
        Factoid: getFactoidConfig(),
        Logger: getLoggerConfig(),
        Game: getGameConfig()
    }
})();