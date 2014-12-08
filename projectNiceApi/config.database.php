<?php

$dbServer = '';
$dbUsername = '';
$dbPassword = '';
$dbDatabase = '';

$dbConnection = new mysqli($dbServer, $dbUsername, $dbPassword, $dbDatabase);

if ($dbConnection->connect_error)
    throw new Exception('Error connecting to database: ' . $connection->connect_error);
