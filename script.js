// Physics
var M_E = 5.97e24
var R_E = 6371
var G = 6.67e-11
var mi2km = 1.61
var km2px = 1/2000
var angle2px = 1000
var dt0 = 50

var moon_ecliptic_angle = 0.5*Math.PI;
var moon_equinox_angle = 0*Math.PI;

// Coding note: x0 and y0 are in pixels, and are only ever added on plotting
var x0 = window.innerWidth/2;
var y0 = 100;
var t0 = 28957824000;
var time = t0;
var time_zone = 0;
var dt = dt0;
var phase_plot_gap = 20;

var moon_radius = 4;
var eberron_radius = 4;
var ring_radius = 1.5 * eberron_radius;
var ring_width = 2;

var moon_size_multiplier = 4;

var view_lat = 30;

var xpos = x0;
var ypos = y0;

var reset_button = document.getElementById('reset');
var startstop_button = document.getElementById('startstop');
var faster_button = document.getElementById('faster');
var slower_button = document.getElementById('slower');
var reverse_button = document.getElementById('reverse');
var settime_button = document.getElementById('settime');
var settime_confirm_button = document.getElementById('settime_confirm');                            

var namecheck_orbits = document.getElementById('namesorbits');
var namecheck_phases = document.getElementById('namesphases');
var namecheck_sky = document.getElementById('namessky');

/*
===========================
Moon class
===========================
*/
class Moon {
  constructor(name,radius,orbit_radius,phase,color) {
    this.name = name;
    this.radius = radius;
    this.orbit_radius = orbit_radius;
    this.phase = phase;
    this.color = color;
  }
  
  apparent_size() {
    return 2*Math.atan(this.radius/this.orbit_radius);
  }
  
  orbit_period() {
    return ((this.orbit_radius * 1e3)**3 * (2*Math.PI)**2 / (G*M_E))**0.5;
  }
  
  xpos(time) {
    return this.orbit_radius * Math.cos(2 * Math.PI * time / this.orbit_period());
  }
  ypos(time) {
    return this.orbit_radius * Math.sin(2 * Math.PI * time / this.orbit_period());
  }
}

/*
===========================
Timestamp and date time handling
===========================
*/

function time2str_eberron(time) {
  // Assumes time give as seconds since seconds since Zarantyr 1st 00:00, 0 YK
  // Note: currently breaks for 'negative' times
    secs = Math.floor((time % 60))
    mins = Math.floor(((time/60) % 60))
    hours = Math.floor((time/(60*60) % 24))
    
    
    day = Math.floor((time/(60*60*24) % 28))+1
    month = Math.floor((time/(60*60*24*28) % 12))
    year = Math.floor(time/(60*60*24*28*12))+1
    
    time_str = hours.toString().padStart(2,'0') + ':' +
               mins.toString().padStart(2,'0') + ':' +
               secs.toString().padStart(2,'0')
  
    month_names = ['Zarantyr','Olarune','Therendor','Eyre','Dravago','Nymm','Lharvion','Barrakas','Rhaan','Sypheros','Aryth','Vult']
    
    date_str = day+' '+month_names[month]+' '+year+'YK'
    
    datetime_str = date_str+', '+time_str
    return datetime_str
}

function get_month(time) {
    month = Math.floor((time/(60*60*24*28) % 12))
    month_names = ['Zarantyr', 'Olarune','Therendor','Eyre','Dravago',
               'Nymm','Lharvion','Barrakas','Rhaan','Sypheros',
               'Aryth','Vult']
    return month_names[month]
}

function gen_timestr_eberron(secs,mins,hours,day,month,year) {
  // Calculate a timestr given a date with separated
  // time elements
  secs_thru_day = secs + mins*60 + hours*60*60; 
  secs_thru_month = (day-1)*60*60*24;
  
  month_names = ['Zarantyr','Olarune','Therendor','Eyre','Dravago','Nymm','Lharvion','Barrakas','Rhaan','Sypheros','Aryth','Vult']
  
  for (var i = 0; i < month_names.length; i++) {
    if (month_names[i] == month) {
      month_num = i;
      break
    }
  }
  
  secs_thru_year = month_num*60*60*24*28;
  secs_in_years = (year-1)*60*60*24*28*12;
  
  var timestamp = secs_in_years + secs_thru_year + secs_thru_month + secs_thru_day;
  
  return timestamp
}

