# -*- coding: utf-8 -*-
from flask import Blueprint, jsonify, request

from en_decrypt.assistant import EncryptHelper
from en_decrypt.cons import APPS

bp = Blueprint('en_decrypt', __name__)


@bp.route('/en_decrypt/index', methods=['get'],
          defaults={'app': 'en_decrypt'}, endpoint='decrypt_index')
def index(app):
    data = EncryptHelper.listdir(request.args.get('target', ''), base=APPS[app]['data'], args_r=request.args)
    return jsonify(data)


@bp.route('/en_decrypt/view', methods=['get'],
          defaults={'app': 'en_decrypt'}, endpoint='decrypt_view')
def view(app):
    data = EncryptHelper.view(request.args.get('target', ''), base=APPS[app]['data'], args_r=request.args)
    return jsonify(data)


@bp.route('/en_decrypt', methods=['get'],
          defaults={'app': 'en_decrypt'}, endpoint='en_decrypt')
def en_decrypt(app):
    psw_aes = request.args.get('psw_aes')
    psw_stream = request.args.get('psw_stream')
    nonce = request.args.get('nonce')
    _type = request.args.get('type')
    for target in request.args.get('target').split(','):
        EncryptHelper.security_by_golang(_type, psw_aes, psw_stream, nonce, target, base=APPS[app]['data'])
    return jsonify({'status': True})
