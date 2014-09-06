from django.views.generic.simple import direct_to_template, redirect_to

def index(request):
    return direct_to_template(request, 'www/index.html')

def play(request):
    return direct_to_template(request, 'www/play.html')

def about(request):
    return direct_to_template(request, 'www/about.html')