function get_timeobj() {
  secs = Math.floor((time % 60))
  mins = Math.floor(((time/60) % 60))
  hours = Math.floor((time/(60*60) % 24))


  day = Math.floor((time/(60*60*24) % 28))+1
  month = Math.floor((time/(60*60*24*28) % 12))
  year = Math.floor(time/(60*60*24*28*12))+1

  time_str = hours.toString().padStart(2,'0') + ':' +
    mins.toString().padStart(2,'0') + ':' +
    secs.toString().padStart(2,'0')

  month_names = ['Zarantyr','Olarune','Therendor','Eyre','Dravago','Nymm','Lharvion','Barrakas','Rhaan','Sypheros','Aryth','Vult']

  month_str = month_names[month];
  return {secs, mins, hours, day, month_str,year}
}

/*
===========================
Color Handling
===========================
*/

function value_to_hex(c) {
  var hex = c.toString(16);
  var hex_filled = ('00'+hex).slice(-2)
  return hex_filled
}
function rgb_to_hex(rgb) {
  return ('#' + value_to_hex(rgb[0]) + value_to_hex(rgb[1]) + value_to_hex(rgb[2]))
}

/*
===========================
Coordinate Transforms
===========================
*/
function cart_to_spherical(x,y,z) {
    var r0 = (x**2+y**2+z**2)**0.5
    var theta = Math.acos(z/r0)
    var phi = 0
    
    if (x > 0) {
      phi = Math.atan2(y,x)
    } else if ((x < 0) && (y >=0)) {    
      phi = Math.atan2(y,x)// + np.pi/2
    } else if ((x < 0) && (y < 0)) {    
      phi = Math.atan2(y,x)// - np.pi/2
    } else if ((x == 0) && (y > 0)) {    
      phi = Math.PI/2
    } else if ((x == 0) && (y < 0)) {    
      phi = -Math.PI/2
    } else {
      phi = 0
    }
    return [theta,phi] 
}

function xypos_lat_to_spherical(xpos,ypos,lat) {
  
  var y = xpos
  var z = ypos
  var x = 0
  
  var lat_rad = lat * Math.PI/180
  var x2 = x * Math.cos(lat_rad) + z * Math.sin(lat_rad)
  var y2 = y
  var z2 = -x * Math.sin(lat_rad) + z * Math.cos(lat_rad)
  
  angles_output = cart_to_spherical(x2,y2,z2);
  return angles_output
}
/*
===========================
Initialisations
===========================
*/

// Moon property definitions
zarantyr = new Moon("Zarantyr",1250/2*mi2km,14300*mi2km,0,'gray')
olarune = new Moon("Olarune",950/2*mi2km,22500*mi2km,0,'#FF8C00')
therendor = new Moon("Therendor",1100/2*mi2km,39000*mi2km,0,'lightgray')
eyre = new Moon("Eyre",1200/2*mi2km,52000*mi2km,0,'#b2b2cc')
dravago = new Moon("Dravago",2000/2*mi2km,77500*mi2km,0,'#d8bfd8')
nymm = new Moon("Nymm",900/2*mi2km,95000*mi2km,0,'#ffff00')
lharvion = new Moon("Lharvion",1350/2*mi2km,125000*mi2km,0,'#ffffff')
barrakas = new Moon("Barrakas",1500/2*mi2km,144000*mi2km,0,'#ffffff')
rhaan = new Moon("Rhaan",800/2*mi2km,168000*mi2km,0,'#87cefa')
sypheros = new Moon("Sypheros",1200/2*mi2km,193000*mi2km,0,'#aaaaaa')
aryth = new Moon("Aryth",1000/2*mi2km,221000*mi2km,0,'#ff4500')
vult = new Moon("Vult",1800/2*mi2km,252000*mi2km,0,'#aaaaaa')

let moon_list = [zarantyr, olarune, therendor, eyre, dravago, nymm, lharvion, barrakas, rhaan, sypheros, aryth, vult]

// Lists for orbit plot
let moon_css_ids = [zarantyr_css, olarune_css, therendor_css, eyre_css, dravago_css, nymm_css, lharvion_css, barrakas_css, rhaan_css, sypheros_css, aryth_css, vult_css]

