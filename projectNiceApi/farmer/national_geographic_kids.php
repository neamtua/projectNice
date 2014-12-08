<?php
/**
 * Populate database with facts from National Geographic Kids
 * Author: Andrei Neamtu
 */

require_once '../config.database.php';

for ($i=1;$i<=5;$i++) {
    $ch = curl_init('http://kids.nationalgeographic.com/bin/kids/query/content?page='.$i.'&template=%2Fapps%2Fkids%2Ftemplates%2Fpagetypes%2Ffun-fact-landing&contentTypes=kids%2Fcomponents%2Fpagetypes%2Ffun-fact&includedTags=&trendingSize=3&pageSize=12&isMobile=false&page_size=25');
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);

    if ($response) {
        $response = json_decode($response);
        foreach ($response as $fact) {
            $insert = $dbConnection->query('INSERT INTO `facts` (`fact`, `source`, `approved`, `wordcount`) VALUES(\''.$dbConnection->real_escape_string($fact->description).'\', \'National Geographic Kids http://kids.nationalgeographic.com/\', 1, '.str_word_count($fact->description).')');
            if ($insert === false)
                throw new Exception('Error inserting');
        }
    }
}
echo 'Done';
