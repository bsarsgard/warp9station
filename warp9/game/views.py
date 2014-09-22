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
    return {
            "alertlevels": alertlevels,
            "tradegoods": tradegoods,
            "roles": roles,
            "skills": skills,
            "modules": modules }

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
        # set up recruits
        for ii in xrange(10):
            person = Person(station=station, name=names.get_full_name())
            person.save()
        # now save
        station.save()
        # and return
        return {"station": station.get_json()}
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
        jreq = json.loads(request.raw_post_data)
        station = get_object_or_404(Station, pk=pk)
        station.alertlevel_id = jreq['alertlevel']
        dt = datetime.now() - station.last_turn
        if dt.seconds < 5:
            # not time yet to process a turn
            return {"station": station.get_json()}
        # take a turn
        station.last_turn = datetime.now()
        # first, let's reset cells
        station.stationcell_set.all().update(on=False, efficiency=0)
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
                    if math.log(ps.progress) > ps.rank + 1:
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
                queue = collections.deque()
                for n in pe.stationcell.neighbors.all():
                    queue.append([n])
                while queue and not pe.action:
                    path = queue.popleft()
                    cell = path[-1]
                    if not cell.on\
                            and ((pe.role\
                                and (station.life < 0
                                    or station.alertlevel.threshold < 0\
                                    or pe.sleep >= 100\
                                    and pe.health >= 100)\
                                and cell.module.roles.filter(
                                        id=pe.role_id).exists())\
                            or (station.life >= 0\
                                and station.alertlevel.threshold >= 0\
                                and ((cell.module.health > 0\
                                        and pe.health < 100)\
                                    or (cell.module.sleep > 0\
                                        and pe.sleep < 100)\
                                    or (cell.module.morale > 0\
                                        and pe.morale < 100)))):
                        # move toward this cell
                        pe.action = "Walking to %s" % cell.module.name
                        pe.stationcell = path.pop(0)
                        pe.path = ','.join(str(x.id) for x in path)
                    # this could be optimized later by crawling corridors
                    for n in cell.neighbors.all():
                        new_path = list(path)
                        if not n in path:
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
        # now let's update station status
        station.power = 0
        station.life = 0
        station.weapons = 0
        workers = {}
        skills = {}
        for sc in station.stationcell_set.filter(on=True):
            for me in sc.module.enables.all():
                if not me.id in workers:
                    workers[me.id] = 0
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
        # now we can calculate efficiency
        for module in Module.objects.exclude(power__lte=0, life__lte=0,
                weapons__lte=0):
            if module.id in workers:
                workers_tot = workers[module.id]
                skill_avg = sum(skills[module.id]) / len(skills[module.id])
            else:
                workers_tot = 0
                skill_avg = 0
            for sc in station.stationcell_set.filter(module__id=module.id):
                sc.efficiency = (Station.get_efficiency(workers_tot)\
                        + Station.get_efficiency(skill_avg)) / 2
                if sc.module.power > 0:
                    station.power += round(sc.module.power * sc.efficiency)
                if sc.module.life > 0:
                    station.life += round(sc.module.life * sc.efficiency)
                if sc.module.weapons > 0:
                    station.weapons += round(sc.module.weapons * sc.efficiency)
                sc.save()
        for sc in station.stationcell_set.exclude(module__power__gte=0,
                module__life__gte=0, module__weapons__gte=0):
            if sc.module.power < 0:
                station.power += round(sc.module.power)
            if sc.module.life < 0:
                station.life += round(sc.module.life)
            if sc.module.weapons < 0:
                station.weapons += round(sc.module.weapons)
        station.save()
        return {"station": station.get_json()}
    else:
        obj = get_object_or_404(Station, pk=pk)
        return {"station": obj.get_json()}

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
