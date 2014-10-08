import collections
import datetime
import json
import math
import operator
import random
import sys

from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import F
from django.views.decorators.http import require_GET, require_POST
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import simplejson
from django.utils.translation import ugettext as _
from django.views.decorators.csrf import csrf_exempt

import names

from warp9.decorators import json_view
from warp9.game.models import *

@require_GET
@csrf_exempt
@json_view
def alertlevels(request):
    objs = {}
    for obj in AlertLevel.objects.all():
        objs[obj.pk] = obj.get_json()
    return {"alertlevels": objs}

@require_GET
@csrf_exempt
@json_view
def alertlevel(request, pk):
    obj = get_object_or_404(AlertLevel, pk=pk)
    return {"alertlevel": obj.get_json()}

@require_GET
@csrf_exempt
@json_view
def tradegoods(request):
    objs = {}
    for obj in TradeGood.objects.all():
        objs[obj.pk] = obj.get_json()
    return {"tradegoods": objs}

@require_GET
@csrf_exempt
@json_view
def tradegood(request, pk):
    obj = get_object_or_404(TradeGood, pk=pk)
    return {"tradegood": obj.get_json()}

@require_GET
@csrf_exempt
@json_view
def roles(request):
    objs = {}
    for obj in Role.objects.all():
        objs[obj.pk] = obj.get_json()
    return {"roles": objs}

@require_GET
@csrf_exempt
@json_view
def role(request, pk):
    obj = get_object_or_404(Role, pk=pk)
    return {"role": obj.get_json()}

@require_GET
@csrf_exempt
@json_view
def skills(request):
    objs = {}
    for obj in Skill.objects.all():
        objs[obj.pk] = obj.get_json()
    return {"skills": objs}

@require_GET
@csrf_exempt
@json_view
def skill(request, pk):
    obj = get_object_or_404(Skill, pk=pk)
    return {"skill": obj.get_json()}

@require_GET
@csrf_exempt
@json_view
def modules(request):
    objs = {}
    for obj in Module.objects.all():
        objs[obj.pk] = obj.get_json()
    return {"modules": objs}

@require_GET
@csrf_exempt
@json_view
def module(request, pk):
    obj = get_object_or_404(Module, pk=pk)
    return {"module": obj.get_json()}

@require_GET
@csrf_exempt
@json_view
def init(request):
    # load the lookups
    alertlevels = {}
    tradegoods = {}
    roles = {}
    skills = {}
    modules = {}
    planetattributes = {}
    for obj in AlertLevel.objects.all():
        alertlevels[obj.pk] = obj.get_json()
    for obj in TradeGood.objects.all():
        tradegoods[obj.pk] = obj.get_json()
    for obj in Role.objects.all():
        roles[obj.pk] = obj.get_json()
    for obj in Skill.objects.all():
        skills[obj.pk] = obj.get_json()
    for obj in Module.objects.all():
        modules[obj.pk] = obj.get_json()
    for obj in PlanetAttribute.objects.all():
        planetattributes[obj.pk] = obj.get_json()
    return {
            "alertlevels": alertlevels,
            "tradegoods": tradegoods,
            "roles": roles,
            "skills": skills,
            "modules": modules,
            "planetattributes": planetattributes }

@csrf_exempt
@json_view
def stations(request):
    if request.method == 'PUT':
        # add a new station
        jreq = json.loads(request.raw_post_data)
        station = Station(name=jreq['name'])
        # set default alert level
        station.alertlevel = AlertLevel.objects.order_by("-threshold")[:1].get()
        # build the default map
        station.wide = 3
        station.high = 3
        airlock = Module.objects.filter(is_entry=True)[:1].get()
        station.save()
        cell = StationCell(station=station, x=1, y=1, module=airlock)
        cell.save()
        # create starting crew
        name = names.get_full_name()
        person = Person(station=station, stationcell=cell, name=name)
        person.save()
        # set up the planet
        planet = Planet(station=station, cargo=600, credits=10000)
        planet.name = "%s %i" % (names.get_last_name(), random.randint(1, 12))
        planet.save()
        for pa in PlanetAttribute.objects.all():
            s = pa.planetattributesetting_set.all().order_by('?')[0]
            planet.settings.add(s)
        """
        for tg in TradeGood.objects.all():
            stg = MarketTradeGood(station=station, tradegood=tg)
            stg.quantity = 0
            stg.bid = tg.price * 0.99
            stg.ask = tg.price * 1.01
            stg.save()
            ptg = MarketTradeGood(planet=planet, tradegood=tg)
            ptg.quantity = 50
            ptg.bid = tg.price * 0.99
            ptg.ask = tg.price * 1.01
            ptg.save()
        """
        # set up recruits
        for ii in xrange(10):
            person = Person(station=station, name=names.get_full_name())
            person.save()
        # now save
        station.save()
        # and return
        return { "station": station.get_json() }
    else:
        # return all
        objs = {}
        for obj in Station.objects.all():
            objs[obj.pk] = obj.name
        return {"stations": objs}

