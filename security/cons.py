import os

from cons import PATH_PROJECT
from cons import PATH_HISTORY as HIS

BASE = os.path.join(PATH_PROJECT, 'security')
DATA = os.path.join(BASE, 'data')

_APPS = ('tsunami', 'en-decrypt', )

APPS = dict([(_ap, {'scripts': os.path.join(DATA, os.path.join(_ap, 'scripts')),
                    'his': os.path.join(HIS, os.path.join('data', '%s:output' % _ap)),
                    'pks': os.path.join(DATA, os.path.join(_ap, 'pks')),
                    'data': os.path.join(DATA, _ap), }) for _ap in _APPS])

APPS['en-decrypt']['data'] = os.path.dirname(PATH_PROJECT)

