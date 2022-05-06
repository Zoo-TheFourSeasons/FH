# -*- coding: utf-8 -*-

from flask import Blueprint
from flask import request
from flask import jsonify

from photo import PhotoHelper
from zoo.cons import PATH_ZOO

zoo = Blueprint('zoo', __name__)


@zoo.route('/zoo/listdir', methods=['get'], endpoint='listdir')
def listdir():
    data = PhotoHelper.listdir(request.args.get('target', ''), PATH_ZOO, args_r=request.args)
    return jsonify(data)


@zoo.route('/zoo/view', methods=['get'], endpoint='view')
def view():
    data = PhotoHelper.view(request.args.get('target', ''), PATH_ZOO)
    return jsonify(data)


@zoo.route('/zoo/images/mkdir', methods=['get'], endpoint='mkdir')
def mkdir():
    data = PhotoHelper.mkdir(request.args.get('target', ''), PATH_ZOO)
    return jsonify(data)


@zoo.route('/zoo/images/delete', methods=['get'], endpoint='delete')
def delete():
    files = request.args.get('files')
    data = PhotoHelper.delete(files, PATH_ZOO)
    return jsonify(data)


@zoo.route('/zoo/images/operate', methods=['get'], endpoint='operate')
def operate():
    _operate = request.args.get('operate')
    hp = PhotoHelper()
    hp.ratio_ink = 500
    hp.position_ink = 'bottom right'
    hp.path_ink_white = '/home/zoo/Desktop/_Y/Zoo-HZ-Media-Volunteers/_files/white.png'
    hp.path_ink_black = '/home/zoo/Desktop/_Y/Zoo-HZ-Media-Volunteers/_files/black.png'

    func_map = {
        'rotate': hp.rotate,
        'resize': hp.resize,
        'ink': hp.ink,
    }
    data = func_map[_operate](
        request.args.get('target'),
        request.args.get('path_out'))
    return jsonify(data)


@zoo.route('/zoo/images/download', methods=['get'], endpoint='download')
def download():
    data = PhotoHelper.download(request.args.get('target', ''), PATH_ZOO)
    return jsonify(data)


@zoo.route('/zoo/images/rotate', methods=['get'], endpoint='rotate')
def rotate():
    data = PhotoHelper().rotate(request.args.get('target', ''), 'static/images/webp-resize-2000')
    return jsonify(data)


@zoo.route('/zoo/images/resize', methods=['get'], endpoint='resize')
def resize():
    data = PhotoHelper().resize(request.args.get('target', ''), 'static/images/webp-resize-2000')
    return jsonify(data)


@zoo.route('/zoo/images/ink', methods=['get'], endpoint='ink')
def ink():
    data = PhotoHelper().ink(request.args.get('target', ''), request.args.get('path_out', ''))
    return jsonify(data)
