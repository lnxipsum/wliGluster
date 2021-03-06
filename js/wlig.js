/*
 *   Copyright (C) 2013 J.A Nache
 *   This file is part of wliGluster.
 *
 *   wliGluster is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   wliGluster is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with wliGluster.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

Nstorage = new ntorage();
Nconfig = new nconfig();

Nconfig.set("config_theme", "default");
Nconfig.set("config_autoinit", true);
Nconfig.set("config_server", "");
// Sample:
// // var config_server = "http://somedomain.com/wliGluster/" //end with /
Nconfig.set("config_server_script", "glusterxml.php"); //configure the server side interface

$(document).ready(function() {
	printC("Web Line Interface for Gluster");

	//load theme files to free server load
	printC("Loading interface...");
	var themefiles = ["volume_info.html", "volume_list.html", "form_addbrick.html", "form_config_wligluster.html"];
	for(var i in themefiles){
		printC("Loading theme file "+themefiles[i]+"...");
		get_theme_file(themefiles[i]);
	}
	
	if(Nconfig.get("config_autoinit")){
		printC("Auto init enabled, sending first command.");
		send_command("volume list");
	}

	//making tabs events
	$(document).on('click', '.tabitem', function(){
		return show_tab($(this).attr('href').replace("#",""));
	});

	//making popup events
	$('#popup #popupcontrol .close').click(function(){
		$('#popup').hide();
	});

	//making menu events
	$(document).on('click', '.menufirstitem', function(){
		$(this).find('.menufirstgroup').toggle();
	});

	//events for config menu
	$(document).on('click', '#config a[href="#config_wligluster"]', function(){
		showform_config_wligluster();
	});
});

$('form#clicommand').submit(function() {
	var command = $("form#clicommand #inputtext").val();
	$("form#clicommand #inputtext").val("");
	printC(" ");
	printC("[$] "+command);
	if(command.length > 0){
		printC("Ok, wait...");
		console.log("sending: "+Nconfig.get("config_server_script")+"?command="+command.replace(/ /g,"+"));
		var jqxhr = $.get(Nconfig.get("config_server") + Nconfig.get("config_server_script"),{ command: command },  function() {
			//printC("Procesing response...");
			console.log("Recived data from server, procesing...")
		})
		.done(function(data) 
		{     
			console.log("Received data: " + data);
			//control error
			var errnum = $(data).find('wlireturn').text();
			if(errnum > 0){
				var rawout = $(data).find('raw').text();
				printC("Error num: "+errnum );
				printC("Error command output: "+rawout);
				alert_error(rawout);
				console.log("Error: "+rawout);
			}else{
				//here we process data
				$(data).find('cliOutput > volStatus').each(function(){
					volumen_status(data); });
				
				$(data).find('cliOutput > volInfo').each(function(){
					volumen_info(data); });

				$(data).find('cliOutput > volList').each(function(){
					volumen_list(data); });

				$(data).find('cliOutput > volStart').each(function(){
					volumen_start(data); });

				$(data).find('cliOutput > volStop').each(function(){
					volumen_stop(data); });

				$(data).find('cliOutput > cliOp').each(function(){
					show_climsg(data);	
				});
			}
		})
		.fail(function() {
			printC("[!] ERROR ON THE WLIGLUSTER SERVER SIDE!");
		 })
		.always(function() { printC("Done "+command);  });

	}
	return false;
});



//**********************************
// GUI Util functions
//**********************************
function alert_error(msg){
	alert("Error:\n\n"+msg);
}

function printC(msg){
	$('#console').append("<p>"+msg+"</p>");
	$('#console').animate({ scrollTop: $('#console').get(0).scrollHeight}, 100);
}

function send_command(command){
	$('input#inputtext').val(command);
	$("form#clicommand").submit();
}

function add_tab(id){//LOOK if we can improve this. themable?
	var tabid="tab"+id;
	if ($("#view > #"+tabid).length > 0){
		var tabobj = $("#view > #"+tabid);
		show_tab(tabid);
	}else{
		$("#view > #tabs").append("<li id=\"btab"+tabid+"\"><a href=\"#"+tabid+"\" class=\"tabitem\">"+tabid+"</a></li>");
		var tabobj = $("#view").append("<div id=\""+tabid+"\" class=\"viewtab\"></div>").find("#"+tabid);
		show_tab(tabid);
	}
	return tabobj;
}

function clear_tab(tabid){
	$('#view > #tab'+tabid).empty();
}

function selected_tab(tabid){
	$('#view > #tabs > li').removeClass("selectedtab");
	$('#view > #tabs > #btab'+tabid).addClass("selectedtab");
}

function show_tab(tabid){
	$('#view > .viewtab').hide();
	$('#view > #'+tabid).show();
	selected_tab(tabid);
	return false;
}

function show_climsg(gxml){
	//TODO: SEE opRet to determine if error or not
	if( $(gxml).find('cliOutput > opRet').text() < 0  ){
		var msgtype="[!!] Error ("
			+$(gxml).find('cliOutput > opRet').text()+" | "
			+$(gxml).find('cliOutput > opErrno').text()+"):\n\n\n";
			alert(msgtype+$(gxml).find('cliOutput > output').text());
	}else{
		printC("Info: "+$(gxml).find('cliOutput > output').text());
	}
}

function close_popup(){
	$('#popup').hide();
}

function open_popup(){
	$('#popup').show();
}

function put_file_on_popup(filename){
	$('#popup > #popupview').html(get_theme_file(filename));
	$('#popup').show();
}

function put_html_on_popup(thehtml){
	$('#popup > $popupview').html(thehtml);
	$('#popup').show();
}
//*** End of GUI Util functions

//**********************************
// Theme functions
//**********************************

function get_theme_file(filename){
	var htmltoret = Nstorage.getvar("themefile_" + filename);
	if(htmltoret === null){
		$.ajax({
			url: 'themes/'+Nconfig.get("config_theme")+'/'+filename,
			beforeSend: function ( xhr ) {
				xhr.overrideMimeType("text/plain; charset=x-user-defined"); //the only way I found to ignore html web engine parser
			},
			async: false
		}).done(function ( themehtml ) {
			htmltoret=themehtml;
		});
		Nstorage.setvar("themefile_" + filename, htmltoret);
	}
	return htmltoret;
}

function nreplace(rep,thehtml){
// I dont like loop, but...
	for(key in rep) {
		console.log("replacing "+key+" for "+rep[key])
		thehtml = thehtml.replace( new RegExp(key, "g"),rep[key]);	
	}
	return thehtml;
}
//*** End of Theme functions

//**********************************
// Popups and forms
//**********************************
function showform_config_wligluster(){
	put_file_on_popup('form_config_wligluster.html');

	$('form#config_wligluster input[name="config_server_address"]').val(Nconfig.get("config_server"));
	$('form#config_wligluster input[name="config_server_script"]').val(Nconfig.get("config_server_script"));

	$('form#config_wligluster').submit(function(){
		Nconfig.set("config_server", String($('form#config_wligluster input[name="config_server_address"]').val()));
		Nconfig.set("config_server_script", String($('form#config_wligluster input[name="config_server_script"]').val()));
		close_popup();
		return false;
	});
}

function showform_addbrick(volname){
	put_file_on_popup('form_addbrick.html');

	//events
	$("#addbrickform .bricksinputsbox input").focus(function(){
		$(this).addClass('inputbricksfocused');
	});
	$("#addbrickform .bricksinputsbox input").focusout(function(){
		 $(this).removeClass('inputbricksfocused');
	});

	$('form#addbrickform').submit(function(){

		var ftype=String($('form#addbrickform select[name="type"] option:selected').val());
		var fcount=String($('form#addbrickform input[name="count"]').val());
		var fbrickpath=String($('form#addbrickform input[name="brickpath"]').val());

		var options="";
		if(ftype.length > 0 || fcount.length > 0){
			if(fcount.length > 0 && ftype.length > 0){
				options = options +" "+ftype+" "+fcount;
			}else{
				alert("Specify \"Type\" and \"Count\" or leave two options empty");
				return false;
			}
		}

		if(fbrickpath.length <= 0){
			alert("Specify brick(s) path");
			return false;
		}
		options = options+" "+fbrickpath
		
		var command ="volume add-brick "+volname+" "+options;
		send_command(command);
		close_popup();

		//prevent page reload
		return false;
	});
}

//*** End fo Popups and forms

//**********************************
// Parse and show Responses
//**********************************
function volumen_start(gxml){
	$(gxml).find('cliOutput > volStart').each(function(){
		var volname = $(this).find('volname').text();
	});
	send_command("volume info");
}	

function volumen_stop(gxml){
	$(gxml).find('cliOutput > volStop').each(function(){
		var volname = $(this).find('volname').text();
	});
	send_command("volume info");
}

function volumen_list(gxml){
	themehtml = get_theme_file('volume_list.html');
	var volumelistshtml="";
	$(gxml).find('cliOutput > volList > volume').each(function(){
		//for each volume
		var rep = {
			"{NAME}": $(this).text(),
			"{VOLID}": $(this).text(),
			"{HREFNAME}": $(this).text(),
			"{VOLNAME}": $(this).text()
		};
		volumelistshtml = volumelistshtml + nreplace(rep,themehtml);
	});

	var rep = {
		"{NAME}": "ALL",
		"{VOLID}": "all",
		"{HREFNAME}": "all",
		"{VOLNAME}": "all"
	};
	volumelistshtml = volumelistshtml + nreplace(rep,themehtml);

	//add new info tab
	var tabobj = add_tab("volumelist");
	//add html to tab
	tabobj.html(themehtml);
	//add the list of volumes to id=volumelist
	$("#tabvolumelist #volumelist").html(volumelistshtml);

	//adding events
	$("#tabvolumelist #volumelist .volumelistelement .volumeonclick").click(function(){
		var volume = $(this).attr('href').replace("#", "");//WARNING, CAN VOLUMES HAVE # IN THEIR NAMES?
		send_command("volume info "+volume);
		return false;
	});
		
	//Maybe we need to make specific functions for each command to do not repeat things like confirmation on volume stop
	$('#tabvolumelist #volumelist .volumelistelement .volumelistmenu .opt_volumeinfo').click(function(){
		send_command("volume info "+$(this).attr('href').replace("#",""));
	});
	$('#tabvolumelist #volumelist .volumelistelement .volumelistmenu .opt_volumestatus').click(function(){
		send_command("volume status "+$(this).attr('href').replace("#",""));
	});
	$('#tabvolumelist #volumelist .volumelistelement .volumelistmenu .opt_volumestatusdetail').click(function(){
		send_command("volume status "+$(this).attr('href').replace("#","")+" detail");
	});
	$('#tabvolumelist #volumelist .volumelistelement .volumelistmenu .opt_volumestop').click(function(){
		send_command("volume stop "+$(this).attr('href').replace("#",""));
	});
	$('#tabvolumelist #volumelist .volumelistelement .volumelistmenu .opt_volumestart').click(function(){
		send_command("volume start "+$(this).attr('href').replace("#",""));
	});
	$('#tabvolumelist #volumelist .volumelistelement .volumelistmenu .opt_volumeaddbrick').click(function(){
		showform_addbrick($(this).attr('href').replace("#",""));
	});

}

function volumen_info(gxml){
	//get theme file
	themehtmlorig = get_theme_file('volume_info.html');
	//clear content of tab. On a future improve this.
	clear_tab("volumeinfo");
	//parse every volume section
	$(gxml).find('cliOutput > volInfo > volumes > volume').each(function(){
		
		var themehtml = themehtmlorig;
		var volname = $(this).find('name').text()
		var divguid = "volinfobox"+volname;

		// Translate numeric values for Type of gluster
		// 2 = Rplicate
		var volumetype = new Array();
		volumetype[2] = "Replicate";
		volumetype[0] = "Distribute"

		// Translate numeric status to human readable
		// 1 = Started
		// 0 = Stoped?
		var volumestatus = new Array();
		volumestatus[1] = "Started";
		volumestatus[2] = "Stopped";
		volumestatus[0] = "Created";

		//replace {VAR} with their value
		var rep = {
			"{UID}": divguid,
			"{NAME}": volname,
			"{ID}": $(this).find('id').text(),
			"{TYPE}": volumetype[$(this).find('type').text()],
			"{STATUS}": volumestatus[ $(this).find('status').text()],
			"{MENUVOLNAME}": volname
		};
		themehtml = nreplace(rep,themehtml);

		// Get html for one brick
		var themehtmlbrick = $(themehtml).find(".bricklist").html()

		// Loop to construct html for every brick
		var bricks = "";
		$(this).find('bricks > brick').each(function(){
			bricks = bricks + nreplace({"{BRICKNAME}":$(this).text()}, themehtmlbrick);
		});

		//add tab to view. id = tab+id_arg_passed
		var tabobj = add_tab("volumeinfo");
		//insert html for volume
		//$('#view').html(themehtml);
		tabobj.append(themehtml);
		//insert html brick info for this volume. I dont like this, look later.
		$("#tabvolumeinfo #"+divguid+" .bricklist").html(bricks);

		//add events
		$("#tabvolumeinfo #"+divguid+" .menu_volumen_stop").click(function(){
			if (confirm("Stopping volume will make its data inaccessible. Do you want to continue?")) {
				send_command("volume stop "+$(this).attr('href').replace("#","")); //WARNING. WILL THIS WORK WITH MULTIPLE VOLUMES??
			}
		});						

		$("#tabvolumeinfo #"+divguid+" .menu_volumen_start").click(function(){
			send_command("volume start "+volname); //WARNING. WILL THIS WORK WITH MULTIPLE VOLUMES??
		});

		$("#tabvolumeinfo #"+divguid+" .option_log_rotate").click(function(){
			send_command("volume log rotate  "+volname+" "+$(this).attr('href').replace("#",""));//WARNING, BRICK CAN HAVE # IN THEIR NAME?
		});
	});
}

function volumen_status(data){ 
	alert("vol status not implemented yet"); }
//*** End of show and parse Responses


//unused? remove?
function guid(){
	return ((new Date()).getTime()).toString() + (  Math.round( (1 + Math.random()) * 0x10000 )    ).toString();
}
