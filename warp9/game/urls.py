from django.conf.urls.defaults import *

from warp9.game import views

urlpatterns = patterns('',
    (r'^alertlevel/$', 'warp9.game.views.alertlevels'),
    (r'^alertlevel/(?P<pk>\d+)/$', 'warp9.game.views.alertlevel'),
    (r'^tradegood/$', 'warp9.game.views.tradegoods'),
    (r'^tradegood/(?P<pk>\d+)/$', 'warp9.game.views.tradegood'),
    (r'^role/$', 'warp9.game.views.roles'),
    (r'^role/(?P<pk>\d+)/$', 'warp9.game.views.role'),
    (r'^skill/$', 'warp9.game.views.skills'),
    (r'^skill/(?P<pk>\d+)/$', 'warp9.game.views.skill'),
    (r'^module/$', 'warp9.game.views.modules'),
    (r'^module/(?P<pk>\d+)/$', 'warp9.game.views.module'),
    (r'^init/$', 'warp9.game.views.init'),
    (r'^station/$', 'warp9.game.views.stations'),
    (r'^station/(?P<pk>\d+)/$', 'warp9.game.views.station'),
    (r'^station/(?P<station_id>\d+)/cell/$', 'warp9.game.views.stationcells'),
    (r'^station/(?P<station_id>\d+)/cell/(?P<pk>\d+)/$', 'warp9.game.views.stationcell'),
    (r'^person/$', 'warp9.game.views.persons'),
    (r'^person/(?P<pk>\d+)/$', 'warp9.game.views.person'),
)
