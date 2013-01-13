if(typeof GfireWebdetection == "undefined") {
	var GfireWebdetection = {
		init: function() {
			// Preference manager
			this._prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		
			// Requesting
			this._xmlRequest = new XMLHttpRequest();
			this._requestSuccess = false;
			this._requestTimeout = 0;

			// Status
			this._is_gfire = false;
			this._game_id = 0;
			this._username = "";
			this._nickname = "";
			this._shortgamename = "";
			this._longgamename = "";

			// Icon handling
			this._blink_timeout = 0;
			this._blink_state = false;
			this._last_state = 2;
			
			// Initialize everything
			this.resetStatus();

			let that = this;
			this._xmlRequest.onreadystatechange = function(){that.requestStateChange();};

			// Start the refresh loop
			if(this._prefManager.getBoolPref("extensions.gfirewebdetection.enabled"))
				this._requestTimeout = window.setTimeout(function(){that.sendData();}, 4000);
		},
		
		swapStateIcon: function() {
			if(this._blink_state)
				document.getElementById("gfweb-statusimage").src = "chrome://gfirewebdetection/skin/images/gfire_inactive.png";
			else
				document.getElementById("gfweb-statusimage").src = "chrome://gfirewebdetection/skin/images/gfire_active.png";

			this._blink_state = !this._blink_state;
		},
		
		setStateIcon: function(active, enabled) {
			if(!enabled) {
				this._last_state = 2;
				window.clearInterval(this._blink_timeout);
				document.getElementById("gfweb-statusimage").src = "chrome://gfirewebdetection/skin/images/gfire_inactive.png";
				return;	
			}

			if(active && this._last_state == 0 && document.getElementById("gfweb-statusimage").src != "chrome://gfirewebdetection/skin/images/gfire_active.png" && this._game_id == 0) {
				document.getElementById("gfweb-statusimage").src = "chrome://gfirewebdetection/skin/images/gfire_active.png";
			} else if(active && this._last_state != 0) {
				this._last_state = 0;
				window.clearInterval(this._blink_timeout);
				document.getElementById("gfweb-statusimage").src = "chrome://gfirewebdetection/skin/images/gfire_active.png";
			} else if(!active && this._last_state != 1) {
				this._last_state = 1;
				this._blink_state = false;
				document.getElementById("gfweb-statusimage").src = "chrome://gfirewebdetection/skin/images/gfire_inactive.png";
				let that = this;
				this._blink_timeout = window.setInterval(function(){that.swapStateIcon();}, 1000);
			}
		},
		
		getStr: function(id) {
			return document.getElementById("locale-strings").getString(id);
		},
		
		openProfileWebsite: function() {
			document.commandDispatcher.focusedWindow.open("http://www.xfire.com/profile/" + this._username + "/");
		},

		openXfireWebsite: function() {
			document.commandDispatcher.focusedWindow.open("http://www.xfire.com/");
		},

		openGfireWebsite: function() {
			document.commandDispatcher.focusedWindow.open("http://gfireproject.org/");
		},

		openAboutGfireWebsite: function() {
			document.commandDispatcher.focusedWindow.open("http://gfireproject.org/overview/");
		},
		
		toggleDetection: function() {
			this._prefManager.setBoolPref("extensions.gfirewebdetection.enabled", !this._prefManager.getBoolPref("extensions.gfirewebdetection.enabled"));

			if(!this._prefManager.getBoolPref("extensions.gfirewebdetection.enabled"))
			{
				this._xmlRequest.abort();
				window.clearTimeout(this._requestTimeout);
				this.resetStatus();
			}
			else
			{
				this.updateStatus();
				this.sendData();
			}
		},
		
		updateStatus: function() {
			// Disabled?
			if(!this._prefManager.getBoolPref("extensions.gfirewebdetection.enabled"))
			{
				document.getElementById("gfweb-statusmenu-detect").removeAttribute("checked");
				this.setStateIcon(false, false);
				document.getElementById("gfweb-statustooltip-app").value = this.getStr("PluginDisabled.app");
				document.getElementById("gfweb-statustooltip-accountline").hidden = true;
				document.getElementById("gfweb-statustooltip-gameline").hidden = true;

				return;
			}
			else
				document.getElementById("gfweb-statusmenu-detect").setAttribute("checked", "true");
	
			// No apps running, set the inactive icon
			if(!this._requestSuccess)
			{
				this.setStateIcon(false, true);
				document.getElementById("gfweb-statustooltip-app").value = this.getStr("None.app");
				document.getElementById("gfweb-statustooltip-accountline").hidden = true;
				document.getElementById("gfweb-statustooltip-gameline").hidden = true;

				return;
			}

			// One app is running, set the active icon
			this.setStateIcon(true, true);
			document.getElementById("gfweb-statustooltip-accountline").hidden = false;
			document.getElementById("gfweb-statustooltip-gameline").hidden = false;

			// Our app is Gfire
			if(this._is_gfire)
				document.getElementById("gfweb-statustooltip-app").value = "Gfire";
			else
				document.getElementById("gfweb-statustooltip-app").value = "Xfire";

			if(this._username && this._username.length > 0)
			{
				document.getElementById("gfweb-statusmenu-profile").disabled = false;
				if(this._nickname && this._nickname.length > 0)
					document.getElementById("gfweb-statustooltip-account").value = this._nickname + " (" + this._username + ")";
				else
					document.getElementById("gfweb-statustooltip-account").value = this._username;
			}
			else
			{
				document.getElementById("gfweb-statusmenu-profile").disabled = true;
				document.getElementById("gfweb-statustooltip-account").value = this.getStr("NotLoggedIn.account");
			}

			if(this._game_id > 0)
			{
				if(this._shortgamename && this._shortgamename.length > 0)
					document.getElementById("gfweb-statusimage").src = "http://media.xfire.com/xfire/xf/images/icons/" + this._shortgamename + ".gif";

				document.getElementById("gfweb-statustooltip-game").value = this._longgamename;
			}
			else
				document.getElementById("gfweb-statustooltip-game").value = this.getStr("NotPlaying.game");
		},
		
		resetStatus: function() {
			this._requestSuccess = false;
			this._is_gfire = false;
			this._game_id = 0;
			this._username = "";
			this._nickname = "";
			this._shortgamename = "";
			this._longgamename = "";

			this.updateStatus();
		},
		
		requestTimedOut: function() {
			this.resetStatus();
		},
		
		requestStateChange: function() {
			if(this._xmlRequest.readyState == 4 && this._xmlRequest.status == 200)
			{
				this._requestSuccess = true;
				this._is_gfire = false;
				
				var lines = this._xmlRequest.responseText.split(';');
				var pattern = /result\["(.*)"\]\s*=\s*(?:"(.*)"|true|false|(\d+))/i;
				for(i in lines) {
					var matches = lines[i].match(pattern);
					if(matches == null)
						continue;
					if(matches[1] == "gameid")
						this._game_id = matches[2];
					else if(matches[1] == "gameshortname")
						this._shortgamename = matches[2];
					else if(matches[1] == "gamelongname")
						this._longgamename = matches[2];
					else if(matches[1] == "gamename")
						this._longgamename = matches[2];
					else if(matches[1] == "nickname")
						this._nickname = matches[2];
					else if(matches[1] == "username")
						this._username = matches[2];
					else if(matches[1] == "is_gfire")
						this._is_gfire = true;
				}

				this.updateStatus();
			}
		},
		
		sendData: function() {
			// Check whether the last request timed out
			if(!this._requestSuccess)
				this.requestTimedOut();
			else
				this._requestSuccess = false;

			// We misuse the XMLHttpRequest object here to load the the script whenever we want
			if(this._xmlRequest.status == 2 || this._xmlRequest.status == 3)
				this._xmlRequest.abort();
			try {
				this._xmlRequest.open("GET", "http://localhost:39123/url/?url=" + encodeURIComponent(window._content.document.URL), true);
				this._xmlRequest.send();
			} catch(e) {
			} finally {
				let that = this;
				this._requestTimeout = window.setTimeout(function() {that.sendData();}, 4000);
			}
		}
	};
	
	window.addEventListener("load", function(e) { GfireWebdetection.init(); }, false);
};
