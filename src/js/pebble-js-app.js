var mConfig = {};
var locationOptions = { "timeout": 15000, "maximumAge": 60000 }; 
var WorldWeatherkey = "b317f0a674d01abfaa41673acc028";


/* Convenient function to automatically retry messages. */
Pebble.sendAppMessageWithRetry = function(message, retryCount, successCb, failedCb) {
  var retry = 0;
  var success = function(e) {
    if (typeof successCb == "function") {
      successCb(e);
    }
  };
  var failed = function(e) {
    /* console.log("Failed sending message: " + JSON.stringify(message) +
      " - Error: " + JSON.stringify(e) + " - Retrying..."); */
    retry++;
    if (retry < retryCount) {
      Pebble.sendAppMessage(message, success, failed);
    }
    else {
      if (typeof failedCb == "function") {
        failedCb(e);
      }
    }
  };
  Pebble.sendAppMessage(message, success, failed);
};


function fetchWeather(latitude, longitude) {
  
  var bNight = false;
  var WWIconMap =[]; 
  
  WWIconMap[395] = 46; //Moderate or heavy snow in area with thunder
  WWIconMap[392] = 14; //Patchy light snow in area with thunder
  WWIconMap[389] = 45; //Moderate or heavy rain in area with thunder
  WWIconMap[386] = 45; //Patchy light rain in area with thunder
  WWIconMap[377] = 17; //Moderate or heavy showers of ice pellets
  WWIconMap[374] = 17; //Light showers of ice pellets
  WWIconMap[371] = 46; //Moderate or heavy snow showers
  WWIconMap[368] = 14; //Light snow showers
  WWIconMap[365] = 18; //Moderate or heavy sleet showers
  WWIconMap[362] = 18; //Light sleet showers
  WWIconMap[359] = 11; //Torrential rain shower
  WWIconMap[356] = 11; //Moderate or heavy rain shower
  WWIconMap[353] = 11; //Light rain shower
  WWIconMap[350] = 17; //Ice pellets
  WWIconMap[338] = 41; //Heavy snow
  WWIconMap[335] = 41; //Patchy heavy snow
  WWIconMap[332] = 46; //Moderate snow
  WWIconMap[329] = 46; //Patchy moderate snow
  WWIconMap[326] = 14; //Light snow
  WWIconMap[323] = 14; //Patchy light snow
  WWIconMap[320] = 18; //Moderate or heavy sleet
  WWIconMap[317] = 18; //Light sleet
  WWIconMap[314] = 17; //Moderate or Heavy freezing rain
  WWIconMap[311] = 17; //Light freezing rain
  WWIconMap[308] = 11; //Heavy rain
  WWIconMap[305] = 11; //Heavy rain at times
  WWIconMap[302] = 11; //Moderate rain
  WWIconMap[299] = 11; //Moderate rain at times
  WWIconMap[296] = 11; //Light rain
  WWIconMap[293] = 40; //Patchy light rain
  WWIconMap[284] = 17; //Heavy freezing drizzle
  WWIconMap[281] = 17; //Freezing drizzle
  WWIconMap[266] = 9; //Light drizzle
  WWIconMap[263] = 9; //Patchy light drizzle
  WWIconMap[260] = 20; //Freezing fog
  WWIconMap[248] = 20; //Fog
  WWIconMap[230] = 43; //Blizzard
  WWIconMap[227] = 43; //Blowing snow
  WWIconMap[200] = 4; //Thundery outbreaks in nearby
  WWIconMap[185] = 17; //Patchy freezing drizzle nearby
  WWIconMap[182] = 18; //Patchy sleet nearby
  WWIconMap[179] = 46; //Patchy snow nearby
  WWIconMap[176] = 40; //Patchy rain nearby
  WWIconMap[143] = 21; //Mist
  WWIconMap[122] = 26; //Overcast 
  WWIconMap[119] = 26; //Cloudy
  WWIconMap[116] = 30; //Partly Cloudy
  WWIconMap[1160] = 29; //Partly Cloudy Night
  WWIconMap[113] = 32; //Clear/Sunny
  WWIconMap[1130] = 31; //Clear/Sunny Night
  
  var response;
  var req = new XMLHttpRequest();
  req.open('GET', "http://api.worldweatheronline.com/free/v2/weather.ashx?q=" + latitude + "," + longitude + "&format=json&num_of_days=1&" +
           "key=" + WorldWeatherkey);
  
  //UnitsToString(mConfig.units), true)
  req.onload = function(e) {
    if (req.readyState == 4) {
      if(req.status == 200) {
        //console.log(req.responseText);
        response = JSON.parse(req.responseText);
        
        var temperature, high, low, code;
        if (response) {
          var weatherResult = response.data;
          
          // Hack to check if night
          if(weatherResult.current_condition[0].weatherIconUrl[0].value.indexOf("night") > 0)
              bNight = true;
          else 
              bNight = false;
          
          code = parseInt(weatherResult.current_condition[0].weatherCode);
          
          if(code == 113 && bNight)
              code = 1130;
          
          if(code == 116 && bNight)
              code = 1160;
          
          // Convert to mapped code
          code = WWIconMap[code];
            
          if(mConfig.units ==0) // F
          {
              temperature = parseInt(weatherResult.current_condition[0].temp_F);
              high = parseInt( weatherResult.weather[0].maxtempF);
              low = parseInt(weatherResult.weather[0].mintempF);
          }
          else // C
          {
              temperature = parseInt(weatherResult.current_condition[0].temp_C);
              high = parseInt(weatherResult.weather[0].maxtempC);
              low = parseInt(weatherResult.weather[0].mintempC);
          }

          Pebble.sendAppMessageWithRetry({
            "temperature": temperature,
            "icon": code,
            "high": high,
            "low": low
            }, 10);
          
        }

      } else {
        console.log("Weather Error");
      }
    }
  };
  req.send(null);
}

