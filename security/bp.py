# -*- coding: utf-8 -*-
import subprocess
import selectors

from flask import Blueprint, jsonify, request

from app import socket_io
from base import WebSocketHelper
from security.cons import PATH_TSUNAMI, PATH_SOURCE_TSUNAMI, PATH_EN_DECRYPT
from cons import PATH_HISTORY
from security.assistant import ScanHelper
from security.assistant import EncryptHelper


class TsunamiNameSpace(WebSocketHelper):
    def on_task(self, data):
        self.socketio.start_background_task(
            self.background_run_task, data
        )

    def background_run_task(self, data):
        action = data['action']
        params = data['params']
        params['path_data'] = PATH_TSUNAMI
        params['path_source'] = PATH_SOURCE_TSUNAMI

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
          defaults={'base': PATH_EN_DECRYPT}, endpoint='decrypt_index')
@bp.route('/security/tsunami/index', methods=['get'],
          defaults={'base': PATH_TSUNAMI}, endpoint='tsunami_index')
def index(base):
    data = ScanHelper.listdir(request.args.get('target', ''), base=base, args_r=request.args)
    return jsonify(data)


@bp.route('/security/en-decrypt/view', methods=['get'],
          defaults={'base': PATH_EN_DECRYPT}, endpoint='decrypt_view')
@bp.route('/security/tsunami/view', methods=['get'],
          defaults={'base': PATH_TSUNAMI}, endpoint='tsunami_view')
def view(base):
    data = ScanHelper.view(request.args.get('target', ''), base=base, args_r=request.args)
    return jsonify(data)


@bp.route('/security/tsunami/delete', methods=['get'], endpoint='tsunami_delete')
def delete():
    files = request.args.get('files')
    data = ScanHelper.delete(files, PATH_TSUNAMI)
    return jsonify(data)


@bp.route('/security/en-decrypt/', methods=['get'], endpoint='en_decrypt')
def en_decrypt():
    psw_aes = request.args.get('psw_aes')
    psw_stream = request.args.get('psw_stream')
    nonce = request.args.get('nonce')
    _type = request.args.get('type')
    target = request.args.get('target')
    data = EncryptHelper.security_by_golang(_type, psw_aes, psw_stream, nonce, target, base=PATH_EN_DECRYPT)
    return jsonify(data)
