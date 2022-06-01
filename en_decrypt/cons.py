import os

from cons import PATH_PROJECT
from cons import PATH_HISTORY as HIS

BASE = os.path.join(PATH_PROJECT, 'en_decrypt')
DATA = os.path.join(BASE, 'data')

_APPS = ('en_decrypt', )

APPS = dict([(_ap, {'scripts': os.path.join(DATA, os.path.join(_ap, 'scripts')),
                    'opens': os.path.join(PATH_PROJECT, os.path.join('source', _ap)),
                    'his': os.path.join(HIS, os.path.join('data', '%s:output' % _ap)),
                    'pks': os.path.join(DATA, os.path.join(_ap, 'pks')),
                    'data': os.path.dirname(PATH_PROJECT), }) for _ap in _APPS])
