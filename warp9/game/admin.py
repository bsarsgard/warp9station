from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from warp9.game.models import *

admin.site.register(AlertLevel)
admin.site.register(TradeGood)
admin.site.register(Role)
admin.site.register(Module)
admin.site.register(Skill)
admin.site.register(Station)
admin.site.register(StationCell)
admin.site.register(Person)