let orbit_css_ids = [zarantyr_orbit_css, olarune_orbit_css, therendor_orbit_css, eyre_orbit_css, dravago_orbit_css, nymm_orbit_css, lharvion_orbit_css, barrakas_orbit_css, rhaan_orbit_css, sypheros_orbit_css, aryth_orbit_css, vult_orbit_css]

// Lists for phase plot
let moon_phase_ids = [zarantyr_phase_css, olarune_phase_css, therendor_phase_css, eyre_phase_css, dravago_phase_css, nymm_phase_css, lharvion_phase_css, barrakas_phase_css, rhaan_phase_css, sypheros_phase_css, aryth_phase_css, vult_phase_css]

let moon_phase_overlay_ids = [zarantyr_phase_overlay_css, olarune_phase_overlay_css, therendor_phase_overlay_css, eyre_phase_overlay_css, dravago_phase_overlay_css, nymm_phase_overlay_css, lharvion_phase_overlay_css, barrakas_phase_overlay_css, rhaan_phase_overlay_css, sypheros_phase_overlay_css, aryth_phase_overlay_css, vult_phase_overlay_css]

// Lists for sky plot
let moon_sky_ids = [zarantyr_sky_css, olarune_sky_css, therendor_sky_css, eyre_sky_css, dravago_sky_css, nymm_sky_css, lharvion_sky_css, barrakas_sky_css, rhaan_sky_css, sypheros_sky_css, aryth_sky_css, vult_sky_css]

let moon_sky_overlay_ids = [zarantyr_sky_overlay_css, olarune_sky_overlay_css, therendor_sky_overlay_css, eyre_sky_overlay_css, dravago_sky_overlay_css, nymm_sky_overlay_css, lharvion_sky_overlay_css, barrakas_sky_overlay_css, rhaan_sky_overlay_css, sypheros_sky_overlay_css, aryth_sky_overlay_css, vult_sky_overlay_css]

let moon_sky_underlay_ids = [zarantyr_sky_underlay_css, olarune_sky_underlay_css, therendor_sky_underlay_css, eyre_sky_underlay_css, dravago_sky_underlay_css, nymm_sky_underlay_css, lharvion_sky_underlay_css, barrakas_sky_underlay_css, rhaan_sky_underlay_css, sypheros_sky_underlay_css, aryth_sky_underlay_css, vult_sky_underlay_css]

// Set y0 to something sensible
// Currently, y0 is just setting the height of the skybox
y0 = orbits_box.style.height/2;

// Set planet to the correct size and position
eberron.style.width = 2*eberron_radius + 'px';
eberron.style.height = 2*eberron_radius + 'px';
eberron.style.borderWidth = '0px';
eberron.style.left = '50%';
eberron.style.top = '50%';
ring.style.width = 2*ring_radius + 2*ring_width + 'px';
ring.style.height = 2*ring_radius + 2*ring_width + 'px';
ring.style.borderWidth = ring_width + 'px';
ring.style.left = '50%';
ring.style.top = '50%';

// Initialise the orbit CSS
orbit_km2px = Math.min(document.getElementById('orbits_box').offsetHeight,document.getElementById('orbits_box').offsetWidth) / (2.2*vult.orbit_radius);

for (let i = 0; i < moon_list.length; i++) {
  orbit_css_ids[i].style.width = 2 * moon_list[i].orbit_radius * orbit_km2px + 'px';
  orbit_css_ids[i].style.height = 2 * moon_list[i].orbit_radius * orbit_km2px + 'px';
  orbit_css_ids[i].style.left = '50%'
  orbit_css_ids[i].style.top = '50%'
  orbit_css_ids[i].style.borderColor = moon_list[i].color;

  //moon_css_ids[i].style.left = x0 + moon_list[i].orbit_radius * km2px - moon_radius + 'px';
  //moon_css_ids[i].style.bottom = y0 - moon_radius + 'px';
  moon_css_ids[i].style.backgroundColor = moon_list[i].color
}

