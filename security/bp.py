# -*- coding: utf-8 -*-
import subprocess
import selectors

from flask import Blueprint, jsonify, request

from app import socket_io
from base import WebSocketHelper

from cons import PATH_HISTORY
from security.assistant import ScanHelper
from security.assistant import EncryptHelper
from security.cons import APPS


class TsunamiNameSpace(WebSocketHelper):
    def on_task(self, data):
        self.socketio.start_background_task(
            self.background_run_task, data
        )

    def background_run_task(self, data):
        action = data['action']
        params = data['params']
        params['path_data'] = APPS['tsunami']['data']
        params['path_source'] = APPS['tsunami']['pks']

        shells_map = {
            'tsunami:scan': ScanHelper.scan_by_tsunami,
        }
        shell = shells_map[action](**params)
        history = ScanHelper.get_output_file_split_by_time(
            PATH_HISTORY, action, precision='ns', suffix='.his'
        )

        def read(fn, his):
            line = fn.readline()
            print(line, end='')
            his.write(line)
            self.update_progress({'his': line})

        selector = selectors.DefaultSelector()
        if shell.stdout:
            selector.register(shell.stdout, selectors.EVENT_READ, read)
            print('register on stdout')
        if shell.stderr:
            selector.register(shell.stderr, selectors.EVENT_READ, read)
            print('register on stderr')
        with open(history + '.history', 'a') as f:
            while True:
                events = selector.select()
                for key, mask in events:
                    callback = key.data
                    callback(key.fileobj, f)
                if subprocess.Popen.poll(shell) == 0:
                    break


socket_io.on_namespace(TsunamiNameSpace('/security'))
bp = Blueprint('security', __name__)

@bp.route('/security/en-decrypt/index', methods=['get'],
          defaults={'app': 'en-decrypt'}, endpoint='decrypt_index')
@bp.route('/security/tsunami/index', methods=['get'],
          defaults={'app': 'tsunami'}, endpoint='tsunami_index')
def index(app):

    data = ScanHelper.listdir(request.args.get('target', ''), base=APPS[app]['data'], args_r=request.args)
    return jsonify(data)


@bp.route('/security/en-decrypt/view', methods=['get'],
          defaults={'app': 'en-decrypt'}, endpoint='decrypt_view')
@bp.route('/security/tsunami/view', methods=['get'],
          defaults={'app': 'tsunami'}, endpoint='tsunami_view')
def view(app):
    data = ScanHelper.view(request.args.get('target', ''), base=APPS[app]['data'], args_r=request.args)
    return jsonify(data)


@bp.route('/security/tsunami/delete', methods=['get'],
          defaults={'app': 'tsunami'}, endpoint='tsunami_delete')
def delete(app):
    files = request.args.get('files')
    data = ScanHelper.delete(files, APPS[app]['data'])
    return jsonify(data)


@bp.route('/security/en-decrypt/', methods=['get'],
          defaults={'app': 'en-decrypt'}, endpoint='en_decrypt')
def en_decrypt(app):
    psw_aes = request.args.get('psw_aes')
    psw_stream = request.args.get('psw_stream')
    nonce = request.args.get('nonce')
    _type = request.args.get('type')
    target = request.args.get('target')
    data = EncryptHelper.security_by_golang(_type, psw_aes, psw_stream, nonce, target, base=APPS[app]['data'])
    return jsonify(data)
