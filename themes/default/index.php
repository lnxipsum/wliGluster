<?php 
	$config_theme ="default";
?>
<html><head><title>Web Line Interface for GlusterFS (WLI Gluster)</title>
<link rel="stylesheet" href="<?php echo "themes/".$config_theme."/";?>style/main.css" />
</head>
<body>
<div id="wrapp">
   <div id="view"></div>
   <div id="console"></div>
   <div id="cliinput">
      <form id="clicommand" action="" method="post">
         <input id="inputtext" type="text" name="command" />
         <input type="submit" value="Send" />
      </form>
   </div>
</div>
<script type="text/javascript" src="js/jquery.js"></script>
<script type="text/javascript" src="<?php echo "themes/".$config_theme."/";?>js/style.js"></script>
<script type="text/javascript" src="js/wlig.js"></script>
</body>
</html>