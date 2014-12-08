<?php
/**
 * Populate database with facts from Freebase API
 * Author: Andrei Neamtu
 */

header('Content-type: text/plain; charset=utf-8');

# function to check if text has non easily typable characters
function validateLatin($text) {
    if(preg_match("/[^a-zA-Z0-9\s\p{P}]/", $text))
        return false;
    return true;
}

# config
require_once '../config.database.php';
$freebase_api_key = '';

# make sure we don't run out of time or memory
set_time_limit(0);
ini_set('memory_limit', '256M');

# list of categories from which to extract topics
$categories = array(
    '/architecture/museum',
    '/architecture/architect',
    '/theater/theater',
    '/religion/founding_figure',
    '/religion/deity',
    '/interests/hobby',
    '/symbols/flag',
    '/aviation/aircraft_line',
    '/geography/mountain_range'
);

# parse categories and get topics
foreach ($categories as $category) {
    $query = array(array('id' => NULL, 'name' => NULL, 'type' => $category));
    $service_url = 'https://www.googleapis.com/freebase/v1/mqlread';
    $params = array(
        'query' => json_encode($query),
        'key' => $freebase_api_key,
        'type' => '/type/domain'
    );
    $url = $service_url . '?' . http_build_query($params);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_ENCODING ,"");
    $response = json_decode(curl_exec($ch), true);
    curl_close($ch);

    # parse each topic and get description
    foreach ($response['result'] as $topic) {
        # for debugging
        echo strtoupper($topic['name']).PHP_EOL.PHP_EOL;

        $service_url = 'https://www.googleapis.com/freebase/v1/topic';
        $params = array('key'=>$freebase_api_key,'filter'=>'/common/topic/description');
        $url = $service_url . $topic['id'] . '?' . http_build_query($params);
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_ENCODING ,"");
        $details = json_decode(curl_exec($ch), true);
        curl_close($ch);

        # split paragraphs by lines and insert as singel fact
        //$lines = explode("\n", $details['property']['/common/topic/description']['values'][0]['value']);
        //foreach ($lines as $line) {
        $line = str_replace(array("\r", "\n"), ' ', $details['property']['/common/topic/description']['values'][0]['value']);
        if (!empty($line) && validateLatin($line)) {
            $insert = $dbConnection->query('INSERT INTO `facts` (`fact`, `source`, `approved`, `wordcount`) VALUES(\''.$dbConnection->real_escape_string($line).'\', \''.$dbConnection->real_escape_string('Freebase: '.$category.' -> '.$topic['id']).'\', 1, \''.$dbConnection->real_escape_string(str_word_count($line)).'\')');
            if ($insert === false)
                throw new Exception('Error inserting');
        }
        //}

        # for debugging
        echo $details['property']['/common/topic/description']['values'][0]['value'].PHP_EOL.PHP_EOL;
        echo '---------'.PHP_EOL.PHP_EOL;
    }
}