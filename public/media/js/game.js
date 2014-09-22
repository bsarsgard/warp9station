// Declare game object
var Game = {
station: {},
// game variables
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

// game functions
init: function(canvas) {
	$.cookie.json = true;
  $(".btn-reset").click(function(evt) {
    evt.preventDefault();
    Game.reset();
  });
  canvas.width = canvas.parentNode.clientWidth;
  canvas.height = canvas.parentNode.clientHeight;
  this.canvas = canvas;
  $.getJSON("/game/init/", function(data) {
    Game.AlertLevels = data.alertlevels;
    Game.TradeGoods = data.tradegoods;
    Game.Skills = data.skills;
    Game.Roles = data.roles;
    Game.Modules = data.modules;
    if ($.cookie('warp9-stationid') === undefined) {
      Game.reset();
    } else {
      Game.load();
    }
  });
},
start: function() {
  this.updateAlertLevels();
  this.save();
  this.offset_x = this.canvas.width / 2 - (this.station.stationmap[0].length * this.tile_wide / 2);
  this.offset_y = this.canvas.height / 2 - (this.station.stationmap.length * this.tile_high / 2);
  this.img_bg = new Image();
  this.img_bg.src = '/media/img/warp9/bg_1_1.png';

  this.draw();
  this.canvas.addEventListener('mousedown', function(evt) {
    Game.mdown = true;
  }, false);
  this.canvas.addEventListener('mouseup', function(evt) {
    Game.mdown = false;
    if (Game.mdrag) {
      Game.mdrag = false;
    } else {
      Game.doClick();
    }
  }, false);
  this.canvas.addEventListener('mousemove', function(evt) {
    var rect = Game.canvas.getBoundingClientRect();
    var mx = (evt.clientX-rect.left)/(rect.right-rect.left)*Game.canvas.width;
    var my = (evt.clientY-rect.top)/(rect.bottom-rect.top)*Game.canvas.height;
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
  var coords = Game.getCoordinateAt(Game.mx, Game.my);
  var cell = Game.getCellAt(coords.x, coords.y);
  if (cell == null) {
    Game.addModule(coords.x, coords.y);
  } else {
    var module = Game.Modules[cell.module];
    // select module
    Game.selectModule(coords.x, coords.y);
  }
},
tick: function() {
  Game.turn(function() {
    setTimeout(Game.tick, 5000);
  });
},
turn: function(cb) {
  var data = { "alertlevel": Game.station.alertlevel };
  $.ajax({
    dataType: "json",
    url: "/game/station/" + Game.station.id + "/",
    type: "POST",
    data: JSON.stringify(data),
  }).done(function(data) {
    Game.station = data.station;
    Game.draw();
    Game.updateMarket();
    Game.updateRecruits();
    Game.updateCrew();
    Game.updateStatus();
    Game.updateSelected();
    if (cb !== undefined) {
      cb();
    }
  });
},
updateAlertLevels: function() {
  var html = "";
  for (var alertlevel_id in this.AlertLevels) {
    var alertlevel = this.AlertLevels[alertlevel_id];
    html += '<label class="btn btn-xs btn-alertlevel ' + (alertlevel.id == this.station.alertlevel ? 'active ' : '') + this.AlertLevels[this.station.alertlevel].style + '" id="btn-alertlevel-' + alertlevel.id + '" data-id="' + alertlevel.id + '"><input type="radio" name="options" checked>' + alertlevel.name + '</label>';
  }
  $("#btn-group-alertlevel").html(html);
  for (var alertlevel_id in this.AlertLevels) {
    $('#btn-alertlevel-' + alertlevel_id).click(function(evt) {
      evt.preventDefault();
      Game.setAlertLevel($(this).data('id'));
    });
  }
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
  /*
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
  this.station.power = powerSupply - powerDemand;
  if (this.station.power > 0) {
    this.station.weapons = weaponsSupply - weaponsDemand;
    this.station.life = lifeSupply - lifeDemand;
  } else {
    // without power, no other systems can operate
    this.station.weapons = 0;
    this.station.life = 0;
  }
  */
  $(".status-power").text(this.station.power);
  $(".status-weapons").text(this.station.weapons);
  $(".status-life").text(this.station.life);
},
updateSelected: function() {
  var html = "";
  if (this.station.stationmap[this.selected.y][this.selected.x] !== null) {
    var cell = this.station.stationcells[this.station.stationmap[this.selected.y][this.selected.x]];
    if (cell !== undefined) {
      var module = this.Modules[cell.module];
      var cls = cell.on ? "success" : "default";
      html = '<div class="panel panel-' + cls + '"><div class="panel-heading">' + module.name + '</div><div class="panel-body">';
      if (cell.efficiency > 0) {
        html += '<div class="progress"><div class="progress-bar" style="width: ' + Math.round(cell.efficiency * 100.0) + '%;">' + (Math.round(cell.efficiency * 100000.0) / 1000.0) + '%</div></div>';
      }
      html += '<div class="list-group">';
      for (var ii = 0; ii < cell.crew.length; ii++) {
        html += '<a class="list-group-item" href="#crew">' + this.station.crew[cell.crew[ii]].name + '</a>';
      }
      html += '</div>';
      html += '<button class="btn btn-danger" id="btn-remove-module" data-cellid="' + cell.id + '">Remove Module</button>';
    }
  }
  $("#div-details").html(html);
  $("#btn-remove-module").click(function(evt) {
    evt.preventDefault();
    var cell_id = $("#btn-remove-module").data("cellid");
    var data = { module: null };
    $.ajax({
      dataType: "json",
      url: "/game/station/" + Game.station.id + "/cell/" + cell_id + "/",
      type: "DELETE",
      data: JSON.stringify(data),
      success: function(data) {
        Game.station = data.station;
        Game.draw();
        var coords = Game.getCoordinateAt(Game.mx, Game.my);
        Game.selectModule(coords.x, coords.y);
        Game.updateSelected();
      },
    });
  });
},
updateRecruits: function() {
  var html = "";
  // display table
  for (var person_id in this.station.recruits) {
    var recruit = this.station.recruits[person_id];
    html += '<tr><td>' + recruit.name + '</td><td>';
    for (var skill_id in recruit.skills) {
      html += this.Skills[skill_id].name + ': ' + recruit.skills[skill_id].rank + '<br/>';
    }
    html += '</td><td><div class="btn-group pull-right"><a href="#" id="btn-recruits-hire-' + person_id + '" class="btn btn-success btn-recruits-hire" data-personid="' + person_id + '">Hire</a><a href="#" id="btn-recruits-dismiss-' + person_id + '" class="btn btn-warning btn-recruits-dismiss" data-personid="' + person_id + '">Dismiss</a></div></td></tr>';
  }
  $(".tbl-recruits-body").html(html);
  $(".btn-recruits-hire").click(function(evt) {
    evt.preventDefault();
    var person_id = $(this).data('personid');
    var cell_id = null;
    for (cell_id in Game.station.stationcells) {
      if (Game.Modules[Game.station.stationcells[cell_id].module].is_airlock) {
        break;
      }
    }
    var data = { "stationcell": cell_id };
    $.ajax({
      dataType: "json",
      url: "/game/person/" + person_id + "/",
      type: "POST",
      data: JSON.stringify(data),
      success: function(data) {
        Game.turn();
      },
    });
  });
  $(".btn-recruits-dismiss").click(function(evt) {
    evt.preventDefault();
    var person_id = $(this).data('personid');
    var data = { "station": null };
    $.ajax({
      dataType: "json",
      url: "/game/person/" + person_id + "/",
      type: "POST",
      data: JSON.stringify(data),
      success: function(data) {
        Game.turn();
      },
    });
  });
},
updateCrew: function() {
  var html = "";
  for (var crew_id in this.station.crew) {
    var crew = this.station.crew[crew_id];
    var role = this.Roles[crew.role];
    var cell = this.station.stationcells[crew.stationcell];
    var module = this.Modules[cell.module];
    html += '<tr id="tr-crew-' + crew.id + '"><td>' + crew.name + '</td><td>' + (role === undefined ? 'Civilian' : role.name) + '</td><td>' + Math.round(crew.salary) + '</td><td>' + module.name + '</td><td>' + crew.action + '</td><td>' + crew.sleep + '</td><td>' + crew.health + '</td><td>' + crew.morale + '</td><td>';
    for (var skill_id in crew.skills) {
      html += this.Skills[skill_id].name + ': ' + crew.skills[skill_id].rank + '<br/>';
    }
    html += '</td></tr>';
  }
  $(".tbl-crew-body").html(html);
  for (var crew_id in this.station.crew) {
    var crew = this.station.crew[crew_id];
    $('#tr-crew-' + crew.id).click({ id: crew.id }, function(evt) {
      var crew = Game.station.crew[evt.data.id];
      var html = '<select id="sel-crew-role" class="form-control" data-crew="' + evt.data.id + '"><option value="">Civilian</option>';
      for (var role_id in Game.Roles) {
        html += '<option value="' + role_id + '"';
        if (crew.role_id == role_id) {
          html += ' selected="selected"';
        }
        html += '>' + Game.Roles[role_id].name + '</option>';
      }
      html += '</select>';
      html += '<a id="btn-crew-fire" class="form-control btn btn-danger" data-crew="' + evt.data.id + '" href="#">Fire</a>';
      Game.showModal(crew.name, html, function(evt) {
        /*
        Game.crew[$('#sel-crew-role').data('crew')].role_id = $('#sel-crew-role').val();
        */
        var crew_id = $('#btn-crew-fire').data('crew');
        var data = { "role": $('#sel-crew-role').val() };
        $.ajax({
          dataType: "json",
          url: "/game/person/" + crew_id + "/",
          type: "POST",
          data: JSON.stringify(data),
          success: function(data) {
            Game.turn();
          },
        });
        Game.hideModal();
      });
      $('#btn-crew-fire').click(function(evt) {
        evt.preventDefault();
        var crew_id = $('#btn-crew-fire').data('crew');
        var data = { 'stationcell': null };
        $.ajax({
          dataType: "json",
          url: "/game/person/" + crew_id + "/",
          type: "POST",
          data: JSON.stringify(data),
          success: function(data) {
            Game.turn();
          },
        });
        Game.hideModal();
      });
    });
  }
},
updateMarket: function() {
  var html = "";
  for (var tradegood_id in this.TradeGoods) {
    var qty = 0;
    if (this.station.tradegoods[tradegood_id] !== undefined) {
      qty = this.station.tradegoods[tradegood_id].quantity;
    }
    html += '<tr><td>' + this.TradeGoods[tradegood_id].name + '</td><td>$' + (Math.round(this.TradeGoods[tradegood_id].base_price * 100.0) / 100.0) + '</td><td>' + qty + '</td></tr>';
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
  for (var yy = 0; yy < this.station.stationmap.length; yy++) {
    for (var xx = 0; xx < this.station.stationmap[yy].length; xx++) {
      var x = this.offset_x + (((this.tile_wide + this.spacing) * xx) * this.scale);
      var y = this.offset_y + (((this.tile_high + this.spacing) * yy) * this.scale);
      var w = this.tile_wide * this.scale;
      var h = this.tile_high * this.scale;
      if (this.station.stationmap[yy][xx] == null) {
          context.fillStyle = "rgba(0, 0, 0, 0.2)";
          context.strokeStyle = "#000";
          context.fillRect(x, y, w, h);
          context.lineWidth = 3;
          context.strokeRect(x, y, w, h);
      } else {
        var cell = this.station.stationcells[this.station.stationmap[yy][xx]];
        var module = this.Modules[cell.module];
        try {
          context.fillStyle = module.fill_style;
          context.strokeStyle = module.stroke_style;
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
  }
  // tooltip
  if (this.mx != null && this.my != null) {
    var cell = this.getCoordinateAt(this.mx, this.my);
    if (cell.x >= 0 && cell.x < this.station.wide && cell.y >= 0 && cell.y < this.station.high) {
      var tip = "Click to add a module";
      if (this.station.stationmap[cell.y][cell.x] != null) {
        tip = "Click to select";
      }
      context.fillStyle = "#fff";
      context.textAlign = "left";
      context.textBaseline = "top";
      context.fillText(tip, this.mx + 10, this.my + 20);
    }
  }
},
setAlertLevel: function(alert_level_id) {
  $("#btn-group-alertlevel label").removeClass(this.AlertLevels[this.station.alertlevel].style);
  this.station.alertlevel = alert_level_id;
  $("#btn-group-alertlevel label").addClass(this.AlertLevels[this.station.alertlevel].style);
},
setMap: function(xx, yy, module_id) {
  var data = { x: xx, y: yy, module: module_id };
  $.ajax({
    dataType: "json",
    url: "/game/station/" + this.station.id + "/cell/",
    type: "PUT",
    data: JSON.stringify(data),
    success: function(data) {
      Game.station = data.station;
      Game.draw();
      var coords = Game.getCoordinateAt(Game.mx, Game.my);
      Game.selectModule(coords.x, coords.y);
      Game.updateSelected();
    },
  });
},
addModule: function(xx, yy) {
  // space, allow add module
  var html = '<select id="sel-module" class="form-control">';
  for (var module_id in Game.Modules) {
    // check module elegibility
    var allow = Game.Modules[module_id].is_entry;
    for (var neighbor_y = Math.max(0, yy - 1); !allow && neighbor_y <= Math.min(Game.station.high - 1, yy + 1); neighbor_y++) {
      var cell = Game.getCellAt(xx, neighbor_y);
      if (cell !== null && (cell.module == module_id || Game.Modules[cell.module].is_corridor)) {
        allow = true;
      }
    }
    for (var neighbor_x = Math.max(0, xx - 1); !allow && neighbor_x <= Math.min(Game.station.wide - 1, xx + 1); neighbor_x++) {
      var cell = Game.getCellAt(neighbor_x, yy);
      if (cell !== null && (cell.module == module_id || Game.Modules[cell.module].is_corridor)) {
        allow = true;
      }
    }
    if (allow) {
      html += '<option value="' + module_id + '">' + Game.Modules[module_id].name + '</option>';
    }
  }
  html += '</select>';
  Game.showModal("Add module", html, function(evt) {
    var module = $("#sel-module").val();
    Game.setMap(xx, yy, module);
  
    Game.hideModal();
    Game.draw();
  });
},
hireRecruit: function(evt) {
  evt.preventDefault();

  /*
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
  */
  Game.updateRecruits();
},
dismissRecruit: function(evt) {
  evt.preventDefault();
  //Game.recruits.splice(evt.data.id, 1);
  Game.updateRecruits();
},
removeModule: function(evt) {
  /*
  Game.map[evt.data.yy][evt.data.xx].module_id = 0;
  $("#div-details").html("");
  Game.draw();
  */
},
selectModule: function(xx, yy) {
  this.selected.x = xx;
  this.selected.y = yy;
  this.updateSelected();
},             

// serialization
save: function() {
  $.cookie('warp9-stationid', this.station.id, { expires: 365 });
},
load: function() {
  var station_id = $.cookie('warp9-stationid');
  $.ajax({
    dataType: "json",
    url: "/game/station/" + station_id + "/",
    type: "GET",
    success: function(data) {
      Game.station = data.station;
      Game.start();
    },
  });
},
reset: function() {
  var data = { name: "New Station" };
  $.ajax({
    dataType: "json",
    url: "/game/station/",
    type: "PUT",
    data: JSON.stringify(data),
    success: function(data) {
      Game.station = data.station;
      Game.start();
    },
  });
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
  if (xx < 0 || xx >= this.station.wide || yy < 0 || yy >= this.station.high) {
    return null;
  } else {
    if (this.station.stationmap[yy][xx] === null) {
      return null;
    } else {
      return this.station.stationcells[this.station.stationmap[yy][xx]];
    }
  }
},
getCoordinateAt: function(xx, yy) {
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
