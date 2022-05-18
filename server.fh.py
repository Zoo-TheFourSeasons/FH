# coding=utf-8
import argparse

from flask import render_template

from app import app_, socket_io

[app_.register_blueprint(i.bp) for i in app.bps]
[app_.before_first_request_funcs.extend(i.inits) for i in app.bfs]


@app_.route('/', methods=['get'], defaults={'category': '', 'link': '', 'func': ''}, endpoint='home')
@app_.route('/webs/<string:category>/<string:link>/<string:func>', methods=['get'], endpoint='webs')
def webs(category, link, func):
    return render_template('%s/%s/%s.html' % (category, link, func) if category else 'home.html')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--server_ip', help='server_ip', type=str, default='0.0.0.0')
    parser.add_argument('--server_port',  help='server_port', type=int, default=9755)

    ars = parser.parse_args()
    print('server_ip:', ars.server_ip)
    print('server_port:', ars.server_port)

    socket_io.run(app_, host=ars.server_ip, port=int(ars.server_port), use_reloader=False)