@csrf_exempt
@json_view
def station(request, pk):
    if request.method == 'POST':
        debug = {}
        last = datetime.now()
        jreq = json.loads(request.raw_post_data)
        station = get_object_or_404(Station, pk=pk)
        if 'alertlevel' in jreq:
            station.alertlevel_id = jreq['alertlevel']
        if 'tradegoods' in jreq:
            tradegoods = jreq['tradegoods']
            for stg in station.markettradegood_set.all():
                if str(stg.tradegood_id) in tradegoods:
                    tradegood = tradegoods[str(stg.tradegood_id)]
                    stg.bid = tradegood['bid']
                    stg.ask = tradegood['ask']
                    stg.buy = tradegood['buy']
                    stg.save()
        dt = datetime.now() - station.last_turn
        if dt.seconds < 5:
            # not time yet to process a turn
            planet = Planet.objects.get(station=station)
            return {"station": station.get_json()}
        # take a turn
        station.last_turn = datetime.now()
        # first, let's reset cells
        station.stationcell_set.all().update(on=False, efficiency=0)
        debug['1'] = "%i:%i" % ((datetime.now() - last).seconds, (datetime.now() - last).microseconds)
        last = datetime.now()
        # now update the crew
        for pe in station.person_set.filter(stationcell__isnull=False):
            if pe.path:
                path = pe.path.split(',')
                pe.sleep -= 1
                pe.stationcell_id = path.pop(0)
                if path:
                    pe.path = ','.join(path)
                else:
                    pe.path = None
            elif not pe.stationcell.on\
                    and pe.role\
                    and pe.stationcell.module.skill\
                    and pe.sleep > station.alertlevel.threshold\
                    and pe.morale > station.alertlevel.threshold\
                    and pe.health > station.alertlevel.threshold\
                    and pe.stationcell.module.roles.filter(
                            id=pe.role.id).exists():
                # work this cell
                pe.action = "Working %s" % pe.stationcell.module.name
                pe.stationcell.on = True
                pe.health += pe.stationcell.module.health
                pe.sleep += pe.stationcell.module.sleep
                pe.morale += pe.stationcell.module.morale
                # learn new skills
                if pe.stationcell.module.skill:
                    try:
                        ps = pe.personskill_set.get(
                                skill=pe.stationcell.module.skill)
                    except:
                        ps = PersonSkill(person=pe,
                                skill=pe.stationcell.module.skill)
                    ps.progress += 1
                    if ps.progress > (ps.rank + 1) * 100:
                        ps.rank += 1
                        ps.progress = 0
                    ps.save()
                pe.stationcell.save()
            elif not pe.stationcell.on and station.alertlevel.threshold >= 0\
                    and station.life >= 0:
                pe.action = None
                # check this cell for benefits
                if pe.stationcell.module.health > 0\
                        and pe.health < 100:
                    pe.action = "Healing"
                    pe.stationcell.on = True
                    pe.stationcell.save()
                    pe.health += pe.stationcell.module.health
                elif pe.stationcell.module.sleep > 0\
                        and pe.sleep < 100:
                    pe.action = "Resting"
                    pe.stationcell.on = True
                    pe.stationcell.save()
                    pe.sleep += pe.stationcell.module.sleep
                elif pe.stationcell.module.morale > 0\
                        and pe.morale < 100:
                    pe.action = "Relaxing"
                    pe.stationcell.on = True
                    pe.stationcell.save()
                    pe.morale += pe.stationcell.module.morale
            else:
                pe.action = None
            if not pe.action:
                # find the closest cell with something to do
                # this should be optimized later to prioritize all options
                iterations = 0
                checked = []
                queue = collections.deque()
                queue.append([pe.stationcell])
                while queue and not pe.action:
                    iterations += 1
                    path = queue.popleft()
                    cell = path[-1]
                    if not cell.on\
                            and ((pe.role\
                                and (station.life < 0
                                    or station.alertlevel.threshold < 0\
                                    or pe.sleep > station.alertlevel.threshold\
                                    and pe.morale >\
                                        station.alertlevel.threshold\
                                    and pe.health >\
                                        station.alertlevel.threshold)\
                                and cell.module.roles.filter(
                                        id=pe.role_id).exists())\
                            or (station.life >= 0\
                                and station.alertlevel.threshold >= 0\
                                and ((cell.module.health > 0\
                                        and pe.health <=\
                                            station.alertlevel.threshold)\
                                    or (cell.module.sleep > 0\
                                        and pe.sleep <=\
                                            station.alertlevel.threshold)\
                                    or (cell.module.morale > 0\
                                        and pe.morale <=\
                                            station.alertlevel.threshold)))):
                        # move toward this cell
                        pe.action = "Walking to %s" % cell.module.name
                        pe.stationcell = path.pop(0)
                        pe.path = ','.join(str(x.id) for x in path)
                    # mark this cell as checked
                    checked.append(cell.id)
                    # this could be optimized later by crawling corridors
                    for n in cell.neighbors.all():
                        if not n.id in checked:
                            if n.module_id == cell.module_id\
                                    or cell.module.is_corridor\
                                    or n.module.is_corridor:
                                new_path = list(path)
                                new_path.append(n)
                                queue.append(new_path)
            if not pe.action:
                # wander
                pe.action = "Wandering"
                pe.morale -= 1
                pe.sleep -= 1
                try:
                    pe.stationcell = pe.stationcell.neighbors.order_by('?')[0]
                except:
                    pass
            if pe.sleep < 0:
                pe.sleep = 0
            if pe.morale < 0:
                pe.morale = 0
            pe.save()
            station.save()
        debug['2'] = "%i:%i" % ((datetime.now() - last).seconds, (datetime.now() - last).microseconds)
        last = datetime.now()
        # now let's update station status
        station.power = 0
        station.life = 0
        station.weapons = 0
        station.cargo = 0
        workers = {}
        skills = {}
        for sc in station.stationcell_set.filter(on=True):
            for me in sc.module.enables.all():
                if not me.id in workers:
                    workers[me.id] = 0
                if sc.module.skill_id == me.skill_id:
                    # control rooms with a different skill don't add workers
                    workers[me.id] += 1
                if not me.id in skills:
                    skills[me.id] = []
                for p in sc.person_set.all():
                    if sc.module.skill and p.skills.filter(
                            id=sc.module.skill_id).exists():
                        s = p.personskill_set.get(
                                skill=sc.module.skill)
                        skills[me.id].append(s.rank)
                    else:
                        skills[me.id].append(0)
                    if me.skill and p.skills.filter(
                            id=me.skill_id).exists():
                        s = p.personskill_set.get(skill=me.skill)
                        skills[me.id].append(s.rank)
                    else:
                        skills[me.id].append(0)
        debug['3'] = "%i:%i" % ((datetime.now() - last).seconds, (datetime.now() - last).microseconds)
        last = datetime.now()
        # now we can calculate efficiency
        for sc in station.stationcell_set.exclude(module__power=0,
                module__life=0, module__weapons=0, module__cargo=0):
            if sc.module_id in workers:
                sc.on = True
                workers_tot = workers[sc.module_id]
                skill_avg = sum(skills[sc.module_id])\
                        / len(skills[sc.module_id])
                sc.efficiency = (Station.get_efficiency(workers_tot)\
                        + Station.get_efficiency(skill_avg)) / 2
            elif sc.module.power > 0 or sc.module.life > 0\
                    or sc.module.weapons > 0 or sc.module.cargo > 0:
                workers_tot = 0
                skill_avg = 0
                sc.efficiency = (Station.get_efficiency(workers_tot)\
                        + Station.get_efficiency(skill_avg)) / 2
            if sc.module.power > 0:
                station.power += round(sc.module.power * sc.efficiency)
            elif sc.module.power < 0:
                station.power += round(sc.module.power)
            if sc.module.life > 0:
                station.life += round(sc.module.life * sc.efficiency)
            elif sc.module.life < 0:
                station.life += round(sc.module.life)
            if sc.module.weapons > 0:
                station.weapons += round(sc.module.weapons * sc.efficiency)
            elif sc.module.weapons < 0:
                station.weapons += round(sc.module.weapons)
            if sc.module.cargo > 0:
                station.cargo += round(sc.module.cargo * sc.efficiency)
            sc.save()
        station.save()
        debug['4'] = "%i:%i" % ((datetime.now() - last).seconds, (datetime.now() - last).microseconds)
        last = datetime.now()
        # planet production
        planet = Planet.objects.get(station=station)
        planet_cargo_available = planet.get_cargo_available()
        dt = datetime.now() - planet.last_turn
        if dt.seconds >= 60:
            planet.last_turn = datetime.now()
            for pas in planet.settings.all():
                if pas.produces:
                    try:
                        mtg = planet.markettradegood_set.get(tradegood=pas.produces)
                    except:
                        mtg = MarketTradeGood(planet=planet, tradegood=pas.produces)
                        mtg.bid = pas.produces.price
                        mtg.ask = pas.produces.price
                    if planet_cargo_available > 0:
                        mtg.quantity += pas.produces.production
                        planet_cargo_available -= pas.produces.production
                        # producing, so reduce prices
                        mtg.ask -= pas.produces.price / 1000.0
                        if mtg.bid >= mtg.ask:
                            mtg.bid -= pas.produces.price / 1000.0
                    else:
                        # full, so discount ask price 1% of market
                        mtg.bid -= pas.produces.price / 100.0
                        if mtg.bid >= mtg.ask:
                            mtg.ask -= pas.produces.price / 100.0
                    mtg.save()
                if pas.consumes:
                    try:
                        mtg = planet.markettradegood_set.get(tradegood=pas.consumes)
                    except:
                        mtg = MarketTradeGood(planet=planet, tradegood=pas.consumes)
                        mtg.bid = pas.consumes.price
                        mtg.ask = pas.consumes.price
                    if mtg.quantity > 0:
                        mtg.quantity -= min(mtg.quantity,
                                pas.consumes.production)
                        planet_cargo_available -= pas.consumes.production
                        # consuming, so increase prices
                        mtg.bid += pas.consumes.price / 1000.0
                        if mtg.ask <= mtg.bid:
                            mtg.ask += pas.consumes.price / 1000.0
                    else:
                        # out, so increase bid price 1% of market
                        mtg.bid += pas.consumes.price / 100.0
                        if mtg.ask <= mtg.bid:
                            mtg.ask += pas.consumes.price / 100.0
                    mtg.save()
            # price updates
            """ Commenting this out for different price method
            for ptg in planet.markettradegood_set.all():
                # check the market
                if ptg.quantity == 0:
                    # empty, buy at any price
                    ptg.bid += ptg.bid / 1000.0
                    # don't sell
                    ptg.ask += ptg.ask / 100.0
                    ptg.save()
                elif ptg.quantity < planet.cargo / 6 * 0.3:
                    # very low, try to buy
                    ptg.bid += ptg.bid / 10000.0
                    # try not to sell
                    ptg.ask += ptg.ask / 1000.0
                    ptg.save()
                elif ptg.quantity < planet.cargo / 6 * 0.7:
                    # moderate amount, hold value
                    pass
                elif ptg.quantity < planet.cargo / 6:
                    # running out of room, try to sell
                    ptg.ask -= ptg.ask / 10000.0
                    # try not to buy
                    ptg.bid -= ptg.bid / 1000.0
                    ptg.save()
                else:
                    # full, deep discount
                    ptg.ask -= ptg.ask / 1000.0
                    # don't buy
                    ptg.bid -= ptg.bid / 100.0
                    ptg.save()
            """
            planet.save()
        debug['5'] = "%i:%i" % ((datetime.now() - last).seconds, (datetime.now() - last).microseconds)
        last = datetime.now()
        # trade with station
        station_cargo_available = station.get_cargo_available()
        for tg in TradeGood.objects.all().order_by('?'):
            try:
                ptg = planet.markettradegood_set.get(tradegood=tg)
            except:
                ptg = MarketTradeGood(planet=planet, tradegood=tg)
                ptg.bid = tg.price
                ptg.ask = tg.price
                ptg.save()
            try:
                stg = station.markettradegood_set.get(tradegood=tg)
            except:
                stg = MarketTradeGood(station=station, tradegood=tg)
                stg.bid = tg.price
                stg.ask = tg.price
                stg.save()
            if ptg.quantity > 0 and stg.bid >= ptg.ask\
                    and station.credits >= ptg.ask\
                    and station_cargo_available > 0\
                    and stg.buy > stg.quantity:
                # planet sell to station
                qty = 1
                stg.quantity += qty
                station.credits -= ptg.ask * qty
                planet.credits += ptg.ask * qty
                ptg.quantity -= qty
                # raise price on planet to reflect demand
                ptg.ask += tg.price / 1000.0
                # save
                station.save()
                planet.save()
                stg.save()
                ptg.save()
                station_cargo_available -= qty
                # only 1 trade per turn
                break
            elif stg.quantity > 0 and ptg.bid >= stg.ask and\
                    planet.credits >= stg.ask and planet_cargo_available > 0:
                # planet buy from station
                qty = 1
                ptg.quantity += qty
                station.credits += stg.ask * qty
                planet.credits -= stg.ask * qty
                stg.quantity -= qty
                # drop bid price on planet to refluct apparent supply
                ptg.bid -= tg.price / 1000.0
                # save
                station.save()
                planet.save()
                stg.save()
                ptg.save()
                # only 1 trade per turn
                break
        debug['6'] = "%i:%i" % ((datetime.now() - last).seconds, (datetime.now() - last).microseconds)
        last = datetime.now()
        # trade with ships
        for ship in station.ship_set.all():
            ship_cargo_available = ship.get_cargo_available()
            # remove station unless successful trade
            ship.station = None
            for tg in TradeGood.objects.all().order_by('?'):
                try:
                    shtg = ship.markettradegood_set.get(tradegood=tg)
                except:
                    shtg = MarketTradeGood(ship=ship, tradegood=tg)
                    shtg.quantity = 0
                # ships trade at straight market +/- 1%
                shtg.bid = tg.price * 0.99
                shtg.ask = tg.price * 1.01
                sttg = station.markettradegood_set.get(tradegood=tg)
                if shtg.quantity > 0 and sttg.bid >= shtg.ask\
                        and station.credits >= shtg.ask\
                        and station_cargo_available > 0\
                        and stg.buy > stg.quantity:
                    # ship sell to station
                    qty = min(math.floor(station.credits / shtg.ask),
                            shtg.quantity, sttg.buy)
                    sttg.quantity += qty
                    station.credits -= shtg.ask * qty
                    ship.credits += shtg.ask * qty
                    shtg.quantity -= qty
                    # keep it here since we're trading
                    ship.station = station
                    station.save()
                    sttg.save()
                    shtg.save()
                    traded = True
                elif sttg.quantity > 0 and shtg.bid >= sttg.ask and\
                        ship.credits >= sttg.ask and\
                        ship_cargo_available > 0:
                    # ship buy from station
                    qty = min(math.floor(ship.credits / sttg.ask),
                            sttg.quantity)
                    shtg.quantity += qty
                    station.credits += sttg.ask * qty
                    ship.credits -= sttg.ask * qty
                    sttg.quantity -= qty
                    station.save()
                    # keep it here since we're trading
                    ship.station = station
                    sttg.save()
                    shtg.save()
                    traded = True
            ship.save()
        debug['7'] = "%i:%i" % ((datetime.now() - last).seconds, (datetime.now() - last).microseconds)
        last = datetime.now()
        # check ships
        if not station.ship_set.all().exists():
            # steal a ship
            ship = Ship.objects.all().order_by('?')[0]
            ship.station = station
            ship.save()
        debug['8'] = "%i:%i" % ((datetime.now() - last).seconds, (datetime.now() - last).microseconds)
        last = datetime.now()
        return {"station": station.get_json(), "debug": debug}
    else:
        station = get_object_or_404(Station, pk=pk)
        planet = Planet.objects.get(station=station)
        return { "station": station.get_json() }

