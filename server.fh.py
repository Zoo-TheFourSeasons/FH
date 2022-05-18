# coding=utf-8
import argparse

from flask import render_template

from app import app_, socket_io
import zoo.bp
import dsp.bp
import know.bp
import invest.bp
import security.bp
import zoo.before
import dsp.before
import know.before
import invest.before
import security.before

app_.register_blueprint(zoo.bp.zoo)
app_.register_blueprint(dsp.bp.dsp)
app_.register_blueprint(know.bp.know)
app_.register_blueprint(invest.bp.invest)
app_.register_blueprint(security.bp.security)
app_.before_first_request_funcs.extend(zoo.before.inits)
app_.before_first_request_funcs.extend(dsp.before.inits)
app_.before_first_request_funcs.extend(know.before.inits)
app_.before_first_request_funcs.extend(invest.before.inits)
app_.before_first_request_funcs.extend(security.before.inits)


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
