# -*- coding: utf-8 -*-
import os
import sys
import json
import time
import base64
import pickle
import shutil
import logging
import datetime
import importlib
import threading
import subprocess
from datetime import date

import pandas
from flask import make_response
from flask_socketio import Namespace
from flask_socketio import join_room

from independence import timer, TimerMeta
import ins

PATH_PROJECT = os.path.dirname(os.path.abspath(__file__))
logging.getLogger('paramiko.transport').setLevel(logging.CRITICAL)


def data_paging_for_pickle(request, _ins, key_name, exclude=None, fields=None):
    items = sorted(_ins.keys())
    if 'search' in request.args and request.args['search']:
        search = request.args['search']

        items_ = []
        if fields:
            for k in fields:
                for item in items:
                    v = _ins[item][k]
                    # print('v: ' + v + ' k: ' + k + ' search: ' + search)
                    if v == search:
                        items_.append(item)
                        continue

            for item in items:
                if search in item and item not in items_:
                    items_.append(item)
        else:
            items_ = [item for item in items if search in item]
        items = items_

    # 按条件过滤
    if 'query' in request.args and request.args['query']:
        query = request.args['query']
        query = query.replace(' ', '')
        # 暂不支持or
        query_list = []
        for item in query.split('and'):
            if '>=' in item:
                operator = '>='
                ope = '__ge__'
            elif '<=' in item:
                operator = '<='
                ope = '__le__'
            elif '==' in item:
                operator = '=='
                ope = '__eq__'
            elif '!=' in item:
                operator = '!='
                ope = '__ne__'
            elif '>' in item:
                operator = '>'
                ope = '__gt__'
            elif '<' in item:
                operator = '<'
                ope = '__lt__'
            else:
                continue
            tmp = item.split(operator)
            if len(tmp) != 2:
                continue
            query_list.append((tmp[0], ope, tmp[1]))

        print(query_list)
        for name, stock in _ins.items():
            for item in query_list:
                field = item[0]
                operator = item[1]
                value = float(item[2])
                if field not in stock:
                    items.remove(name)
                    break
                if not stock[field].__getattribute__(operator)(value):
                    if name not in items:
                        break
                    items.remove(name)
                    break

    total = len(items)

    if 'sort' in request.args and 'order' in request.args:
        sort = request.args['sort']
        order = request.args['order']
        if sort and order:
            items_need_sort = (item for item in items if sort in _ins[item])
            items_cannot_sort = [item for item in items if sort not in _ins[item]]
            items_sort = ((item, _ins[item][sort]) for item in items_need_sort)
            if order == 'asc':
                items_sort = sorted(items_sort, key=lambda x: x[1])
            else:
                items_sort = sorted(items_sort, key=lambda x: x[1], reverse=True)
            items = [item[0] for item in items_sort] + items_cannot_sort

    if 'offset' in request.args and 'limit' in request.args:
        offset = request.args['offset']
        limit = request.args['limit']
        if offset and limit:
            items = items[int(offset): int(offset) + int(limit)]

    rows = []
    for item in items:
        # temp = ins[item]
        # rows.extend(temp)
        temp = _ins[item]
        if exclude:
            for ex in exclude:
                temp.pop(ex, None)

        temp.update({key_name: item, 'id': item})
        rows.append(temp)
    return total, rows


def make_response_with_headers(data):
    response = make_response(data)
    response.headers['Connection'] = 'Keep-Alive'
    response.headers['Access-Control-Allow-Credentials'] = 'true'

    return response