function render_at_time(time) {
  // Define the main rendering function
  // This draws the whole plot at a given time
  document.getElementById("timertext").innerHTML = time2str_eberron(time) + ' TMT';
  
  // Define the viewing angle for the various plots
  if (time_zone < 0) {
    time_zone = 24+time_zone;
  }
  tmt_view_angle = (360 * (time % (60*60*24))/(60*60*24)) % 360;
  view_angle = (360 * (time % (60*60*24))/(60*60*24) + 15 * time_zone) % 360;
  
  /*
  ===========================
  MOON ORBIT PLOT
  ===========================
  */
  
  // Rotate the time line according to the view angle
  time_line.style.transform = 'translate(-100%,-0%) rotate(-'+view_angle+'deg)';
  tmt_time_line.style.transform = 'translate(-100%,-0%) rotate(-'+tmt_view_angle+'deg)';
  
  for (let i = 0; i < moon_list.length; i++) {
    
    // Calculate the new positions in km
    xpos = moon_list[i].xpos(time)
    ypos = moon_list[i].ypos(time)

    // Set the position of the circle
    moon_css_ids[i].style.left = 'calc(50% + ' + xpos * orbit_km2px + 'px)';
    moon_css_ids[i].style.top = 'calc(50% - ' + ypos * orbit_km2px + 'px)';
  } // End orbit plot loop
  
  /*
  ===========================
  MOON PHASE PLOT
  ===========================
  */
  // xloc and yloc are going to be the top left of the WHOLE circle
  //var xloc = x0 - vult.orbit_radius * km2px - zarantyr.apparent_size()* angle2px
  phases_height = document.getElementById('phases_box').offsetHeight
  phases_width = document.getElementById('phases_box').offsetWidth

  var xloc = phase_plot_gap
  //var xloc = document.getElementById('phases_box').offsetWidth/2

  var yloc = phases_height/2
  
  // Calculate total angular height of all moons
  var total_ang = 0
  for (let i = 0; i < moon_phase_ids.length; i++) {
    total_ang += moon_list[i].apparent_size();
  }
  angle2px = (phases_width - phase_plot_gap*(moon_phase_ids.length+1))/(total_ang)
  
  prev_height = xloc
  for (let i = 0; i < moon_phase_ids.length; i++) {
    
    // Calculate orbit angle
    orbital_angle = (2*Math.PI * (time/moon_list[i].orbit_period())+moon_list[i].phase) % (2*Math.PI);

    moon_phase_ids[i].style.backgroundColor = moon_list[i].color;
    // It's always going to be half width
    moon_phase_ids[i].style.top = '50%';
    moon_phase_ids[i].style.width = moon_list[i].apparent_size() * angle2px/2 + 'px';
    overlay_apparent_width = moon_list[i].apparent_size() * Math.abs(Math.cos(orbital_angle));
    moon_phase_overlay_ids[i].style.width = overlay_apparent_width * angle2px + 'px';

    // Position the overlay in the centre, independent of phase
    moon_phase_overlay_ids[i].style.top = '50%';

    // Just the standard height and xloc no matter the phases
    moon_phase_ids[i].style.height = moon_list[i].apparent_size() * angle2px + 'px';
    moon_phase_overlay_ids[i].style.height = moon_list[i].apparent_size() * angle2px + 'px';
    //moon_phase_ids[i].style.left = prev_height + 'px';
    moon_phase_overlay_ids[i].style.left = prev_height + moon_list[i].apparent_size() * angle2px/2 + 'px';
    
    // Put the ascendency halo in the right place
    if (moon_list[i].name == get_month(time)) {
      ascendent_phase_halo_css.style.width = moon_list[i].apparent_size() * angle2px + 'px';
      ascendent_phase_halo_css.style.height = moon_list[i].apparent_size() * angle2px + 'px';
      //ascendent_phase_halo_css.style.top = yloc - moon_list[i].apparent_size() * angle2px/2 + 'px';
      ascendent_phase_halo_css.style.top = '50%'
      ascendent_phase_halo_css.style.left = prev_height + 'px';
      ascendent_phase_halo_css.style.boxShadow = '0 0 '+ moon_list[i].apparent_size() * angle2px+ 'px 0px #fff';
    }
    
    if (orbital_angle < Math.PI) {
      // Main on the right
      moon_phase_ids[i].style.left = prev_height + moon_list[i].apparent_size()/2 * angle2px + 'px';
      moon_phase_ids[i].style.borderTopRightRadius = moon_list[i].apparent_size() * angle2px + 'px';
      moon_phase_ids[i].style.borderBottomRightRadius = moon_list[i].apparent_size() * angle2px + 'px';
      moon_phase_ids[i].style.borderTopLeftRadius = '0px';
      moon_phase_ids[i].style.borderBottomLeftRadius = '0px';
      if ((orbital_angle < Math.PI/2) || (orbital_angle > 3*Math.PI/2)) {
        moon_phase_overlay_ids[i].style.backgroundColor = 'black'
      } else {
        moon_phase_overlay_ids[i].style.backgroundColor = moon_list[i].color
      }
    } else {
      // Main on the left
      moon_phase_ids[i].style.left = prev_height + 'px';
      moon_phase_ids[i].style.borderTopRightRadius = '0px';
      moon_phase_ids[i].style.borderBottomRightRadius = '0px';
      moon_phase_ids[i].style.borderTopLeftRadius = moon_list[i].apparent_size() * angle2px + 'px';
      moon_phase_ids[i].style.borderBottomLeftRadius = moon_list[i].apparent_size() * angle2px + 'px';
      if ((orbital_angle < Math.PI/2) || (orbital_angle > 3*Math.PI/2)) {
        moon_phase_overlay_ids[i].style.backgroundColor = 'black'
      } else {
        moon_phase_overlay_ids[i].style.backgroundColor = moon_list[i].color
      }
    }
    // Prev height is set to stack them one on top of the other
    prev_height = prev_height + phase_plot_gap + moon_list[i].apparent_size() * angle2px;

  } // End moon phase plot
  
  /*
  ===========================
  SKY POSITION PLOT
  ===========================
  */
  
  var xlen_sky = document.getElementById('skybox').offsetWidth;
  var xmin_sky = 0;
  var xmax_sky = xmin_sky+xlen_sky;
  
  //var ylen_sky = xlen_sky/(Math.PI/2);
  var ylen_sky = xlen_sky/2;
  var ymin_sky = 0;
  var ymax_sky = ymin_sky + ylen_sky;
  
  var yloc_sky = ymin_sky + ylen_sky/2;
  
  skybox.style.height = ylen_sky +'px';
  
  var skyangle2px = xlen_sky/(2*Math.PI);
  
  // Set color of sky
  day_color = [90,140,200];
  night_color = [0,0,0];
  //ground_day_color = [68,68,34];
  ground_day_color = [180,150,110];
  ground_night_color = [110,90,67];
  //ground_day_color = [110,90,67];
  //ground_night_color = [65,45,33];
  
  // Calculate the interpolation fraction between the day and night colors
  if (view_angle > 95 && view_angle < 265) {
      interp_frac = 1;
  } else if (view_angle >= 85 && view_angle <= 95) {
      interp_frac = (view_angle-85)/10;
  } else if (view_angle >= 265 && view_angle <= 275) {
      interp_frac = 1-(view_angle-265)/10;
  } else {
      interp_frac = 0;
  }
  // Set RGB for the sky
  rcol = Math.floor(interp_frac*day_color[0] + (1-interp_frac)*night_color[0]);
  gcol = Math.floor(interp_frac*day_color[1] + (1-interp_frac)*night_color[1]);
  bcol = Math.floor(interp_frac*day_color[2] + (1-interp_frac)*night_color[2]);
  sky_color = rgb_to_hex([rcol,gcol,bcol])
  sky_overlay.style.backgroundColor = sky_color;
  // Set RGB for the ground
  rcol = Math.floor(interp_frac*ground_day_color[0] + (1-interp_frac)*ground_night_color[0]);
  gcol = Math.floor(interp_frac*ground_day_color[1] + (1-interp_frac)*ground_night_color[1]);
  bcol = Math.floor(interp_frac*ground_day_color[2] + (1-interp_frac)*ground_night_color[2]);
  ground_color = rgb_to_hex([rcol,gcol,bcol])
  ground_overlay.style.backgroundColor = ground_color;
  
  // Set size of the Sun
  arrah_sky_css.style.width = moon_size_multiplier * 0.5 * Math.PI/180 * skyangle2px + 'px';
  arrah_sky_css.style.height = moon_size_multiplier * 0.5 * Math.PI/180 * skyangle2px + 'px';
  /*
  // Calc longitude and latitude of Sun
  if (orbital_angle>Math.PI) {  
      moon_latitude = Math.PI/2-orbital_angle;
      moon_longitude = 3*Math.PI/2;
  } else {
    moon_latitude = orbital_angle-3*Math.PI/2;
    moon_longitude = Math.PI/2;
  }
  moonx = moon_longitude;
  moony = moon_latitude;
  */
  
  var sun_angle = (Math.PI/2 - view_angle * Math.PI/180) % (2*Math.PI)
  var xpos_tmp = Math.cos(sun_angle)
  var ypos_tmp = Math.sin(sun_angle)
  var angle_output = xypos_lat_to_spherical(xpos_tmp,ypos_tmp,view_lat)
  
  var moonx = angle_output[1]
  var moony = angle_output[0]
  if (moonx < 0) {
    moonx = moonx+2*Math.PI
  }
  
  // Set Position of Sun
  //arrah_sky_css.style.bottom = '50%'
  //arrah_sky_css.style.left = '50%'
  arrah_sky_css.style.bottom = ymin_sky
    + moony * skyangle2px
    + 'px';
  arrah_sky_css.style.left = xmin_sky 
    + moonx * skyangle2px
    + 'px';
  
  for (let i = 0; i < moon_sky_ids.length; i++) {
    // This one if fixed to midnight meridian
    // Still used for the phases
    orbital_angle = 2*Math.PI - (2*Math.PI * (time/moon_list[i].orbit_period())+moon_list[i].phase) % (2*Math.PI);
    
    // This one if fixed to a moving point on the surface
    //orbital_angle2 = 2*Math.PI - ((2*Math.PI * (time/moon_list[i].orbit_period())+moon_list[i].phase) - view_angle * Math.PI/180) % (2*Math.PI);
   
    // Fix for new long/lat system
    orbital_angle2 = (Math.PI/2 + 2*Math.PI * (time/moon_list[i].orbit_period())+moon_list[i].phase - view_angle * Math.PI/180) % (2*Math.PI)
    
    
    // Set the color
    moon_sky_ids[i].style.backgroundColor = moon_list[i].color;
    moon_sky_underlay_ids[i].style.backgroundColor = sky_color;
    
    // It's always going to be half width fpr the sky moon
    moon_sky_ids[i].style.width = moon_size_multiplier * moon_list[i].apparent_size() * skyangle2px/2 + 'px';
    // Overlay apparent width changes with angle
    overlay_apparent_width = moon_size_multiplier *moon_list[i].apparent_size() * Math.abs(Math.cos(orbital_angle));
    
    moon_sky_overlay_ids[i].style.width = overlay_apparent_width * skyangle2px + 'px';
    moon_sky_underlay_ids[i].style.width = moon_size_multiplier * moon_list[i].apparent_size() * skyangle2px + 'px';

    
    // Just the standard height no matter the phases
    moon_sky_ids[i].style.height = moon_size_multiplier * moon_list[i].apparent_size() * skyangle2px + 'px';
    moon_sky_overlay_ids[i].style.height = moon_size_multiplier * moon_list[i].apparent_size() * skyangle2px + 'px';
    moon_sky_underlay_ids[i].style.height = moon_size_multiplier * moon_list[i].apparent_size() * skyangle2px + 'px';
    
    // Put the ascendency halo in the right place
    if (moon_list[i].name == get_month(time)) {
      moon_sky_underlay_ids[i].style.boxShadow = '0 0 '+ moon_size_multiplier * moon_list[i].apparent_size() * skyangle2px+ 'px 0px #fff';
    } else {
      moon_sky_underlay_ids[i].style.boxShadow = '0 0 0px 0px #fff';
    }
    /*
    Projection: Gall-Peters
    x = R * longitude
    y = 2R * sin(latitude)
    
    Projection: Regular skymap
    x = longitude
    y = latitude
    if (orbital_angle>Math.PI) {  
      moon_latitude = Math.PI/2-orbital_angle;
      moon_longitude = 3*Math.PI/2;
    } else {
      moon_latitude = orbital_angle-3*Math.PI/2;
      moon_longitude = Math.PI/2;
    }
    moonx = moon_longitude;
    moony = moon_latitude;
    
     */
    //orbital_angle2 = ((2*Math.PI * (time/moon_list[i].orbit_period())+moon_list[i].phase))

    
    var xpos_tmp = moon_list[i].orbit_radius * Math.cos(orbital_angle2)
    var ypos_tmp = moon_list[i].orbit_radius * Math.sin(orbital_angle2)
    
    var angle_output
    angle_output = xypos_lat_to_spherical(xpos_tmp,ypos_tmp,view_lat)
    moonx = angle_output[1]
    moony = angle_output[0]
    if (moonx < 0) {
      moonx = moonx+2*Math.PI
    }

    moon_sky_ids[i].style.bottom = ymin_sky
      + moony * skyangle2px
      - moon_size_multiplier *moon_list[i].apparent_size() * skyangle2px/2 
      + 'px';
    moon_sky_overlay_ids[i].style.bottom = ymin_sky
      + moony * skyangle2px
      - moon_size_multiplier *moon_list[i].apparent_size() * skyangle2px/2 
      + 'px';
    moon_sky_underlay_ids[i].style.bottom = ymin_sky
      + moony * skyangle2px
      - moon_size_multiplier *moon_list[i].apparent_size() * skyangle2px/2 
      + 'px';

    // Set the xloc dependent on angle
    moon_sky_overlay_ids[i].style.left = xmin_sky 
      + moonx * skyangle2px
      - overlay_apparent_width * skyangle2px/2 
      + 'px';
    moon_sky_underlay_ids[i].style.left = xmin_sky 
      + moonx * skyangle2px
      - moon_size_multiplier *moon_list[i].apparent_size() * skyangle2px/2 
      + 'px';
    
    
    if (orbital_angle > Math.PI) {
      // Main on the right
      moon_sky_ids[i].style.left = xmin_sky 
        + moonx * skyangle2px
        + 'px';
      
      moon_sky_ids[i].style.borderTopRightRadius = moon_size_multiplier *moon_list[i].apparent_size() * skyangle2px + 'px';
      moon_sky_ids[i].style.borderBottomRightRadius = moon_size_multiplier *moon_list[i].apparent_size() * skyangle2px + 'px';
      moon_sky_ids[i].style.borderTopLeftRadius = '0px';
      moon_sky_ids[i].style.borderBottomLeftRadius = '0px';
      if ((orbital_angle < Math.PI/2) || (orbital_angle > 3*Math.PI/2)) {
        moon_sky_overlay_ids[i].style.backgroundColor = sky_color
      } else {
        moon_sky_overlay_ids[i].style.backgroundColor = moon_list[i].color
      }
    } else {
      // Main on the left
      moon_sky_ids[i].style.left = xmin_sky 
        + moonx * skyangle2px
        - moon_size_multiplier *moon_list[i].apparent_size()/2 * skyangle2px  
        + 'px';
      moon_sky_ids[i].style.borderTopRightRadius = '0px';
      moon_sky_ids[i].style.borderBottomRightRadius = '0px';
      moon_sky_ids[i].style.borderTopLeftRadius = moon_size_multiplier *moon_list[i].apparent_size() * skyangle2px + 'px';
      moon_sky_ids[i].style.borderBottomLeftRadius = moon_size_multiplier *moon_list[i].apparent_size() * skyangle2px + 'px';
      if ((orbital_angle < Math.PI/2) || (orbital_angle > 3*Math.PI/2)) {
        moon_sky_overlay_ids[i].style.backgroundColor = sky_color
      } else {
        moon_sky_overlay_ids[i].style.backgroundColor = moon_list[i].color
      }
    }
  } // End sky plot
  
} // End rendering function

