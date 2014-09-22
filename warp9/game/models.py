import random

from datetime import datetime

from django.contrib.auth.models import User
from django.db import models

class AlertLevel(models.Model):
    name = models.CharField(max_length=100)
    threshold = models.IntegerField()
    style = models.CharField(max_length=100)

    def get_json(self):
        return {
            "id": self.id,
            "name": self.name,
            "style": self.style,
            "threshold": self.threshold }
    def __unicode__(self):
        return self.name

class TradeGood(models.Model):
    name = models.CharField(max_length=100)
    base_price = models.IntegerField()

    def get_json(self):
        return {
            "id": self.id,
            "name": self.name,
            "base_price": self.base_price }
    def __unicode__(self):
        return self.name

class Role(models.Model):
    name = models.CharField(max_length=100)
    max_crew = models.IntegerField(null=True, blank=True)
    base_salary = models.IntegerField()
    skill_bonus = models.IntegerField()

    def get_json(self):
        return {
            "id": self.id,
            "name": self.name,
            "base_salary": self.base_salary,
            "skill_bonus": self.skill_bonus }
    def __unicode__(self):
        return self.name

class Skill(models.Model):
    name = models.CharField(max_length=100)

    def get_json(self):
        return {
            "id": self.id,
            "name": self.name }
    def __unicode__(self):
        return self.name

class Module(models.Model):
    skill = models.ForeignKey(Skill, null=True, blank=True)
    name = models.CharField(max_length=100)
    fill_style = models.CharField(max_length=100)
    stroke_style = models.CharField(max_length=100)
    is_corridor = models.BooleanField()
    is_entry = models.BooleanField()
    health = models.IntegerField()
    sleep = models.IntegerField()
    morale = models.IntegerField()
    power = models.IntegerField()
    weapons = models.IntegerField()
    life = models.IntegerField()
    cargo = models.IntegerField()
    enables = models.ManyToManyField('Module', null=True, blank=True)
    roles = models.ManyToManyField(Role, null=True, blank=True)

    def get_json(self):
        enables = []
        for m in self.enables.all():
            enables.append(m.id)
        roles = []
        for r in self.roles.all():
            roles.append(r.id)
        return {
            "id": self.id,
            "skill": self.skill.id if self.skill else None,
            "name": self.name,
            "fill_style": self.fill_style,
            "stroke_style": self.stroke_style,
            "is_corridor": self.is_corridor,
            "is_entry": self.is_entry,
            "health": self.health,
            "sleep": self.sleep,
            "morale": self.morale,
            "power": self.power,
            "weapons": self.weapons,
            "life": self.life,
            "cargo": self.cargo,
            "enables": enables,
            "roles": roles }
    def __unicode__(self):
        return self.name

class Station(models.Model):
    user = models.ForeignKey(User, null=True)
    name = models.CharField(max_length=100)
    wide = models.IntegerField(default=0)
    high = models.IntegerField(default=0)
    credits = models.IntegerField(default=1000)
    power = models.IntegerField(default=0)
    weapons = models.IntegerField(default=0)
    life = models.IntegerField(default=0)
    cargo = models.IntegerField(default=0)
    tradegoods = models.ManyToManyField(TradeGood, through='StationTradeGood')
    alertlevel = models.ForeignKey(AlertLevel, null=True)
    created = models.DateTimeField(auto_now_add=True)
    last_turn = models.DateTimeField(auto_now_add=True)

    @staticmethod
    def get_efficiency(rank):
        base = 0.2;
        eff = base
        if rank:
            eff = 1.0 - ((1.0 - base) / 2 ** rank)
        return eff

    def get_json(self):
        tradegoods = {}
        for tg in self.tradegoods.all():
            tradegoods[tg.id] = tg.get_json()
        stationcells = {}
        stationmap = []
        for yy in xrange(self.high):
            row = []
            for xx in xrange(self.wide):
                row.append(None)
            stationmap.append(row)
        for sc in self.stationcell_set.all():
            stationcells[sc.id] = sc.get_json()
            stationmap[sc.y][sc.x] = sc.id
        crew = {}
        for p in self.person_set.filter(stationcell__isnull=False):
            crew[p.id] = p.get_json()
        recruits = {}
        for p in self.person_set.filter(stationcell__isnull=True):
            recruits[p.id] = p.get_json()
        return {
            "id": self.id,
            "user": self.user.id if self.user else None,
            "name": self.name,
            "wide": self.wide,
            "high": self.high,
            "credits": self.credits,
            "power": self.power,
            "weapons": self.weapons,
            "life": self.life,
            "cargo": self.cargo,
            "tradegoods": tradegoods,
            "alertlevel": self.alertlevel.id if self.alertlevel else None,
            "stationmap": stationmap,
            "stationcells": stationcells,
            "crew": crew,
            "recruits": recruits }
    def __unicode__(self):
        return self.name

class StationTradeGood(models.Model):
    station = models.ForeignKey(Station)
    tradegood = models.ForeignKey(TradeGood)
    quantity = models.IntegerField()

    def get_json(self):
        return {
                "id": self.id,
                "station": self.station.id,
                "tradegood": self.tradegood.id,
                "quantity": self.quantity }

class StationCell(models.Model):
    station = models.ForeignKey(Station)
    module = models.ForeignKey(Module)
    x = models.IntegerField()
    y = models.IntegerField()
    on = models.BooleanField(default=False)
    efficiency = models.FloatField(null=True)
    neighbors = models.ManyToManyField('StationCell')

    def get_json(self):
        crew = []
        for p in self.person_set.all():
            crew.append(p.id)
        return {
                "id": self.id,
                "station": self.station.id,
                "module": self.module.id,
                "x": self.x,
                "y": self.y,
                "on": self.on,
                "efficiency": self.efficiency,
                "crew": crew }

class Person(models.Model):
    station = models.ForeignKey(Station, null=True)
    stationcell = models.ForeignKey(StationCell, null=True)
    name = models.CharField(max_length=100)
    role = models.ForeignKey(Role, null=True)
    skills = models.ManyToManyField(Skill, through='PersonSkill')
    salary = models.IntegerField(default=0)
    health = models.IntegerField(default=100)
    sleep = models.IntegerField(default=100)
    morale = models.IntegerField(default=100)
    action = models.CharField(max_length=100, null=True)
    path = models.CharField(max_length=1024, null=True)

    def __unicode__(self):
        return self.name
    def get_json(self):
        skills = {}
        for s in self.personskill_set.all():
            skills[s.skill.id] = s.get_json()
        return {
                "id": self.id,
                "station": self.station.id if self.station else None,
                "stationcell":
                    self.stationcell.id if self.stationcell else None,
                "name": self.name,
                "role": self.role.id if self.role else None,
                "skills": skills,
                "salary": self.salary,
                "health": self.health,
                "sleep": self.sleep,
                "morale": self.morale,
                "action": self.action }

class PersonSkill(models.Model):
    person = models.ForeignKey(Person, null=True)
    skill = models.ForeignKey(Skill, null=True)
    rank = models.IntegerField(default=0)
    progress = models.FloatField(default=0)

    def get_json(self):
        return {
                "person": self.person.id,
                "skill": self.skill.id,
                "rank": self.rank,
                "progress": self.progress }