class CodeHelper(object):

    def __init__(self):
        self.ns = None

    @classmethod
    def run_in_subprocess(cls, _cmd, _cwd):
        shell = subprocess.Popen(
            _cmd,
            cwd=_cwd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            encoding='utf-8'
        )
        return shell

    @staticmethod
    def get_file_name_by_datetime(cls, _type: str):
        pass

    @staticmethod
    def run_threads(_func, _params: list, _max: int = 50):

        _threads = []
        for _param in _params:
            print('_param:', _param)
            _td = threading.Thread(target=_func, args=_param)
            _threads.append(_td)

        for _td in _threads:
            _td.start()

            while sum([1 for _i in _threads if _i.is_alive()]) > _max:
                time.sleep(0.5)

        for _td in _threads:
            _td.join()

    @staticmethod
    def is_linux():
        return 'linux' in sys.platform.lower()

    @staticmethod
    def get_output_file_split_by_time(
            path_output: str, folder: str = None,
            precision: str = 'ns', suffix: str = '.info'):
        """
        :param path_output: str, folder name
        :param folder: str, folder name
        :param precision: str, choice of ['day', 'hour', 'minute', 'second']
        :param suffix: str, file type
        :return: str, file path
        """
        if precision not in ('day', 'hour', 'minute', 'second', 'ns'):
            raise ValueError('precision error')
        now = str(datetime.datetime.now()). \
            replace(' ', '').replace(':', '').replace('-', '').replace('.', '')
        name_map = {
            'day': now[:8],
            'hour': now[:10],
            'minute': now[:12],
            'second': now[:14],
            'ns': now,
        }
        name_file = name_map[precision] + suffix
        path_folder = os.path.join(path_output, folder)

        # makedirs
        if not os.path.exists(path_folder):
            os.makedirs(path_folder)

        # get new file
        path_file = os.path.join(path_folder, name_file)
        if not os.path.exists(path_file):
            print('get a new file: ', path_file)
        return path_file

    @staticmethod
    def get_output_file(path_output: str, tid: str):
        folder = str(datetime.datetime.now())[:10].replace(' ', '').replace('-', '')

        path_folder = os.path.join(path_output, folder)
        if not os.path.exists(path_folder):
            os.makedirs(path_folder)

        path_file = os.path.join(path_folder, tid + '.his')
        if not os.path.exists(path_file):
            print('get a new file: ', path_file)
        return path_file

    def _print(self, path_output, tid, ob):
        f = self.get_output_file(path_output, tid=tid)
        with open(f, 'a') as file:
            try:
                if isinstance(ob, (dict, list, tuple)):
                    ob = json.dumps(ob, indent=4)
                file.write(ob + '\n')
                print(ob)
                if self.ns is not None:
                    self.ns.emit_signal('his', ob)
            except Exception as err:
                file.write(json.dumps({'error': str(err), 'op': str(ob)}, indent=4) + '\n')

    @staticmethod
    def __parser_request_args(args_r):
        search = args_r['search'] if 'search' in args_r and args_r['search'] else None
        sort = args_r['sort'] if 'sort' in args_r and args_r['sort'] else None
        order = args_r['order'] if 'order' in args_r and args_r['order'] else None
        offset = int(args_r['offset']) if 'offset' in args_r and args_r['offset'] else None
        limit = int(args_r['limit']) if 'limit' in args_r and args_r['limit'] else None
        return search, sort, order, offset, limit

    @classmethod
    @timer
    def listdir(cls, target: str, base: str = None, args_r: dict = None):
        _, _, _, offset, limit = cls.__parser_request_args(args_r)

        base = PATH_PROJECT if base is None else base
        target_abs = os.path.join(base, target)
        _index = 0
        files = [f for f in os.listdir(target_abs) if not f.startswith('.')]
        files.sort(reverse=True)
        rows = []
        for _file in files:
            _index += 1
            if offset and _index <= offset:
                continue
            if limit and _index > offset + limit:
                break
            _f = os.path.join(target_abs, _file)
            _stat = os.stat(_f)
            _ctime = _stat.st_ctime
            _mtime = _stat.st_mtime
            _size = os.path.getsize(_f) / 1024.0
            if _size > 2048:
                _size = str(round(_size / 1024.0, 1)) + 'M'
            else:
                _size = str(round(_size, 1)) + 'K'
            rows.append({
                '_file': _file,
                '_isdir': os.path.isdir(_f),
                '_ctime': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(_ctime)),
                '_mtime': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(_mtime)),
                '_size': _size,
                'id': os.path.join(target, _file),
            })
        # parents of the current path
        parents = []
        target = '../' + target
        target_split = target.split('/')
        for index in range(len(target_split)):
            parents.append({'i': target_split[index], 'i_path': '/'.join(target_split[1:index + 1])})
        return {'status': True, 'rows': rows, 'target': target, 'parents': parents, 'total': len(files)}

    @classmethod
    @timer
    def touch(cls, text: str, target: str, base: str = None):
        if not target:
            return {'status': False, 'message': 'target is required'}
        base = PATH_PROJECT if base is None else base
        target_abs = os.path.join(base, target)
        _dir = os.path.dirname(target_abs)
        if not os.path.exists(_dir):
            os.makedirs(_dir)
        try:
            with open(target_abs, 'w') as f:
                f.write(text)
                return {'status': True, 'target': target}
        except Exception as e:
            return {'status': False, 'message': 'touch failed: %s' % e}

    @classmethod
    def __view_img(cls, target_abs):
        with open(target_abs, 'rb') as f:
            b64 = 'data:;base64,' + str(base64.b64encode(f.read()))[2:-1]
            return {'status': True, 'rows': b64, 'is_image': True, 'type': 'img'}

    @classmethod
    def __view_txt(cls, target_abs):
        with open(target_abs) as f:
            return {'status': True, 'rows': f.read(), 'is_image': False, 'type': 'txt'}

    @classmethod
    def __view_xls(cls, target_abs, args_r, rounds=None):
        stat = os.stat(target_abs)
        st_mtime = stat.st_mtime

        if target_abs not in ins.ins_xls_cache:
            # add in cache
            ins.ins_xls_cache[target_abs] = {
                'df': pandas.read_excel(target_abs),
                'st_mtime': st_mtime
            }
            print('add ins_dfs_cache: %s' % target_abs)
        else:
            # update cache
            if st_mtime > ins.ins_xls_cache[target_abs]['st_mtime']:
                ins.ins_xls_cache[target_abs] = {
                    'df': pandas.read_excel(target_abs),
                    'st_mtime': st_mtime
                }
                print('update ins_dfs_cache: %s' % target_abs)
            pass
        df = ins.ins_xls_cache[target_abs]['df']
        _, _, _, offset, limit = cls.__parser_request_args(args_r)

        rows = []
        for _index, _row in df.iterrows():
            if not _index:
                continue
            if offset and _index + 2 < offset:
                continue
            if limit and _index + 2 > offset + limit:
                break
            tmp = {}
            for i, col in enumerate(df.columns):
                value = _row[i]
                if pandas.isna(value):
                    # NaN
                    tmp[col] = 'NaN'
                    continue
                if rounds:
                    # with rounds
                    for rd, keys in rounds.items():
                        if col not in keys:
                            continue
                        if rd < 1:
                            value = round(value, len(str(rd)) - 2)
                        else:
                            value = round(value / rd, 3) if value else value
                tmp[col] = str(value)
            rows.append(tmp)
        columns = [{'title': c, 'field': c, 'sortable': True, 'switchable': True} for c in df.columns]
        return {'status': True, 'rows': rows, 'total': df.shape[0], 'columns': columns, 'type': 'xls'}

    @classmethod
    @timer
    def view(cls, target: str, base: str = None, args_r: dict = None):
        base = PATH_PROJECT if base is None else base
        target_abs = os.path.join(base, target)
        if not os.path.exists(target_abs):
            return {'status': False, 'message': 'there is not exist: %s' % target, 'type': 'txt'}
        if not os.path.isfile(target_abs):
            return {'status': False, 'message': 'is not a file: %s' % target, 'type': 'txt'}

        target_lower = target.lower()
        # img
        for end in ('.jpg', '.png', '.jpeg', '.webp'):
            if target_lower.endswith(end):
                return cls.__view_img(target_abs)
        # xls
        for end in ('.xlsx', '.xls'):
            if target_lower.endswith(end):
                return cls.__view_xls(target_abs, args_r)
        # txt
        try:
            return cls.__view_txt(target_abs)
        except Exception as e:
            return {'status': False, 'message': 'unknown file: %s' % e, 'type': 'txt'}

    @classmethod
    @timer
    def delete(cls, files: str, base: str = None):
        base = PATH_PROJECT if base is None else base
        failed = []
        message = 'delete success'
        for fn in files.split(','):
            fp = os.path.join(base, fn)
            try:
                if os.path.isdir(fp):
                    shutil.rmtree(fp)
                else:
                    os.remove(fp)
            except Exception as e:
                failed.append(fp)
                message = 'failed in delete: %s' % e
        return {'status': False if failed else True, 'message': message}

    @classmethod
    def __execute_sh(cls, fp):
        pass

    @classmethod
    def __execute_py(cls, fp):
        me = importlib.import_module(fp.replace(PATH_PROJECT, '').replace('/', '.')[1:-3])
        getattr(me, 'run')()

    @classmethod
    @timer
    def execute(cls, files: str, base: str = None):
        base = PATH_PROJECT if base is None else base
        failed = []
        message = 'execute success'

        for fn in files.split(','):
            fp = os.path.join(base, fn)
            if os.path.isdir(fp):
                continue
            try:
                if fp.endswith('sh'):
                    cls.__execute_sh(fp)
                elif fp.endswith('py'):
                    cls.__execute_py(fp)
            except Exception as e:
                failed.append(fn)
                message = 'failed in execute: %s' % e
        return {'status': False if failed else True, 'message': message}

    @classmethod
    def mkdir(cls, target: str, base: str = None):
        base = PATH_PROJECT if base is None else base
        target_abs = os.path.join(base, target)
        if os.path.exists(target_abs):
            return {'status': False, 'message': 'there is exist: %s' % target}
        try:
            os.makedirs(target_abs)
        except Exception as e:
            return {'status': False, 'message': 'failed in mkdir: %s' % e}
        return {'status': False, 'message': 'mkdir success: %s' % target}

    @classmethod
    @timer
    def download(cls, target: str):
        target_abs = os.path.join(PATH_PROJECT, target)
        return target_abs

    @classmethod
    @timer
    def upload(cls, target: str):
        pass

    @staticmethod
    def quarters():
        _quarters = []
        today = date.today()
        current_year = today.year
        current = str(today).replace('-', '')
        for year in range(2010, current_year + 1, 1):
            for _date in ('0331', '0630', '0930', '1231'):
                _quarter = str(year) + _date
                if _quarter < current:
                    _quarters.append(_quarter)
        return _quarters


