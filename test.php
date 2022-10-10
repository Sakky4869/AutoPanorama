<?php

$mask = umask();

umask(000);

mkdir('./test', 0777, true);

umask($mask);

?>