// Finish the initialisation by running render_at_time for t0, time zone TMT+0
render_at_time(t0)

/*
===========================
Time update function
===========================
*/
function move() {
  // Advance the time, set the timer text
  time = time + dt;
  render_at_time(time);
}

/*
===========================
Functions and listeners for time control buttons
===========================
*/
var startstop = function() {
  if (document.getElementById('startstop').innerHTML == "Start") {
    moveMoon = setInterval(move, 10);
    document.getElementById('startstop').innerHTML = "Stop"
  } else {
    clearInterval(moveMoon);
    document.getElementById('startstop').innerHTML = "Start"
  }
}

var reset = function() {
  // Reset the interval time variables
  clearInterval(moveMoon);
  time = t0;
  dt = dt0;
  // Re-render the plot at the reset time
  render_at_time(time);
  // Put the buttons back to base state
  document.getElementById('startstop').innerHTML = "Start"
  document.getElementById('reverse').innerHTML = "Reverse"
}

var faster = function() {
  dt = dt*2;
}
var slower = function() {
  dt = dt/2;
}

var reverse = function() {
  dt = -dt;
  if (dt < 0) {
    document.getElementById('reverse').innerHTML = "Forwards"
  } else {
    document.getElementById('reverse').innerHTML = "Reverse"
  }
}