function locationSuccess(pos) {
    //console.log("JS locationSuccess()");
    var coordinates = pos.coords;
    fetchWeather(coordinates.latitude, coordinates.longitude);
}

function locationError(err) {
    //console.warn('JS locationError(' + err.code + '): ' + err.message);
    Pebble.sendAppMessageWithRetry({
    "temperature": 999,
    "icon": 48,
    "high": 0,
    "low": 0
    }, 10);
}

function saveLocalData(config) {
    localStorage.setItem("style", parseInt(config.style));  
    localStorage.setItem("bluetoothvibe", parseInt(config.bluetoothvibe)); 
    localStorage.setItem("hourlyvibe", parseInt(config.hourlyvibe)); 
    localStorage.setItem("units", parseInt(config.units));  
    localStorage.setItem("blink", parseInt(config.blink));
    localStorage.setItem("dateformat", parseInt(config.dateformat));	

	localStorage.setItem("gpslat", config.gpslat===null?'':config.gpslat);
	localStorage.setItem("gpslon", config.gpslon===null?'':config.gpslon);

    loadLocalData();
}
function loadLocalData() {
    mConfig.style = parseInt(localStorage.getItem("style"));
    mConfig.bluetoothvibe = parseInt(localStorage.getItem("bluetoothvibe"));
    mConfig.hourlyvibe = parseInt(localStorage.getItem("hourlyvibe"));
    mConfig.units = parseInt(localStorage.getItem("units"));
    mConfig.blink = parseInt(localStorage.getItem("blink"));
    mConfig.dateformat = parseInt(localStorage.getItem("dateformat"));
  mConfig.configureUrl = "http://sdhome.zapto.org:8080/pebble/chunk/index2.html";
	mConfig.gpslat = localStorage.getItem("gpslat");
	mConfig.gpslon = localStorage.getItem("gpslon");

    if(isNaN(mConfig.style)) {
        mConfig.style = 1;
    }
    if(isNaN(mConfig.bluetoothvibe)) {
        mConfig.bluetoothvibe = 1;
    }
    if(isNaN(mConfig.hourlyvibe)) {
        mConfig.hourlyvibe = 0;
    }   
    if(isNaN(mConfig.units)) {
        mConfig.units = 1;
    } 
    if(isNaN(mConfig.blink)) {
        mConfig.blink = 1;
    } 
    if(isNaN(mConfig.dateformat)) {
        mConfig.dateformat = 0;
    } 
  
}
function returnConfigToPebble() {
    Pebble.sendAppMessageWithRetry({
        "style":parseInt(mConfig.style), 
        "bluetoothvibe":parseInt(mConfig.bluetoothvibe), 
        "hourlyvibe":parseInt(mConfig.hourlyvibe),
        "units":parseInt(mConfig.units),
        "blink":parseInt(mConfig.blink),
        "dateformat":parseInt(mConfig.dateformat)
    }, 10);
    getWeather();
}
function UnitsToString(unit) {
  if(unit===0) {
    return "f";
  }
  return "c";
}

