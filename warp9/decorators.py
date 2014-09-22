import datetime
import json
import sys

from django.core.mail import mail_admins
from django.http import HttpResponse
from django.utils import simplejson

def json_view(func):
    def wrap(request, *a, **kw):
        response = None
        try:
            #response = func(request, *a, **kw)
            #assert isinstance(response, dict)
            func_val = func(request, *a, **kw)
            assert isinstance(func_val, dict)
            response = dict(func_val)

            if 'result' not in response:
                response['result'] = 'ok'
        except KeyboardInterrupt:
            # Allow keyboard interrupts through for debugging.
            raise
        except Exception, e:
            raise
            # Mail the admins with the error
            exc_info = sys.exc_info()
            subject = 'JSON view error: %s' % request.path
            try:
                request_repr = repr(request)
            except:
                request_repr = 'Request repr() unavailable'
            import traceback
            message = 'Traceback:\n%s\n\nRequest:\n%s' % (
                '\n'.join(traceback.format_exception(*exc_info)),
                request_repr,
                )
            mail_admins(subject, message, fail_silently=True)

            # Come what may, we're returning JSON.
            if hasattr(e, 'message'):
                msg = e.message
            else:
                msg = _('Internal error')+': '+str(e)
            response = {'result': 'error',
                        'text': msg}

        #json = simplejson.dumps(response)
        json = simplejson.dumps(response, use_decimal=True)
        return HttpResponse(json, mimetype='application/json')
    return wrap