var settime = function() {
  /*
  let newtime = prompt("Please enter a time \(seconds since 1 Zarantyr 1 YK, 00:00:00\):", time);
  let timenum = t0;
  if (newtime == null || isNaN(parseFloat(newtime))) {
    timenum = time;
  } else {
    timenum = parseFloat(newtime);
  }
  time = timenum
  render_at_time(time)
  */
  
  clearInterval(moveMoon);
  document.getElementById('startstop').innerHTML = "Start"
  
  timeobj = get_timeobj(time);
  document.getElementById("day_set").value = timeobj.day
  document.getElementById("month_set").value = timeobj.month_str
  document.getElementById("year_set").value = timeobj.year
  
  hours_now = timeobj.hours
  mins_now = timeobj.mins
  timestr_now = hours_now.toString().padStart(2,'0') + ':' + mins_now.toString().padStart(2,'0')
  
  document.getElementById("clock_set").value =  timestr_now
}

var settime_confirm_button = document.getElementById('settime_confirm');                            
var settime_confirm = function() {
 
  let day = document.getElementById("day_set").value
  let month = document.getElementById("month_set").value
  let year = document.getElementById("year_set").value
  let clock = document.getElementById("clock_set").value
  let min = clock.slice(-2)
  let hour = clock.slice(0,2)
  
  time = gen_timestr_eberron(0,min,hour,day,month,year)
  time_zone = Number(document.getElementById("time_zone_set").value)
  render_at_time(time)
}

