"use strict";


var presentYear = "2016";

var data = [];

var r = $.getJSON( "data/eduists.json", function() {
  console.log( "success" );
})
  .done(function() {
    console.log( "second success" );
  })
  .fail(function() {
    console.log( "error" );
  })
  .always(function() {
    console.log( "complete" );
    // data = r.responseJSON;
    var string = r.responseText;
    data = JSON.parse(string.replace(/\bInfinity\b/g, presentYear), function (key, value) {
                return value === "Infinity"  ? Infinity : value;
                });
    plotTimeline(data);
  });


// initialize circles to represent births on timeline
var circles = [];
var Circle = function(x,y,radius,name,summary) {
    this.left = x - radius;
    this.top = y - radius;
    this.right = x + radius;
    this.bottom = y + radius;
    this.name = name;
    this.summary = summary;
};


// set canvas and ctx
var canvas = document.getElementById('timeline');
var ctx = canvas.getContext('2d');

// canvas width >> width of window
var width = $(window).width();
$(document).ready( setCanvas(width) );
$(window).resize(function() {
    if ($(this).width() != width) {
        width = $(this).width();
        console.log(width);
        resizeCanvas(width);
        plotTimeline(data);
    }
});

// set initial canvas dimensions on document ready
function setCanvas(width) {
    canvas.width = width;
    canvas.height = 1.5 * width;
    console.log(width+'x'+canvas.height);
}

// resize canvas, if change window.width detected
function resizeCanvas(width) {
    canvas.width = width;
}

// resize canvas, if change window.width detected
function sizeCanvasHeight(height) {
    canvas.height = height;
}

function plotTimeline(data) {

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    circles.splice(0,circles.length);

    var height = data.length*45 + 60;
    sizeCanvasHeight(height);

    data.sort(function(a,b) { return a.birth - b.birth; });
    console.log(data);

    var birthYears = [];
    var deathYears = [];
    for (var i = 0; i < data.length; i++) {
        birthYears.push(data[i].birth);
        deathYears.push(data[i].death);
    }

    var minYear;
    var maxYear;
    minYear = Math.min(...birthYears);
    maxYear = Math.max(...deathYears);
    console.log(minYear, maxYear);

    var padYear = 10;  // years
    var minYearPadded = minYear - padYear;
    var maxYearPadded = maxYear + padYear;
    var time = maxYearPadded - minYearPadded;
    console.log(time + ' years');

    var gridIncrement = canvas.width / time;
    console.log(gridIncrement);

    var physicalOffset = padYear*gridIncrement;

    // minor grid lines
    for (var i=0; i < time; i+=gridIncrement) {
    ctx.beginPath();
    ctx.moveTo(i*gridIncrement, 0);  // origin
    ctx.lineTo(i*gridIncrement, canvas.height);  // endpoint
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(10,10,10,0.2)";
    ctx.stroke();
    }

    // major grid lines
    for (var i=0; i < time; i+=gridIncrement*10) {
    ctx.beginPath();
    ctx.moveTo(physicalOffset + i*gridIncrement, 0);  // origin
    ctx.lineTo(physicalOffset + i*gridIncrement, canvas.height);  // endpoint
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(10,10,10,0.8)";
    ctx.stroke();

    // labels by year
    var yearLabel = Math.round(i + minYear);
    ctx.font = "15px Arial italic";
    ctx.fillStyle = "gray";
    ctx.textAlign = "left";
    ctx.fillText(yearLabel, physicalOffset + i*gridIncrement + 3, 15);
    }

    // check for positional conflicts, track who's already been plotted
    var currentLane = 0;
    var sharedLanes = 0;
    var laneCount = data.length;

    var livesPlotted = {};
    livesPlotted[currentLane] = 0;

    var yOffset = 60;

    for (var i=0; i < data.length; i++) {

        var xOrigin = physicalOffset + (data[i].birth-minYear)*gridIncrement;
        var xEndpoint = physicalOffset + (data[i].death-minYear)*gridIncrement;
        var lifeSpan = data[i].death - data[i].birth;
        var radius = lifeSpan/gridIncrement;

        // iterates through lanes, compares data[i].birth to max death
        // if birth < death, checks next lane or eventually creates new lane
        // if birth > death, plots on that lane (key)
        for (var key in livesPlotted) {

            // plots on current lane (key)
            if (data[i].birth > livesPlotted[key]) {

                // current lane
                currentLane = parseInt(key);
                sharedLanes += 1;
                laneCount -= 1;

                break;

            } else {

                // in the case that a new lane needs to be created
                currentLane = parseInt(key)+1;
            }
        }

        // update current lane's max death value
        livesPlotted[currentLane] = data[i].death;

        console.log(livesPlotted);

        var yConstant = currentLane*60 + yOffset;
        console.log(yConstant);

        // plot line for lifespan
        ctx.beginPath();
        ctx.moveTo(xOrigin+radius, yConstant);
        ctx.lineTo(xEndpoint, yConstant);
        ctx.lineWidth = 10;
        ctx.lineCap = "butt";
        ctx.strokeStyle = "pink";
        ctx.stroke();
        // label line with name
        ctx.font= "12px Arial";
        ctx.fillStyle = "rgba(40,40,40,0.9)";
        ctx.fillText(data[i].name, xOrigin+radius, yConstant-5);

        // create circle at birth
        ctx.beginPath();
        ctx.arc(xOrigin,yConstant,radius,0,2*Math.PI);
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fill();
        ctx.fillStyle = "rgba(40,40,40,0.1)";
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(40,40,40,0.9)";
        ctx.stroke();
        // small point at center
        ctx.beginPath();
        ctx.arc(xOrigin,yConstant,3,0,2*Math.PI);
        ctx.fillStyle = "rgba(40,40,40,0.9)";
        ctx.fill();

        // adds circles to list of circles for clicking purposes
        var circle = new Circle(xOrigin,yConstant,radius,data[i].name,data[i].summary);
        circles.push(circle);

        }

    // present year marker
    ctx.beginPath();
    ctx.moveTo(canvas.width - physicalOffset, 25);  // origin
    ctx.lineTo(canvas.width - physicalOffset, canvas.height);  // endpoint
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(110,10,10,0.6)";
    ctx.stroke();

}

