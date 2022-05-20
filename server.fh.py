# coding=utf-8
import argparse

from flask import render_template

from app import app_, socket_io
from bpsbfs import get_bps_bfs
from cons import BPS, BP_ALL


@app_.route('/', methods=['get'], defaults={'category': '', 'link': '', 'func': ''}, endpoint='home')
@app_.route('/webs/<string:category>/<string:link>/<string:func>', methods=['get'], endpoint='webs')
def webs(category, link, func):
    _path_html = '%s/%s/%s.html' % (category, link, func) if category else 'home.html'
    return render_template(_path_html, **{'_bps': _bps})


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--ip', help='ip', type=str, default='0.0.0.0')
    parser.add_argument('--port', help='port', type=int, default=9755)
    parser.add_argument('--bps', help='blueprints', type=str, default='security')

    ars = parser.parse_args()
    _bps = BPS if ars.bps == BP_ALL else ars.bps.split(',')

    print('ip:', ars.ip)
    print('port:', ars.port)
    print('bps:', _bps)

    bps, bfs = get_bps_bfs(_bps)
    [app_.register_blueprint(i.bp) for i in bps]
    [app_.before_first_request_funcs.extend(i.inits) for i in bfs]
    socket_io.run(app_, host=ars.ip, port=int(ars.port), use_reloader=False)
