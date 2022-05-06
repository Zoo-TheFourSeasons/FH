# -*- coding: utf-8 -*-
from flask import Blueprint, jsonify, request

from base import CodeHelper
from invest.cons import PATH_DFS, PATH_PYS, ROUNDS

invest = Blueprint('invest', __name__)


@invest.route('/invest/dfs/index', methods=['get'], defaults={'base': PATH_DFS}, endpoint='dfs_index')
@invest.route('/invest/pys/index', methods=['get'], defaults={'base': PATH_PYS}, endpoint='pys_index')
def listdir(base):
    data = CodeHelper.listdir(request.args.get('target', ''), base=base, args_r=request.args)
    return jsonify(data)


@invest.route('/invest/dfs/delete', methods=['get'], defaults={'base': PATH_DFS}, endpoint='dfs_delete')
@invest.route('/invest/pys/delete', methods=['get'], defaults={'base': PATH_PYS}, endpoint='pys_delete')
def delete(base):
    files = request.args.get('files')
    data = CodeHelper.delete(files, base)
    return jsonify(data)


@invest.route('/invest/dfs/mkdir', methods=['get'], defaults={'base': PATH_DFS}, endpoint='dfs_mkdir')
@invest.route('/invest/pys/mkdir', methods=['get'], defaults={'base': PATH_PYS}, endpoint='pys_mkdir')
def mkdir(base):
    data = CodeHelper.mkdir(request.args.get('target', ''), base)
    return jsonify(data)


@invest.route('/invest/dfs/view', methods=['get'], defaults={'base': PATH_DFS}, endpoint='dfs_view')
@invest.route('/invest/pys/view', methods=['get'], defaults={'base': PATH_PYS}, endpoint='pys_view')
def pys_view(base):
    data = CodeHelper.view(request.args.get('target', ''), base, request.args)
    return jsonify(data)


@invest.route('/invest/pys/touch', methods=['get'], defaults={'base': PATH_PYS}, endpoint='pys_touch')
def pys_touch(base):
    text = request.args.get('text')
    target = request.args.get('target')
    data = CodeHelper.touch(text, target, base=base)
    return jsonify(data)


@invest.route('/invest/pys/execute', methods=['get'], defaults={'base': PATH_PYS},
              endpoint='pys_execute')
def pys_execute(base=PATH_PYS):
    files = request.args.get('files')
    data = CodeHelper.execute(files, base)
    return jsonify(data)


if __name__ == '__main__':
    pass
