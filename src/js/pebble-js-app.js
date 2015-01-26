var mConfig = {};
var locationOptions = { "timeout": 15000, "maximumAge": 60000 }; 
var openWeatherkey = "GETAKEY";



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
  var OWIconMap =[]; 
  
  OWIconMap[395] = 46; //Moderate or heavy snow in area with thunder
  OWIconMap[392] = 14; //Patchy light snow in area with thunder
  OWIconMap[389] = 45; //Moderate or heavy rain in area with thunder
  OWIconMap[386] = 45; //Patchy light rain in area with thunder
  OWIconMap[377] = 17; //Moderate or heavy showers of ice pellets
  OWIconMap[374] = 17; //Light showers of ice pellets
  OWIconMap[371] = 46; //Moderate or heavy snow showers
  OWIconMap[368] = 14; //Light snow showers
  OWIconMap[365] = 18; //Moderate or heavy sleet showers
  OWIconMap[362] = 18; //Light sleet showers
  OWIconMap[359] = 11; //Torrential rain shower
  OWIconMap[356] = 11; //Moderate or heavy rain shower
  OWIconMap[353] = 11; //Light rain shower
  OWIconMap[350] = 17; //Ice pellets
  OWIconMap[338] = 41; //Heavy snow
  OWIconMap[335] = 41; //Patchy heavy snow
  OWIconMap[332] = 46; //Moderate snow
  OWIconMap[329] = 46; //Patchy moderate snow
  OWIconMap[326] = 14; //Light snow
  OWIconMap[323] = 14; //Patchy light snow
  OWIconMap[320] = 18; //Moderate or heavy sleet
  OWIconMap[317] = 18; //Light sleet
  OWIconMap[314] = 17; //Moderate or Heavy freezing rain
  OWIconMap[311] = 17; //Light freezing rain
  OWIconMap[308] = 11; //Heavy rain
  OWIconMap[305] = 11; //Heavy rain at times
  OWIconMap[302] = 11; //Moderate rain
  OWIconMap[299] = 11; //Moderate rain at times
  OWIconMap[296] = 11; //Light rain
  OWIconMap[293] = 40; //Patchy light rain
  OWIconMap[284] = 17; //Heavy freezing drizzle
  OWIconMap[281] = 17; //Freezing drizzle
  OWIconMap[266] = 9; //Light drizzle
  OWIconMap[263] = 9; //Patchy light drizzle
  OWIconMap[260] = 20; //Freezing fog
  OWIconMap[248] = 20; //Fog
  OWIconMap[230] = 43; //Blizzard
  OWIconMap[227] = 43; //Blowing snow
  OWIconMap[200] = 4; //Thundery outbreaks in nearby
  OWIconMap[185] = 17; //Patchy freezing drizzle nearby
  OWIconMap[182] = 18; //Patchy sleet nearby
  OWIconMap[179] = 46; //Patchy snow nearby
  OWIconMap[176] = 40; //Patchy rain nearby
  OWIconMap[143] = 21; //Mist
  OWIconMap[122] = 26; //Overcast 
  OWIconMap[119] = 26; //Cloudy
  OWIconMap[116] = 30; //Partly Cloudy
  OWIconMap[1160] = 29; //Partly Cloudy Night
  OWIconMap[113] = 32; //Clear/Sunny
  OWIconMap[1130] = 31; //Clear/Sunny Night
  
  var response;
  var req = new XMLHttpRequest();
  req.open('GET', "http://api.worldweatheronline.com/free/v2/weather.ashx?q=" + latitude + "," + longitude + "&format=json&num_of_days=1&" +
           "key=" + openWeatherkey);
  
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
          code = OWIconMap[code];
            
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
  mConfig.gpslat='36.6788';
  mConfig.gpslon='-76.3088';
  
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
	Pebble.openURL("http://superdavex.github.io/index_chunk_config.html");
  //Pebble.openURL('data:text/html,<html><body><h1>Hello World</h1></body></html><!--.html');
  
});

Pebble.addEventListener("webviewclosed", function(e) {
  if (e.response) {
    var config = JSON.parse(e.response);
    saveLocalData(config);
    returnConfigToPebble();
  }
});


