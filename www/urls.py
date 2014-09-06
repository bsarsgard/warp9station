from django.conf.urls.defaults import *

urlpatterns = patterns('',
    (r'^$', 'warp9.www.views.index'),
    (r'^play/$', 'warp9.www.views.play'),
    (r'^about/$', 'warp9.www.views.about'),
)
