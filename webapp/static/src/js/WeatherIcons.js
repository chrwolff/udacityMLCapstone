 const iconMap = {
    "clear-day": "wi-day-sunny",
    "clear-night": "wi-night-clear",
    "rain": "wi-rain", 
    "snow": "wi-snow", 
    "sleet": "wi-sleet",
    "wind": "wi-strong-wind", 
    "fog": "wi-fog", 
    "cloudy": "wi-cloudy",
    "partly-cloudy-day": "wi-day-cloudy", 
    "partly-cloudy-night": "wi-night-alt-cloudy"
};

function map (iconString, iconElement) {
    iconElement.className = "";
    iconElement.classList.add("weatherIcon");
    iconElement.classList.add("wi");
    var iconName = iconMap[iconString];
    if (iconName) {
        iconElement.classList.add(iconName);
    } else {    
        iconElement.classList.add("wi-na");
    }
}

export default {
    map
}