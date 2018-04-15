let tz_array = [];
// Start Canvas Stuff
let TAU = Math.PI * 2;
let canvas,ctx;
let outtext;
let line = 0;
let radius = 25;
let arc_width = 13;
let radii_diff = 15;
let LOC = 150;

function calcLineHeight(el) {
  var lineHeight;
  var clone;
  var singleLineHeight;
  var doubleLineHeight;
    clone = el.cloneNode();
    clone.innerHTML = '<br>';
    el.appendChild(clone);
    singleLineHeight = clone.offsetHeight;
    clone.innerHTML = '<br><br>';
    doubleLineHeight = clone.offsetHeight;
    el.removeChild(clone);
    lineHeight = doubleLineHeight - singleLineHeight;
  return lineHeight
}

function logText(str) {
    outtext.innerHTML += '<br/>'+line+': '+str;
    line++;
    if (line == 1000) {line = 0;}
    outtext.scrollTop = outtext.scrollHeight;
}

function canvas_stuff() {
    logText("canvas_stuff: called");
    canvas = document.getElementById('canvas');
    if (canvas.getContext) {
        ctx = canvas.getContext('2d');
        logText("canvas_stuff: got context");
    } else {
        logText("canvas_stuff: couldn't get context");
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

function draw_canvas() {
    //logText("draw_canvas: called");
    //let d = new Date();
    ctx.clearRect(0,0,300,300);
    //second
    let percent = parseInt(moment().format('s'))/59;
    ctx.strokeStyle = '#ff73e6';
    ctx.lineWidth = arc_width;
    let r = radius
    ctx.beginPath();
    //*
    ctx.arc(LOC,LOC,r,
      1.5*Math.PI,
      (percent * TAU) + (1.5*Math.PI), false);
    //*/
    //ctx.arc(100,100,25,0,TAU, false);
    ctx.stroke();
    //*
    //minute
    percent = parseInt(moment().format('m'))/59;
    ctx.strokeStyle = '#d755ff';
    r += radii_diff;
    ctx.beginPath();
    ctx.arc(LOC,LOC,r,
      1.5*Math.PI,
      (percent * TAU) + (1.5*Math.PI), false);
    ctx.stroke();
    //hour
    percent = parseInt(moment().format('H'))/24;
    ctx.strokeStyle = '#5568ff';
    r += radii_diff;
    ctx.beginPath();
    ctx.arc(LOC,LOC,r,
      1.5*Math.PI,
      (percent * TAU) + (1.5*Math.PI), false);
    ctx.stroke();
    //day
    percent = parseInt(moment().format('D'))/parseInt(moment().daysInMonth());
    ctx.strokeStyle = '#55ff83';
    r += radii_diff;
    ctx.beginPath();
    ctx.arc(LOC,LOC,r,
      1.5*Math.PI,
      (percent * TAU) + (1.5*Math.PI), false);
    ctx.stroke();
    //month
    percent = parseInt(moment().format('M'))/12;
    ctx.strokeStyle = '#ffcc55';
    r += radii_diff;
    ctx.beginPath();
    ctx.arc(LOC,LOC,r,
      1.5*Math.PI,
      (percent * TAU) + (1.5*Math.PI), false);
    ctx.stroke();
    //ctx.strokeText(tzone,100,100);
//*/
};
//End Canvas Stuff

function dh_update() {
  for (let index = 0; index < tz_array.length; index++) {
    let tz = tz_array[index][0];
    let elem = tz_array[index][1];
    let time = moment().tz(tz);
    elem.innerHTML = time.format('DD/MM/YY hh a'); // 'DD/MM/YY, hh:mm:ss a'
    elem.dataset.time = time.format('a');
  }
};

function ms_update() {
  document.getElementById('ms').innerHTML = moment().format('mm:ss');
};

let setintervals = function() {
  setInterval(dh_update,1000);
  setInterval(ms_update,500);
  setInterval(draw_canvas,500);
};

function get_tz() {
  let tzArray = document.getElementById('tz_div').getElementsByTagName('span');
  let outArray = document.getElementById('result').getElementsByTagName('span');
  for (let index = 0; index < tzArray.length; index++) {
    tz_array[index] = []
    tz_array[index][0] = tzArray[index].innerHTML;
    tz_array[index][1] = outArray[index];
    console.log(tz_array);
  }
  dh_update();
  ms_update();
  outtext = document.getElementById('outtext');
  window.scrollbars.visible;
  canvas_stuff();
  draw_canvas();
  setintervals();
};

window.onload = get_tz;
