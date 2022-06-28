# coding=utf-8
import argparse
import time

from flask import render_template, request, jsonify

from app import app_, socket_io
from bpsbfs import get_bps_bfs
from cons import BPS, BP_ALL
from base import ProcessHelper
import ins


@app_.route('/', methods=['get'], defaults={'category': '', 'link': '', 'func': ''}, endpoint='home')
@app_.route('/webs/<string:category>', defaults={'link': '', 'func': ''}, methods=['get'], endpoint='category')
@app_.route('/webs/<string:category>/<string:link>', defaults={'func': ''}, methods=['get'], endpoint='link')
@app_.route('/webs/<string:category>/<string:link>/<string:func>', methods=['get'], endpoint='func')
def webs(category, link, func):
    if not category:
        return render_template('home.html', **{'_bps': ins.ins_bps})
    if not link:
        return render_template('%s.html' % category, **{'_bps': ins.ins_bps})
    if not func:
        return render_template('%s/%s.html' % (category, link), **{'_bps': ins.ins_bps})
    return render_template('%s/%s/%s.html' % (category, link, func), **{'_bps': ins.ins_bps})


@app_.route('/restart', methods=['get'], endpoint='restart')
def restart():
    _bps = [bp for bp in BPS if request.args.get(bp, 'false').lower() == 'true']
    print('bps:', _bps)

    ins.ins_que.put(_bps)
    return jsonify({'status': True, 'message': ', '.join(_bps)})


def app_launcher(_ip, _port, _bps):
    print('app_launcher')
    print('ip:', _ip)
    print('port:', _port)
    print('bps:', _bps)
    ins.ins_bps = _bps

    bps, bfs = get_bps_bfs(_bps)
    [app_.register_blueprint(i.bp) for i in bps]
    [app_.before_first_request_funcs.extend(i.inits) for i in bfs]
    socket_io.run(app_, host=_ip, port=int(_port), use_reloader=False)


def start_app_and_guard(_app_launcher, _ip, _port, _bps):
    print('start_app_and_guard')

    app = ProcessHelper(_app_launcher, *(_ip, _port, _bps))
    app.start()

    while True:
        if not ins.ins_que.empty():
            _bps_new = ins.ins_que.get()
            print('bps_new:', _bps_new)
            app.kill()

            while app.is_alive():
                time.sleep(1)
                print('app.is_alive')
            app = ProcessHelper(_app_launcher, *(_ip, _port, _bps_new))
            app.start()
        time.sleep(1.5)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--ip', help='ip', type=str, default='0.0.0.0')
    parser.add_argument('--port', help='port', type=int, default=9755)
    parser.add_argument('--bps', help='blueprints', type=str, default='know,dsp,history')

    ars = parser.parse_args()
    bps_ = BPS if ars.bps == BP_ALL else ars.bps.split(',')

    guard = ProcessHelper(start_app_and_guard, *(app_launcher, ars.ip, ars.port, bps_))
    guard.start()
