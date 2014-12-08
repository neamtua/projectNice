<?php
/**
 * Basic API to return facts
 */

$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : 'error';
$allowedEndpoints = array('facts', 'random', 'fact');

if (in_array($endpoint, $allowedEndpoints))
    call_user_func($endpoint);
    // same thing as $endpoint() ?
else {
    http_response_code(400);
    die();
}


/**
 * Get facts from database with limit
 * @author Andrei Neamtu <neamtua@ameya.ro>
 * @date   2014-12-06
 */
function facts()
{
    // ahh pagination like
    header('Content-type: application/json; charset=utf-8');

    $start = isset($_GET['start']) ? (int)$_GET['start'] : 0;
    $limit = isset($_GET['no']) ? (int)$_GET['no'] : 0;

    if ($start < 0 || $limit < 0) {
        haltBadRequest();
    }

    require_once 'config.database.php';

    $result = $dbConnection->query(sprintf(
        'SELECT * FROM `facts` ORDER BY id ASC LIMIT %d, %d',
        $start,
        $limit
    ));
    $results = array();
    while ($row = $result->fetch_assoc()) {
        $results[] = $row;
    }
    $result->free();
    http_response_code(200);
    echo json_encode($results);

    $dbConnection->close();
}

/**
 * Get single random fact from database
 * @author Andrei Neamtu <neamtua@ameya.ro>
 * @date   2014-12-06
 */
function random()
{
    header('Content-type: application/json; charset=utf-8');

    // init
    $minWords = isset($_GET['minwords']) ? (int)$_GET['minwords'] : 0;
    $maxWords = isset($_GET['maxwords']) ? (int)$_GET['maxwords'] : 0;

    // validation
    if ($minWords > $maxWords) {
        // min > max
        haltBadRequest();
    } elseif ($minWords < 0 || $maxWords < 0) {
        // neither of them can be negative
        haltBadRequest();
    }
    
    // logic
    require_once 'config.database.php';
    http_response_code(200);

    $sqlFormat = 'SELECT * FROM `facts` WHERE `approved`=1 %s ORDER BY RAND() LIMIT 1;';
    if (!empty($minWords) && empty($maxWords)) {
        $extra = 'AND `wordcount` >= ' . $minWords;
    } elseif (!empty($maxWords) && empty($minWords)) {
        $extra = 'AND `wordcount` <= ' . $maxWords;
    } elseif (!empty($maxWords) && !empty($minWords)) {
        $extra = sprintf(
            ' AND `wordcount` BETWEEN %d AND %d',
            $minWords,
            $maxWords
        );
    } else {
        $extra = '';
    }

    $result = $dbConnection->query(sprintf(
        $sqlFormat,
        $extra
    ));
    $row = $result->fetch_assoc();
    $result->free();
    echo json_encode($row);

    $dbConnection->close();
}

/**
 * Get single fact from database based on id
 * @author Andrei Neamtu <neamtua@ameya.ro>
 * @date   2014-12-06
 */
function fact()
{
    header('Content-type: application/json; charset=utf-8');

    $id = isset($_GET['id']) ? (int)$_GET['id'] : null;

    if (null === $id) {
        haltBadRequest();
    } elseif ($id < 1) {
        haltBadRequest();
    }

    require_once 'config.database.php';

    $result = $dbConnection->query(sprintf(
        'SELECT * FROM `facts` WHERE `id`=%d LIMIT 0,1',
        $id
    ));
    $row = $result->fetch_assoc();
    $result->free();
    if (empty($row)) {
        haltBadRequest();
    }

    echo json_encode($row);
    http_response_code(200);
    $dbConnection->close();
}

function haltBadRequest()
{
    echo json_encode(array(
        'error' => array('description'=>'bad request')
    ));
    http_response_code(400);
    die();
}

// smallest API evah