// Button listeners
startstop_button.addEventListener('click', startstop);
reset_button.addEventListener('click', reset);
faster_button.addEventListener('click', faster);
slower_button.addEventListener('click', slower);
reverse_button.addEventListener('click', reverse);
settime_button.addEventListener('click', settime);
settime_confirm_button.addEventListener('click', settime_confirm);

/*
===========================
Functions and listeners for name display checkboxes
===========================
*/
function nameset_orbits() {
  // Get the checkbox
  var checkBox = document.getElementById("namesorbits");
  
  // If the checkbox is checked, display the output text
  if (checkBox.checked == true){
    // Turn on the labels
    for (let i = 0; i < moon_css_ids.length; i++) {
      moon_css_ids[i].innerHTML = '<sub>'+moon_list[i].name+'</sub>';
    }
  } else {
    // Turn off the labels
    for (let i = 0; i < moon_phase_ids.length; i++) {
      moon_css_ids[i].innerHTML = '';
    }
  }
}

function nameset_phases() {
  // Get the checkbox
  var checkBox = document.getElementById("namesphases");
  // If the checkbox is checked, display the output text
  if (checkBox.checked == true){
    // Turn on the labels
    for (let i = 0; i < moon_phase_overlay_ids.length; i++) {
      moon_phase_overlay_ids[i].innerHTML = '<span style="display:flex;justify-content: center;align-items: center;"><sub>'+moon_list[i].name+'</sub></span>';
      moon_phase_overlay_ids[i].style.textAlign = 'center';
    }
  } else {
    // Turn off the labels
    for (let i = 0; i < moon_phase_overlay_ids.length; i++) {
      moon_phase_overlay_ids[i].innerHTML = '';
    }
  }
}

function nameset_sky() {
  // Get the checkbox
  var checkBox = document.getElementById("namessky");
  
  // If the checkbox is checked, display the output text
  if (checkBox.checked == true){
    // Turn on the labels
    for (let i = 0; i < moon_sky_underlay_ids.length; i++) {
      moon_sky_underlay_ids[i].innerHTML = '<sub>'+moon_list[i].name+'</sub>';
    }
  } else {
    // Turn off the labels
    for (let i = 0; i < moon_sky_underlay_ids.length; i++) {
      moon_sky_underlay_ids[i].innerHTML = '';
    }
  }
}

namecheck_orbits.addEventListener('click', nameset_orbits);
namecheck_phases.addEventListener('click', nameset_phases);
namecheck_sky.addEventListener('click', nameset_sky);
