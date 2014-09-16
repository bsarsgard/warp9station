// Declare game object
var Game = {
// game variables
name: "",
power: 0,
weapons: 0,
life: 0,
map: [[]],
crew: [],
recruits: [],
cargo: [],
market: [],
canvas: null,
offset_x: 1,
offset_y: 1,
spacing: 5,
scale: 1.0,
tile_wide: 55,
tile_high: 55,
mx: null,
my: null,
mdown: false,
mdrag: false,
selected: {x:0,y:0},
alert_level_id: 0,

AlertLevels: [
  {
    id: 0,
    name: "Green",
    threshold: 50,
  },
  {
    id: 1,
    name: "Yellow",
    threshold: 0,
  },
  {
    id: 2,
    name: "Red",
    threshold: -1,
  },
],
Goods: [
  {
    id: 0,
    name: "Credits",
    base: 1,
  },
  {
    id: 1,
    name: "Food",
    base: 20,
  },
  {
    id: 2,
    name: "Minerals",
    base: 50,
  },
  {
    id: 3,
    name: "Fuel",
    base: 100,
  },
  {
    id: 4,
    name: "Medicine",
    base: 100,
  },
  {
    id: 5,
    name: "Cotraband",
    base: 200,
  },
  {
    id: 6,
    name: "Luxuries",
    base: 500,
  },
],
Roles: [
  {
    id: 0,
    name: "Civilian",
    max: null,
    salary: 1,
    bonus: null,
  },
  {
    id: 1,
    name: "Command",
    max: null,
    salary: 5,
    bonus: null,
  },
  {
    id: 2,
    name: "Operations",
    max: null,
    salary: 3,
    bonus: null,
  },
  {
    id: 3,
    name: "Science",
    max: null,
    salary: 4,
    bonus: null,
  },
  {
    id: 4,
    name: "Security",
    max: null,
    salary: 2,
    bonus: null,
  },
  {
    id: 5,
    name: "Captain",
    max: 1,
    salary: 6,
    bonus: 1,
  }
],
Modules: [
  {
    id: 0,
    name: "Empty",
    tip: "Click to add a module",
    fillStyle: "rgba(0, 0, 0, 0.2)",
    strokeStyle: "#000",
    enables: [],
    roles: [],
    skill: null,
    is_corridor: false,
    is_airlock: false,
    sleep: 0,
    health: 0,
    morale: 0,
    power: 0,
    weapons: 0,
    life: 0,
  },
  {
    id: 1,
    name: "Airlock",
    tip: "Click to select",
    fillStyle: "#339",
    strokeStyle: "#44a",
    enables: [],
    roles: [],
    skill: null,
    is_corridor: true,
    is_airlock: true,
    sleep: 0,
    health: 0,
    morale: 0,
    power: 0,
    weapons: 0,
    life: 0,
  },
  {
    id: 2,
    name: "Corridor",
    tip: "Click to select",
    fillStyle: "#aaa",
    strokeStyle: "#333",
    enables: [],
    roles: [],
    skill: null,
    is_corridor: true,
    is_airlock: false,
    sleep: 0,
    health: 0,
    morale: 0,
    power: 0,
    weapons: 0,
    life: 0,
  },
  {
    id: 3,
    name: "Bridge",
    tip: "Click to select",
    fillStyle: "#f66",
    strokeStyle: "#f99",
    enables: [12,13,14],
    roles: [1,5],
    skill: null,
    is_corridor: false,
    is_airlock: false,
    sleep: 0,
    health: 0,
    morale: 0,
    power: 0,
    weapons: 0,
    life: 0,
  },
  {
    id: 4,
    name: "Engineering",
    tip: "Click to select",
    fillStyle: "#33e",
    strokeStyle: "#44f",
    enables: [12],
    roles: [0,2],
    skill: null,
    is_corridor: false,
    is_airlock: false,
    sleep: 0,
    health: 0,
    morale: 0,
    power: 0,
    weapons: 0,
    life: 0,
  },
  {
    id: 5,
    name: "Tactical",
    tip: "Click to select",
    fillStyle: "#999",
    strokeStyle: "#aaa",
    enables: [13],
    roles: [0,2],
    skill: null,
    is_corridor: false,
    is_airlock: false,
    sleep: 0,
    health: 0,
    morale: 0,
    power: 0,
    weapons: 0,
    life: 0,
  },
  {
    id: 6,
    name: "Atmosphere",
    tip: "Click to select",
    fillStyle: "#999",
    strokeStyle: "#aaa",
    enables: [14],
    roles: [0,2],
    skill: null,
    is_corridor: false,
    is_airlock: false,
    sleep: 0,
    health: 0,
    morale: 0,
    power: 0,
    weapons: 0,
    life: 0,
  },
  {
    id: 7,
    name: "Cargo Bay",
    tip: "Click to select",
    fillStyle: "#999",
    strokeStyle: "#aaa",
    enables: [],
    roles: [],
    skill: null,
    is_corridor: false,
    is_airlock: false,
    sleep: 0,
    health: 0,
    morale: 0,
    power: 0,
    weapons: 0,
    life: 0,
  },
  {
    id: 8,
    name: "Quarters",
    tip: "Click to select",
    fillStyle: "#999",
    strokeStyle: "#aaa",
    enables: [],
    roles: [],
    skill: null,
    is_corridor: false,
    is_airlock: false,
    sleep: 1,
    health: 1,
    morale: 1,
    power: 0,
    weapons: 0,
    life: -1,
  },
  {
    id: 9,
    name: "Sick Bay",
    tip: "Click to select",
    fillStyle: "#999",
    strokeStyle: "#aaa",
    enables: [],
    roles: [0,3],
    skill: null,
    is_corridor: false,
    is_airlock: false,
    sleep: 0,
    health: 5,
    morale: 0,
    power: 0,
    weapons: 0,
    life: -1,
  },
  {
    id: 10,
    name: "Science Lab",
    tip: "Click to select",
    fillStyle: "#999",
    strokeStyle: "#aaa",
    enables: [],
    roles: [0,3],
    skill: null,
    is_corridor: false,
    is_airlock: false,
    sleep: 0,
    health: 0,
    morale: 0,
    power: 0,
    weapons: 0,
    life: 0,
  },
  {
    id: 11,
    name: "Holodeck",
    tip: "Click to select",
    fillStyle: "#999",
    strokeStyle: "#aaa",
    enables: [],
    roles: [0],
    skill: null,
    is_corridor: false,
    is_airlock: false,
    sleep: 0,
    health: 0,
    morale: 5,
    power: -1,
    weapons: 0,
    life: 0,
  },
  {
    id: 12,
    name: "Reactor",
    tip: "Click to select",
    fillStyle: "#999",
    strokeStyle: "#aaa",
    enables: [],
    roles: [],
    skill: "Reactor",
    is_corridor: false,
    is_airlock: false,
    sleep: 0,
    health: 0,
    morale: 0,
    power: 10.0,
    weapons: 0,
    life: 0,
  },
  {
    id: 13,
    name: "Weapon",
    tip: "Click to select",
    fillStyle: "#999",
    strokeStyle: "#aaa",
    enables: [],
    roles: [],
    skill: "Weapons",
    is_corridor: false,
    is_airlock: false,
    sleep: 0,
    health: 0,
    morale: 0,
    power: -1,
    weapons: 10.0,
    life: 0,
  },
  {
    id: 14,
    name: "Life Support",
    tip: "Click to select",
    fillStyle: "#999",
    strokeStyle: "#aaa",
    enables: [],
    roles: [],
    skill: "Life Support",
    is_corridor: false,
    is_corridor: false,
    is_airlock: false,
    sleep: 0,
    health: 0,
    morale: 0,
    power: -1,
    weapons: 0,
    life: 10.0,
  },
],

// game functions
init: function(canvas) {
	$.cookie.json = true;
  this.load();
  canvas.width = canvas.parentNode.clientWidth;
  canvas.height = canvas.parentNode.clientHeight;
  this.canvas = canvas;
  this.offset_x = canvas.width / 2 - (this.map[0].length * this.tile_wide / 2);
  this.offset_y = canvas.height / 2 - (this.map.length * this.tile_high / 2);
  this.img_bg = new Image();
  this.img_bg.src = '/media/img/warp9/bg_1_1.png';

  this.draw();
  canvas.addEventListener('mousedown', function(evt) {
    Game.mdown = true;
  }, false);
  canvas.addEventListener('mouseup', function(evt) {
    Game.mdown = false;
    if (Game.mdrag) {
      Game.mdrag = false;
    } else {
      Game.doClick();
    }
  }, false);
  canvas.addEventListener('mousemove', function(evt) {
    var rect = canvas.getBoundingClientRect();
    var mx = (evt.clientX-rect.left)/(rect.right-rect.left)*canvas.width;
    var my = (evt.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height;
    if (Game.mdown) {
      Game.mdrag = true;
      Game.offset_x += mx - Game.mx;
      Game.offset_y += my - Game.my;
    }
    Game.mx = mx;
    Game.my = my;
    Game.draw();
  }, false);
  this.tick();
},
doClick: function() {
  var cell = Game.getCellAt(Game.mx, Game.my);
  var module = null;
  try {
    module = Game.Modules[Game.map[cell.y][cell.x].module_id];
  } catch(ex) {}
  if (module != null) {
    if (module.id == 0) {
      Game.addModule(cell.x, cell.y);
    } else {
      // select module
      Game.selectModule(cell.x, cell.y);
    }
  }
},
tick: function() {
  Game.save();
  Game.updateMarket();
  Game.updateModules();
  Game.updateRecruits();
  Game.updateCrew();
  Game.updateStatus();
  Game.updateSelected();
	setTimeout(Game.tick, 1000);
},
updateStatus: function() {
  var powerDemand = 0;
  var powerSupply = 0;
  var weaponsDemand = 0;
  var weaponsSupply = 0;
  var lifeDemand = 0;
  var lifeSupply = 0;

  var counts = {};
  var skills = {};

  // first let's count our modules
  for (var yy = 0; yy < this.map.length; yy++) {
    for (var xx = 0; xx < this.map[yy].length; xx++) {
      if (this.map[yy][xx].on) {
        var map = this.map[yy][xx];
        var module = this.Modules[map.module_id];
        for (var ii = 0; ii < module.enables.length; ii++) {
          if (module.enables.length == 1) {
            // only single-use modules contribute to count
            if (counts[module.enables[ii]] === undefined) {
              counts[module.enables[ii]] = 1;
            } else {
              counts[module.enables[ii]] += 1;
            }
          }
          // all modules enable skills
          if (skills[module.enables[ii]] === undefined) {
            skills[module.enables[ii]] = [];
          }
          for (var jj = 0; jj < map.crew.length; jj++) {
            skills[module.enables[ii]].push(Math.log(this.crew[map.crew[jj]].skills[module.enables[ii]]));
          }
        }
      }
    }
  }
  // now we can get the stats
  for (var yy = 0; yy < this.map.length; yy++) {
    for (var xx = 0; xx < this.map[yy].length; xx++) {
      var map = this.map[yy][xx];
      var module = this.Modules[map.module_id];
      var ct = counts[module.id] === undefined ? 0 : counts[module.id];
      var sk = 0;
      if (skills[module.id] !== undefined && skills[module.id].length > 0) {
        sk = skills[module.id].reduce(function(a, b) { return a + b });
        sk = Math.round(sk / skills[module.id].length);
      }
      map.efficiency = (this.getEfficiency(ct) + this.getEfficiency(sk)) / 2;
      if (module.power > 0) {
        // power supplier
        powerSupply += Math.round(module.power * map.efficiency);
      } else {
        powerDemand -= module.power;
      }
      if (module.weapons > 0) {
        // weapons supplier
        weaponsSupply += Math.round(module.weapons * map.efficiency);
      } else {
        weaponsDemand -= module.weapons;
      }
      if (module.life > 0) {
        // life supplier
        lifeSupply += Math.round(module.life * map.efficiency);
      } else {
        lifeDemand -= module.life;
      }
    }
  }
  this.power = powerSupply - powerDemand;
  if (this.power > 0) {
    this.weapons = weaponsSupply - weaponsDemand;
    this.life = lifeSupply - lifeDemand;
  } else {
    // without power, no other systems can operate
    this.weapons = 0;
    this.life = 0;
  }
  $(".status-power").text(this.power);
  $(".status-weapons").text(this.weapons);
  $(".status-life").text(this.life);
},
updateSelected: function() {
  var map = this.map[this.selected.y][this.selected.x];
  var module = this.Modules[map.module_id];
  var cls = map.on ? "success" : "default";
  var html = '<div class="panel panel-' + cls + '"><div class="panel-heading">' + module.name + '</div><div class="panel-body">';
  if (module.power > 0 || module.weapons > 0 || module.life > 0) {
    html += '<div class="progress"><div class="progress-bar" style="width: ' + Math.round(map.efficiency * 100.0) + '%;">' + (Math.round(map.efficiency * 100000.0) / 1000.0) + '%</div></div>';
  }
  html += '<div class="list-group">';
  for (var ii = 0; ii < map.crew.length; ii++) {
    html += '<a class="list-group-item" href="#crew">' + this.crew[map.crew[ii]].name + '</a>';
  }
  html += '</div>';
  html += '<button class="btn btn-danger" id="btn-remove-module">Remove Module</button>';
  $("#div-details").html(html);
  $("#btn-remove-module").click({
    xx: this.selected.x,
    yy: this.selected.y,
  }, Game.removeModule);
},
updateModules: function() {
  for (var yy = 0; yy < this.map.length; yy++) {
    for (var xx = 0; xx < this.map[yy].length; xx++) {
      this.map[yy][xx].on = false;
    }
  }
},
updateRecruits: function() {
  var html = "";
  // add a new recruit
  if (Math.random() * Math.pow(this.recruits.length, 10) < 1) {
    var recruit = {
      id: 0,
      name: getrandomname(),
      skills: {},
    };
    // set skills
    for (var ii = 0; ii < this.Modules.length; ii++) {
      if (this.Modules[ii].skill === null) {
        continue;
      }
      var sk = 0;
      if (Math.random() * 3 < 1) {
        sk = 1;
        while (Math.random() * 10 > 1) {
          sk += 1;
        }
        recruit.skills[ii] = Math.pow(sk, Math.E) + 1;
      }
    }
    this.recruits.push(recruit);
  }
  // display table
  for (var ii = 0; ii < this.recruits.length; ii++) {
    var recruit = this.recruits[ii];
    html += '<tr><td>' + recruit.name + '</td><td>';
    for (var skill_id in recruit.skills) {
      html += this.Modules[skill_id].name + ': ' + Math.round(Math.log(recruit.skills[skill_id])) + '<br/>';
    }
    html += '</td><td><div class="btn-group pull-right"><a href="#" id="btn-recruits-hire-' + ii + '" class="btn btn-success">Hire</a><a href="#" id="btn-recruits-dismiss-' + ii + '" class="btn btn-warning">Dismiss</a></div></td></tr>';
  }
  $(".tbl-recruits-body").html(html);
  for (var ii = 0; ii < this.recruits.length; ii++) {
    $("#btn-recruits-hire-" + ii).click({
      id: ii,
    }, Game.hireRecruit);
    $("#btn-recruits-dismiss-" + ii).click({
      id: ii,
    }, Game.dismissRecruit);
  }
},
updateCrew: function() {
  var html = "";
  for (var ii = 0; ii < this.crew.length; ii++) {
    var crew = this.crew[ii];
    var role = this.Roles[crew.role_id];
    var map = this.map[this.crew[ii].loc.y][this.crew[ii].loc.x];
    var module = this.Modules[map.module_id];
    var alert_level = this.AlertLevels[this.alert_level_id];
    if (!map.on && module.roles.indexOf(role.id) != -1 && crew.sleep > alert_level.threshold && crew.morale > alert_level.threshold && crew.health > alert_level.threshold) {
      // work it
      map.on = true;
      if (crew.sleep > 0) {
        crew.sleep -= 1;
      }
      if (crew.morale > 0) {
        crew.morale -= 1;
      }
      // boost skill
      for (var jj = 0; jj < module.enables.length; jj++) {
        if (crew.skills[module.enables[jj]] === undefined) {
          crew.skills[module.enables[jj]] = 1;
        } else {
          crew.skills[module.enables[jj]] += 0.1 / Math.pow(module.enables.length, 2);
        }
      }
    } else {
      // see if there's any benefits
      if (this.life >= 0 && module.health > 0 && crew.health < 100) {
        // stay here and satisfy needs
        crew.health += module.health;
      } else if (this.life >= 0 && alert_level.threshold >= 0 && module.sleep > 0 && crew.sleep < 100) {
        // stay here and satisfy needs
        crew.sleep += module.sleep;
      } else if (this.life >= 0 && alert_level.threshold >= 0 && module.morale > 0 && crew.morale < 100) {
        // stay here and satisfy needs
        crew.morale += module.morale;
      } else if (this.life < 0 || alert_level.threshold < 0 || (crew.sleep >= 100 && crew.health >= 100 && crew.morale >= 100)) {
        // find some work
        var found = false;
        donefindwork:
        for (var yy = 0; yy < this.map.length; yy++) {
          for (var xx = 0; xx < this.map[yy].length; xx++) {
            if (this.map[yy][xx].crew.length == 0 && this.Modules[this.map[yy][xx].module_id].roles.indexOf(role.id) != -1) {
              map.crew.splice(map.crew.indexOf(crew.id), 1);
              crew.loc.x = xx;
              crew.loc.y = yy;
              this.map[yy][xx].crew.push(crew.id);
              found = true;
              break donefindwork;
            }
          }
        }
        doneworknotfound:
        if (!found) {
          // see if there's a corridor to hang out in
          for (var yy = 0; yy < this.map.length; yy++) {
            for (var xx = 0; xx < this.map[yy].length; xx++) {
              if (this.map[yy][xx].crew.length == 0 && this.Modules[this.map[yy][xx].module_id].is_corridor) {
                map.crew.splice(map.crew.indexOf(crew.id), 1);
                crew.loc.x = xx;
                crew.loc.y = yy;
                this.map[yy][xx].crew.push(crew.id);
                break doneworknotfound;
              }
            }
          }
        }
      } else {
        // find some R&R
        var found = false;
        donefindrr:
        for (var yy = 0; yy < this.map.length; yy++) {
          for (var xx = 0; xx < this.map[yy].length; xx++) {
            var m = this.Modules[this.map[yy][xx].module_id];
            if (this.map[yy][xx].crew.length == 0 && (m.sleep > 0 && crew.sleep < 100) || (m.health > 0 && crew.health < 100) && (m.morale > 0 && crew.morale < 100)) {
              map.crew.splice(map.crew.indexOf(crew.id), 1);
              crew.loc.x = xx;
              crew.loc.y = yy;
              this.map[yy][xx].crew.push(crew.id);
              found = true;
              break donefindrr;
            }
          }
        }
        donerrnotfound:
        if (!found) {
          // see if there's a corridor to hang out in
          for (var yy = 0; yy < this.map.length; yy++) {
            for (var xx = 0; xx < this.map[yy].length; xx++) {
              if (this.map[yy][xx].crew.length == 0 && this.Modules[this.map[yy][xx].module_id].is_corridor) {
                map.crew.splice(map.crew.indexOf(crew.id), 1);
                crew.loc.x = xx;
                crew.loc.y = yy;
                this.map[yy][xx].crew.push(crew.id);
                break donerrnotfound;
              }
            }
          }
        }
      }
    }
    // calculate salary
    crew.salary = 0;
    for (var skill_id in crew.skills) {
      crew.salary += Math.log(crew.skills[skill_id]);
    }
    crew.salary *= role.salary;
    html += '<tr id="tr-crew-' + crew.id + '"><td>' + crew.name + '</td><td>' + role.name + '</td><td>' + Math.round(crew.salary) + '</td><td>' + module.name + '</td><td>' + crew.sleep + '</td><td>' + crew.health + '</td><td>' + crew.morale + '</td><td>';
    for (var skill_id in crew.skills) {
      html += this.Modules[skill_id].name + ': ' + Math.round(Math.log(crew.skills[skill_id])) + '<br/>';
    }
    html += '</td></tr>';
  }
  $(".tbl-crew-body").html(html);
  for (var ii = 0; ii < this.crew.length; ii++) {
    $('#tr-crew-' + ii).click({ id: ii }, function(evt) {
      var crew = Game.crew[evt.data.id];
      var html = '<select id="sel-crew-role" class="form-control" data-crew="' + evt.data.id + '">';
      for (var jj = 0; jj < Game.Roles.length; jj++) {
        html += '<option value="' + jj + '"';
        if (crew.role_id == jj) {
          html += ' selected="selected"';
        }
        html += '>' + Game.Roles[jj].name + '</option>';
      }
      html += '</select>';
      html += '<a id="btn-crew-fire" class="form-control btn btn-danger" data-crew="' + evt.data.id + '" href="#">Fire</a>';
      Game.showModal(crew.name, html, function(evt) {
        Game.crew[$('#sel-crew-role').data('crew')].role_id = $('#sel-crew-role').val();
        Game.hideModal();
      });
      $('#btn-crew-fire').click(function(evt) {
        evt.preventDefault();
        var crew_id = $('#btn-crew-fire').data('crew');
        var crew = Game.crew[crew_id];
        var map = Game.map[crew.loc.y][crew.loc.x];
        map.crew.splice(map.crew.indexOf(crew.id), 1);
        Game.crew.splice(crew.id, 1);
        Game.hideModal();
      });
    });
  }
},
updateMarket: function() {
  var html = "";
  for (var ii = 1; ii < this.Goods.length; ii++) {
    this.market[ii] += this.market[ii] * (Math.random() - 0.5) / 100.0;
    html += '<tr><td>' + this.Goods[ii].name + '</td><td>$' + (Math.round(this.market[ii] * 100.0) / 100.0) + '</td><td>' + this.cargo[ii] + '</td></tr>';
  }
  $(".tbl-market-body").html(html);
},
draw: function() {
  context = this.canvas.getContext("2d");
  // clear
  context.fillStyle = "#111";
  context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  context.drawImage(this.img_bg, 0, 0, this.canvas.width, this.canvas.height);

  // draw modules
  for (var yy = 0; yy < this.map.length; yy++) {
    for (var xx = 0; xx < this.map[yy].length; xx++) {
      var x = this.offset_x + (((this.tile_wide + this.spacing) * xx) * this.scale);
      var y = this.offset_y + (((this.tile_high + this.spacing) * yy) * this.scale);
      var w = this.tile_wide * this.scale;
      var h = this.tile_high * this.scale;
      var module = this.Modules[this.map[yy][xx].module_id];
      try {
        context.fillStyle = module.fillStyle;
        context.strokeStyle = module.strokeStyle;
        context.fillRect(x, y, w, h);
        context.lineWidth = 3;
        context.strokeRect(x, y, w, h);
        context.fillStyle = "#000";
        context.lineWidth = 1;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "bold 10px sans-serif";
        context.fillText(module.name, x + (this.tile_wide / 2), y + (this.tile_high / 2));
      } catch (ex) {}
    }
  }
  // tooltip
  if (this.mx != null && this.my != null) {
    var cell = this.getCellAt(this.mx, this.my);
    var module = null;
    try {
      module = this.Modules[this.map[cell.y][cell.x].module_id];
    } catch(ex) {}
    if (module != null && module.tip != null) {
      context.fillStyle = "#fff";
      context.textAlign = "left";
      context.textBaseline = "top";
      context.fillText(module.tip, this.mx + 10, this.my + 20);
    }
  }
},
setAlertLevel: function(alert_level_id) {
  this.alert_level_id = alert_level_id;
},
setMap: function(xx, yy, module_id) {
  this.map[yy][xx].module_id = module_id;
  if (yy == 0) {
    // add new top row
    var row = [];
    for (var ii = 0; ii < this.map[0].length; ii++) {
      row.push({module_id: 0, crew: []});
    }
    this.map.splice(0, 0, row);
    this.offset_y -= this.tile_high + this.spacing;
    yy += 1;
    for (var ii = 0; ii < this.crew.length; ii++) {
      this.crew[ii].loc.y += 1;
    }
  }
  if (yy == this.map.length - 1) {
    // add new bottom row
    var row = [];
    for (var ii = 0; ii < this.map[0].length; ii++) {
      row.push({module_id: 0, crew: []});
    }
    this.map.push(row);
  }
  if (xx == 0) {
    // add new left column
    for (var ii = 0; ii < this.map.length; ii++) {
      this.map[ii].splice(0, 0, {module_id: 0, crew: []});
    }
    this.offset_x -= this.tile_wide + this.spacing;
    xx += 1;
    for (var ii = 0; ii < this.crew.length; ii++) {
      this.crew[ii].loc.x += 1;
    }
  }
  if (xx == this.map[0].length - 1) {
    // add new right column
    for (var ii = 0; ii < this.map.length; ii++) {
      this.map[ii].push({module_id: 0, crew: []});
    }
  }
},
addModule: function(xx, yy) {
  // space, allow add module
  var html = '<select id="sel-module" class="form-control">';
  for (var ii = 1; ii < Game.Modules.length; ii++) {
    // check module elegibility
    var allow = Game.Modules[ii].is_airlock;
    for (var neighbor_y = Math.max(0, yy - 1); neighbor_y <= Math.min(Game.map.length - 1, yy + 1); neighbor_y++) {
      if (Game.map[neighbor_y][xx].module_id == ii || Game.Modules[Game.map[neighbor_y][xx].module_id].is_corridor) {
        allow = true;
      }
    }
    for (var neighbor_x = Math.max(0, xx - 1); neighbor_x <= Math.min(Game.map[0].length - 1, xx + 1); neighbor_x++) {
      if (Game.map[yy][neighbor_x].module_id == ii || Game.Modules[Game.map[yy][neighbor_x].module_id].is_corridor) {
        allow = true;
      }
    }
    if (allow) {
      html += '<option value="' + ii + '">' + Game.Modules[ii].name + '</option>';
    }
  }
  html += '</select>';
  Game.showModal("Add module", html, function(evt) {
    var module = $("#sel-module").val();
    if (module != 0) {
      Game.setMap(xx, yy, module);
    }
  
    Game.hideModal();
    Game.draw();
  });
},
hireRecruit: function(evt) {
  evt.preventDefault();
  var recruit = Game.recruits.splice(evt.data.id, 1).pop();
  recruit.health = 100;
  recruit.sleep = 100;
  recruit.morale = 100;
  recruit.role_id = 0;
  recruit.loc = {x: 0, y: 0};
  recruit.id = Game.crew.length;

  donefindairlock:
  for (var yy = 0; yy < Game.map.length; yy++) {
    for (var xx = 0; xx < Game.map[yy].length; xx++) {
      if (Game.Modules[Game.map[yy][xx].module_id].is_airlock) {
        recruit.loc.x = xx;
        recruit.loc.y = yy;
        Game.map[yy][xx].crew.push(recruit.id);
        break donefindairlock;
      }
    }
  }
  Game.crew.push(recruit);
  Game.updateRecruits();
},
dismissRecruit: function(evt) {
  evt.preventDefault();
  Game.recruits.splice(evt.data.id, 1);
  Game.updateRecruits();
},
removeModule: function(evt) {
  Game.map[evt.data.yy][evt.data.xx].module_id = 0;
  $("#div-details").html("");
  Game.draw();
},
selectModule: function(xx, yy) {
  this.selected.x = xx;
  this.selected.y = yy;
  this.updateSelected();
},             

// serialization
save: function() {
  $.cookie('warp9-map', this.map, { expires: 365 });
  $.cookie('warp9-market', this.market, { expires: 365 });
  $.cookie('warp9-cargo', this.cargo, { expires: 365 });
  $.cookie('warp9-crew', this.crew, { expires: 365 });
  $.cookie('warp9-recruits', this.recruits, { expires: 365 });
  this.load();
},
load: function() {
  if ($.cookie('warp9-map') !== undefined) {
    this.map = $.cookie('warp9-map');
  } else {
    this.reset();
  }
  if ($.cookie('warp9-market') !== undefined) {
    this.market = $.cookie('warp9-market');
  }
  if ($.cookie('warp9-cargo') !== undefined) {
    this.cargo = $.cookie('warp9-cargo');
  }
  if ($.cookie('warp9-crew') !== undefined) {
    this.crew = $.cookie('warp9-crew');
  }
  if ($.cookie('warp9-recruits') !== undefined) {
    this.recruits = $.cookie('warp9-recruits');
  }
},
reset: function() {
  // initialize map
  this.map = [
    [{module_id: 0, crew: []},{module_id: 0, crew: []},{module_id: 0, crew: []}],
    [{module_id: 0, crew: []},{module_id: 1, crew: []},{module_id: 0, crew: []}],
    [{module_id: 0, crew: []},{module_id: 0, crew: []},{module_id: 0, crew: []}],
  ];
  // set starting credits
  this.cargo = [1000];
  // set the market
  for (var ii = 1; ii < this.Goods.length; ii++) {
    this.cargo[ii] = 0;
    this.market[ii] = this.Goods[ii].base;
  }
  // set the starting crew
  this.crew = [{
    id: 0,
    name: getrandomname(),
    role_id: 0,
    loc: {x:1,y:1},
    skills: {},
    sleep: 100,
    health: 100,
    morale: 100,
  }];
  this.map[1][1].crew.push(this.crew[0].id);
  this.recruits = [];
  this.save();
  this.selected = {x:0,y:0};
  this.offset_x = this.canvas.width / 2 - (this.map[0].length * this.tile_wide / 2);
  this.offset_y = this.canvas.height / 2 - (this.map.length * this.tile_high / 2);
  this.draw();
},

// utility functions
getEfficiency: function(rank) {
  var base = 0.2;
  var efficiency = base;
  if (rank > 0) {
    efficiency = 1.0 - ((1.0 - base) / Math.pow(2, rank));
  }
  return efficiency;
},
getCellAt: function(xx, yy) {
  var x = Math.floor((xx - this.offset_x) / (this.tile_wide + this.spacing));
  var y = Math.floor((yy - this.offset_y) / (this.tile_high + this.spacing));
  return {x: x, y: y};
},
showModal: function(title, content, callback) {
  var html = '<div id="output-modal" class="modal" tabindex="-1" role="dialog"><div class="modal-dialog modal-sm"><div class="modal-content"><div class="modal-header">' + title + '</div><div class="modal-body">' + content + '</div><div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
  if (callback != null) {
    html += '<button type="button" class="btn btn-primary" id="btn-modal-okay">Okay</button>';
  }
  html += '</div></div></div></div>';
  $("#output").html(html);
  if (callback != null) {
    $("#btn-modal-okay").click(callback);
  }
  $("#output-modal").modal();
},
hideModal: function() {
  $("#output-modal").modal('hide');
},
};