function getWeather() {
  console.log("get wetather-" + mConfig.gpslat );
  
	if(mConfig.gpslat!=='' && mConfig.gpslon!=='') {
		//console.log("used fixed gps");
		fetchWeather(mConfig.gpslat, mConfig.gpslon);
	}
	else {
		//console.log("used auto gps")'
		navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);		
	}
  
}

Pebble.addEventListener("ready", function(e) {
  loadLocalData();
  returnConfigToPebble();
});


Pebble.addEventListener("appmessage", function(e) {
  getWeather();
});

Pebble.addEventListener("showConfiguration", function(e) {
	//Pebble.openURL("http://superdavex.github.io/index_chunk_config.html");

  loadLocalData();
    
  var script_variables = '<script language="javascript">';
  script_variables += 'var mStyle = ' + mConfig.style + ';';
  script_variables += 'var mBluetoothvibe = ' + mConfig.bluetoothvibe + ';';
  script_variables += 'var mHourlyvibe = ' + mConfig.hourlyvibe + ';';
  script_variables += 'var mUnits = ' + mConfig.units + ';';
  script_variables += 'var mBlink = ' + mConfig.blink + ';';
  script_variables += 'var mDateFormat = ' + mConfig.dateformat + ';';
  script_variables += 'var mGpsLat = "' + mConfig.gpslat + '";';
  script_variables += 'var mGpsLon = "' + mConfig.gpslon + '";';
  script_variables += '</script>';
  
  console.log(script_variables);
  
  var sData = 'data:text/html,' + script_variables;
  sData += '<!DOCTYPE html><html><head>	<title>Chunk v2.0 Config</title>	<meta name="viewport" content="width=device-width, initial-scale=1.0">	<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script></head><body>    <div class="container">	  <h2>Chunk v2.0</h2>            <form id="configure-form" class="form-configure well" action="#" method="POST">	          <h4>Build Style</h4>        <p><small>Choose your favourite build style.</small></p>        <div class="btn-group" data-toggle="buttons">          <label class="btn btn-primary">            <input type="radio" name="style" id="style1" value="1"> BlackOnWhite          </label>          <label class="btn btn-primary">            <input type="radio" name="style" id="style2" value="2"> Split1(WhiteTop)          </label>          <label class="btn btn-primary">            <input type="radio" name="style" id="style3" value="3"> WhiteOnBlack          </label>          <label class="btn btn-primary">            <input type="radio" name="style" id="style4" value="4"> Split2(BlackTop)          </label>        </div>        <hr />		        <h4>Bluetooth Vibe</h4>        <p><small>Vibrate on Bluetooth disconnect.</small></p>        <div class="btn-group" data-toggle="buttons">          <label class="btn btn-primary">            <input type="radio" name="bluetoothvibe" id="bluetoothvibe1" value="1"> Yes          </label>          <label class="btn btn-primary">            <input type="radio" name="bluetoothvibe" id="bluetoothvibe2" value="0"> No          </label>        </div>        <hr />		        <h4>Hourly Vibe</h4>        <p><small>Vibrate on the hour.</small></p>        <div class="btn-group" data-toggle="buttons">          <label class="btn btn-primary">            <input type="radio" name="hourlyvibe" id="hourlyvibe1" value="1"> Yes          </label>          <label class="btn btn-primary">            <input type="radio" name="hourlyvibe" id="hourlyvibe2" value="0"> No          </label>        </div>        <hr />		        <h4>Units</h4>        <p><small>Celsius or Fahrenheit</small></p>        <div class="btn-group" data-toggle="buttons">          <label class="btn btn-primary">            <input type="radio" name="units" id="units1" value="1"> Celsius          </label>          <label class="btn btn-primary">            <input type="radio" name="units" id="units2" value="0"> Fahrenheit          </label>        </div>        <hr />		        <h4>Blink</h4>        <p><small>The colon between the hours and minutes will blink every second.</small></p>        <div class="btn-group" data-toggle="buttons">          <label class="btn btn-primary">            <input type="radio" name="blink" id="blink1" value="1"> Yes          </label>          <label class="btn btn-primary">            <input type="radio" name="blink" id="blink2" value="0"> No          </label>        </div>        <hr />		        <h4>Date Format</h4>        <p><small>Control the date appearance. (will add more options at some point)</small></p>        <div class="btn-group" data-toggle="buttons">          <label class="btn btn-primary">            <input type="radio" name="dateformat" id="dateformat1" value="1"> No Suffix          </label>          <label class="btn btn-primary">            <input type="radio" name="dateformat" id="dateformat2" value="0"> Default          </label>        </div>        <hr />	          <h4>Fixed GPS</h4>        <p><small>If set, always use these GPS coordinates for the weather instead of GPS. <br />		Enter specific GPS coordinates to use your current GPS position. <br />		Click Auto Location to always lookup your current position automatically.</small></p>        <div class="btn-group" data-toggle="buttons">          <label class="btn btn-primary">            <input type="text" name="gpslat" id="gpslat" value=""> Latitude          </label>          <label class="btn btn-primary">            <input type="text" name="gpslon" id="gpslon" value=""> Longitude          </label><div class="clearfix"></div><br />		  <input type="button" id="ClearCoords" value="Auto Location" class="btn btn-danger" />        </div>        <hr />			        <div class="clearfix">          <input class="btn btn-lg btn-primary btn-block" id="save" type="submit" value="Save"/>        </div>      </form>	  </div>    <div class="footer container">    	<p>Chunk Weather v2.0 by <a href="http://twitter.com/orviwan">orviwan</a></p>    </div>    	<script>	$("#ClearCoords").click(function() {		clear_location();	});		function clear_location() {		$("#gpslat").val("");		$("#gpslon").val("");	}            $().ready(function () {		try {				$("#gpslat").val(mGpsLat);		$("#gpslon").val(mGpsLon);                        $("#style1").prop("checked", false);        $("#style1").parent().removeClass("active");        $("#style2").prop("checked", false);        $("#style2").parent().removeClass("active");        $("#style3").prop("checked", false);        $("#style3").parent().removeClass("active");        $("#style4").prop("checked", false);        $("#style4").parent().removeClass("active");        switch(mStyle) {          case 1:            $("#style1").prop("checked", true);            $("#style1").parent().addClass("active");            break;          case 2:            $("#style2").prop("checked", true);            $("#style2").parent().addClass("active");            break;          case 3:            $("#style3").prop("checked", true);            $("#style3").parent().addClass("active");            break;          case 4:            $("#style4").prop("checked", true);            $("#style4").parent().addClass("active");            break;                }                if(mBluetoothvibe) {          $("#bluetoothvibe1").prop("checked", true);          $("#bluetoothvibe1").parent().addClass("active");                    $("#bluetoothvibe2").prop("checked", false);          $("#bluetoothvibe2").parent().removeClass("active");        }         else {          $("#bluetoothvibe1").prop("checked", false);          $("#bluetoothvibe1").parent().removeClass("active");                    $("#bluetoothvibe2").prop("checked", true);          $("#bluetoothvibe2").parent().addClass("active");         }                        if(mHourlyvibe) {          $("#hourlyvibe1").prop("checked", true);          $("#hourlyvibe1").parent().addClass("active");                    $("#hourlyvibe2").prop("checked", false);          $("#hourlyvibe2").parent().removeClass("active");        }         else {          $("#hourlyvibe1").prop("checked", false);          $("#hourlyvibe1").parent().removeClass("active");                    $("#hourlyvibe2").prop("checked", true);          $("#hourlyvibe2").parent().addClass("active");         }                                if(mUnits) {          $("#units1").prop("checked", true);          $("#units1").parent().addClass("active");                    $("#units2").prop("checked", false);          $("#units2").parent().removeClass("active");        }         else {          $("#units1").prop("checked", false);          $("#units1").parent().removeClass("active");                    $("#units2").prop("checked", true);          $("#units2").parent().addClass("active");         }		        if(mBlink) {          $("#blink1").prop("checked", true);          $("#blink1").parent().addClass("active");                    $("#blink2").prop("checked", false);          $("#blink2").parent().removeClass("active");        }         else {          $("#blink1").prop("checked", false);          $("#blink1").parent().removeClass("active");                    $("#blink2").prop("checked", true);          $("#blink2").parent().addClass("active");         }		        if(mDateFormat) {          $("#dateformat1").prop("checked", true);          $("#dateformat1").parent().addClass("active");                    $("#dateformat2").prop("checked", false);          $("#dateformat2").parent().removeClass("active");        }         else {          $("#dateformat1").prop("checked", false);          $("#dateformat1").parent().removeClass("active");                    $("#dateformat2").prop("checked", true);          $("#dateformat2").parent().addClass("active");         }					  		}		catch(err) {			alert(err);		}		      });      $("#configure-form").submit(function(e) {          mStyle = $("#style1").prop("checked") ? 1 : 0;        mStyle = $("#style2").prop("checked") ? 2 : mStyle;        mStyle = $("#style3").prop("checked") ? 3 : mStyle;        mStyle = $("#style4").prop("checked") ? 4 : mStyle;                mBluetoothvibe = $("#bluetoothvibe1").prop("checked") ? 1 : 0;        mHourlyvibe = $("#hourlyvibe1").prop("checked") ? 1 : 0;        mUnits = $("#units1").prop("checked") ? 1 : 0;		mBlink = $("#blink1").prop("checked") ? 1 : 0;		mDateFormat = $("#dateformat1").prop("checked") ? 1 : 0;		mGpsLat = $("#gpslat").val();		mGpsLon = $("#gpslon").val();		                var j = {          style : parseInt(mStyle),          bluetoothvibe : parseInt(mBluetoothvibe),          hourlyvibe: parseInt(mHourlyvibe),          units : parseInt(mUnits),		  blink : parseInt(mBlink),		  dateformat : parseInt(mDateFormat),		  gpslat: parseFloat(mGpsLat),		  gpslon: parseFloat(mGpsLon)        };                window.location.href = "pebblejs://close#" + JSON.stringify(j);        e.preventDefault();      });  </script></body></html>' ; 
  sData += '<!--.html';
  console.log(sData);
    Pebble.openURL(sData );
  
});

Pebble.addEventListener("webviewclosed", function(e) {
  if (e.response) {
    var config = JSON.parse(e.response);
    saveLocalData(config);
    returnConfigToPebble();
  }
});