@csrf_exempt
@json_view
def stationcells(request, station_id):
    station = get_object_or_404(Station, pk=station_id)
    if request.method == 'PUT':
        # add
        jreq = json.loads(request.raw_post_data)
        # let's check our station grid to see if it needs expansion
        x = jreq['x']
        y = jreq['y']
        if x == 0:
            # new column left
            station.wide += 1
            station.stationcell_set.all().update(x=F('x')+1)
            x += 1
        elif x == station.wide - 1:
            # new column right
            station.wide += 1
        if y == 0:
            # new row top
            station.high += 1
            station.stationcell_set.all().update(y=F('y')+1)
            y += 1
        elif y == station.high - 1:
            # new row bottom
            station.high += 1
        station.save()

        module = get_object_or_404(Module, pk=jreq['module'])
        cell = StationCell(station=station,
                x=x,
                y=y,
                module=module);
        cell.save()
        # update neighbors
        try:
            n = station.stationcell_set.get(x=cell.x, y=cell.y-1)
            n.neighbors.add(cell)
            cell.neighbors.add(n)
        except:
            pass
        try:
            e = station.stationcell_set.get(x=cell.x-1, y=cell.y)
            e.neighbors.add(cell)
            cell.neighbors.add(e)
        except:
            pass
        try:
            w = station.stationcell_set.get(x=cell.x+1, y=cell.y)
            w.neighbors.add(cell)
            cell.neighbors.add(w)
        except:
            pass
        try:
            s = station.stationcell_set.get(x=cell.x, y=cell.y+1)
            s.neighbors.add(cell)
            cell.neighbors.add(s)
        except:
            pass
        return { "station": station.get_json() }
    else:
        # return all
        objs = {}
        for obj in StationCell.objects.filter(station=station):
            objs[obj.pk] = obj.get_json()
        return { "stationcells": objs }