class Pickled(metaclass=TimerMeta):
    pick_ = None

    def __init__(self, key, value):
        self.key = key
        self.value = value

    @classmethod
    def dumps(cls, picks):
        if isinstance(cls.pick_, (tuple, list)):
            length = len(cls.pick_)
            picks_ = dict([(x, {}) for x in range(length)])
            i = 0
            for key in picks:
                picks_[i][key] = picks[key]
                i += 1
                i = i % length

            for i, key in enumerate(picks_.keys()):
                with open(cls.pick_[i], 'wb') as f:
                    pickle.dump(picks_[key], f, protocol=pickle.HIGHEST_PROTOCOL)
        else:
            with open(cls.pick_, 'wb') as f:
                pickle.dump(picks, f, protocol=pickle.HIGHEST_PROTOCOL)

    def add_item(self, key, value):
        picks = self.loads()
        if key not in picks:
            picks[key] = value

        with open(self.pick_, 'wb') as f:
            pickle.dump(picks, f)

    def add(self):
        picks = self.loads()
        if self.key not in picks:
            picks[self.key] = self.value

        with open(self.pick_, 'wb') as f:
            pickle.dump(picks, f)


class WebSocketHelper(Namespace, CodeHelper):

    def on_connect(self):
        return True

    def on_disconnect(self):
        pass

    def on_join(self, data):
        print('join: %s' % data)
        join_room(data['room'])

    def emit_signal(self, name, data):
        self.emit(name, data=data, room='progress')

    def update_progress(self, data):
        self.emit_signal('progress', data)