// click functionality to show summary data
$('canvas').on('click', function (e) {
    var clickedX = e.pageX - this.offsetLeft;
    var clickedY = e.pageY - this.offsetTop;
    console.log(clickedY, clickedX);

    for (var i=0; i < circles.length; i++) {
        if (clickedX < circles[i].right && clickedX > circles[i].left && clickedY > circles[i].top && clickedY < circles[i].bottom) {
            console.log('Clicked index ' + (i+1) + '. ' + circles[i].name + ': ' + circles[i].summary);
            $('#educator-name').html(circles[i].name + ": ");
            $('#educator-summary').html(circles[i].summary);
            $('#close').html('<a id="remove-educator">X (click here to remove this educator)</a>');
            $('#text').data('educator', i);
        }
    }
});

// add to data, user input via form
$("#add-educator").submit(addData);
function addData() {
    event.preventDefault();
    var formData = {};
    formData['name'] = $("#name").val();
    formData['birth'] = $("#birth").val();
    formData['death'] = $("#death").val();
    formData['summary'] = $("#summary").val();
    data.push(formData);
    plotTimeline(data);
}

// user clicks on 'x' to remove data
$("#text").on('click', function (e) {
    var index = $(this).data('educator');
    reformulateData(index);

    $("#educator-name").html('');
    $("#educator-summary").html('');
    $("#close").html('');
});

function reformulateData(index) {
    alert("You have just removed "+data[index].name+" from this timeline!");
    data.splice(index, 1);
    plotTimeline(data);
}

// TODO: major grid lines should be rounded years, ie., 1700-2100.
// TODO: show summary data on mouseover, not on click.
// TODO: let user add and remove events through json route (data persistence).
// TODO: when user adds an event, update circles.
// TODO: provide a more elegant way to remove events.
