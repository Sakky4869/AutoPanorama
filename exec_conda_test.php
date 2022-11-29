<?php

$out = null;

exec("/home/sakai/anaconda3/bin/python ./detect_objects_via_vision_api.py > result.txt", $out);

echo "<p> /home/sakai/anaconda3/bin/python ./detect_objects_via_vision_api.py > result.txt </p>";

// var_dump($out);

?>
