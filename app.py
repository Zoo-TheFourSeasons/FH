# -*- coding: utf-8 -*-
"""app
"""
from flask import Flask
from flask_socketio import SocketIO


def create_app():
    """create app
    """
    # _app = Flask(__name__, template_folder='bs4/templates', static_folder='bs4/static')
    _app = Flask(__name__, template_folder='bs5/templates', static_folder='bs5/static')
    _app.debug = True
    _app.secret_key = 'x32dc5UTM6eWa8C3qgYRt12u7oiFwSrN'
    _app.config.update(WTF_CSRF_SECRET_KEY='x32dc5UTM6eWa8C3qgYRt12u7oiFwSrN',
                       WTF_CSRF_TIME_LIMIT=14400,
                       WTF_CSRF_ENABLED=False,
                       PERMANENT_SESSION_LIFETIME=144000,
                       SESSION_REFRESH_EACH_REQUEST=True,
                       SEND_FILE_MAX_AGE_DEFAULT=3600,
                       FLASK_DB_QUERY_TIMEOUT=0.000001)
    return _app


app_ = create_app()
socket_io = SocketIO(app_,
                     async_mode='threading',
                     ping_timeout=6000,
                     ping_interval=60)