@csrf_exempt
@json_view
def stationcell(request, station_id, pk):
    if request.method == "POST":
        jreq = json.loads(request.raw_post_data)
        station = get_object_or_404(Station, pk=station_id)
        cell = get_object_or_404(StationCell, station=station, pk=pk)
        if jreq['module']:
            cell.module = get_object_or_404(Module, pk=jreq['module'])
            cell.save()
        return { "station": station.get_json() }
    elif request.method == "DELETE":
        station = get_object_or_404(Station, pk=station_id)
        cell = get_object_or_404(StationCell, station=station, pk=pk)
        cell.delete()
        # fyi we don't need to remove neighbors because django does it
        return { "station": station.get_json() }
    else:
        station = get_object_or_404(Station, pk=station_id)
        obj = get_object_or_404(StationCell, station=station, pk=pk)
        return { "stationcell": obj.get_json() }

@csrf_exempt
@json_view
def person(request, pk):
    if request.method == "POST":
        jreq = json.loads(request.raw_post_data)
        obj = get_object_or_404(Person, pk=pk)
        if 'role' in jreq:
            obj.role_id = jreq['role']
        if 'stationcell' in jreq:
            obj.stationcell_id = jreq['stationcell']
        if 'station' in jreq:
            obj.station_id = jreq['station']
        obj.save()
        return {"person": obj.get_json()}
    elif request.method == "DELETE":
        obj = get_object_or_404(Person, pk=pk)
        obj.delete()
        return {}
    else:
        obj = get_object_or_404(Person, pk=pk)
        return {"person": obj.get_json()}

@require_GET
@csrf_exempt
@json_view
def persons(request):
    objs = {}
    for obj in Person.objects.all():
        objs[obj.pk] = obj.get_json()
    return {"persons": objs}
