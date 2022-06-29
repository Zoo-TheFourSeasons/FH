# -*- coding: utf-8 -*-
import os
import sys
import json
import time
import base64
import shutil
import logging
import datetime
import importlib
import threading
import traceback
import subprocess
import multiprocessing

import yaml
import pandas
import paramiko
from flask import make_response
from flask_socketio import Namespace
from flask_socketio import join_room

import ins
from independence import timer

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
        self.task_id = None
        self.current_his = None

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
    def get_output_file(path_output: str, tid: str):
        folder = str(datetime.datetime.now())[:10].replace(' ', '').replace('-', '')

        path_folder = os.path.join(path_output, folder)
        if not os.path.exists(path_folder):
            os.makedirs(path_folder)

        path_file = os.path.join(path_folder, tid + '.his')
        if not os.path.exists(path_file):
            print('get a new file: ', path_file)
        return path_file

    def print(self, ob):
        # f = self.get_output_file(path_output, tid=tid)
        with open(self.current_his, 'a') as file:
            try:
                if isinstance(ob, (dict, list, tuple)):
                    ob = json.dumps(ob, indent=4)
                elif isinstance(ob, str):
                    ob = ob
                else:
                    ob = str(ob)
                file.write(ob + '\n')
                print(ob)
                if self.ns is not None:
                    self.ns.emit_signal('his', ob + '\n')
            except Exception as err:
                file.write(json.dumps({'error': str(err), 'op': str(ob)}, indent=4) + '\n')

    @staticmethod
    def __request_parser_args(args_r):
        search = args_r['search'] if 'search' in args_r and args_r['search'] else None
        sort = args_r['sort'] if 'sort' in args_r and args_r['sort'] else None
        order = args_r['order'] if 'order' in args_r and args_r['order'] else None
        offset = int(args_r['offset']) if 'offset' in args_r and args_r['offset'] else None
        limit = int(args_r['limit']) if 'limit' in args_r and args_r['limit'] else None
        return search, sort, order, offset, limit

    @classmethod
    @timer
    def listdir(cls, target: str, base: str = None, args_r: dict = None, suffix=None):
        search, _, _, offset, limit = cls.__request_parser_args(args_r)

        base = PATH_PROJECT if base is None else base
        target_abs = os.path.join(base, target)

        if search is not None:
            # search
            files = []
            for root, dirs, fns in os.walk(target_abs):
                for fn in fns:
                    if search.lower() not in fn.lower():
                        continue
                    if suffix and not fn.endswith(suffix):
                        continue
                    files.append(os.path.join(root, fn))
        else:
            files = [os.path.join(target_abs, fn) for fn in os.listdir(target_abs) if not fn.startswith('.')]
            files = [fn for fn in files if fn.endswith(suffix) or os.path.isdir(fn)] if suffix else files
        files.sort(reverse=True)
        _index = 0
        rows = []
        for _f in files:
            _index += 1
            if offset and _index <= offset:
                continue
            if limit and _index > offset + limit:
                break
            _stat = os.stat(_f)
            _ctime = _stat.st_ctime
            _mtime = _stat.st_mtime
            _size = os.path.getsize(_f) / 1024.0
            if _size > 2048:
                _size = str(round(_size / 1024.0, 1)) + 'M'
            else:
                _size = str(round(_size, 1)) + 'K'

            _, fn = os.path.split(_f)

            relative = _f.replace(base, '')
            relative = relative[1:] if relative.startswith('/') else relative
            rows.append({
                '_file': fn,
                '_isdir': os.path.isdir(_f),
                '_ctime': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(_ctime)),
                '_mtime': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(_mtime)),
                '_size': _size,
                'id': relative,
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
            return {'status': True, 'target': target, 'message': 'save successful'}
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
        _, _, _, offset, limit = cls.__request_parser_args(args_r)

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
    def __yaml_to_json(cls, target_abs):
        with open(target_abs, 'r', encoding='utf-8') as fm:
            data = yaml.safe_load(fm.read())

        jn = '.'.join((target_abs, 'json'))
        with open(jn, 'w') as fm:
            json.dump(data, fm, indent=4)
        return jn

    @classmethod
    @timer
    def view(cls, target: str, base: str = None, args_r: dict = None):
        base = PATH_PROJECT if base is None else base
        target_abs = os.path.join(base, target)
        print('view', target_abs)
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
        return {'status': True, 'message': 'mkdir success: %s' % target}

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
        today = datetime.date.today()
        current_year = today.year
        current = str(today).replace('-', '')
        for year in range(2010, current_year + 1, 1):
            for _date in ('0331', '0630', '0930', '1231'):
                _quarter = str(year) + _date
                if _quarter < current:
                    _quarters.append(_quarter)
        return _quarters

    @classmethod
    def get_executor(cls, host, user, psw):
        if host in ('127.0.0.1', 'localhost', ''):
            return lambda cmd: subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE)
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host, username=user, password=psw, timeout=3)
        return ssh.exec_command

    def file_read_specified(self, target: str, start: int, end: int, executor=None):
        # return [x for i, x in enumerate(open(target, 'r')) if start <= i + 1 <= end]
        _, stdout, stderr = executor("sed -n '%s,%sp' %s" % (start, end, target))
        rsp = stdout.read().decode()
        self.print('  LOG: %s\n%s' % (target, rsp))
        return rsp

    @staticmethod
    def file_get_count(target: str, executor=None):
        _, stdout, stderr = executor('grep -c "" %s' % target)
        rsp = stdout.read().decode()
        rsp = int(rsp.strip())
        # self.print('file_get_count: %s' % rsp)
        return rsp

    @staticmethod
    def mkdir_if_not_exist(path: str):
        if os.path.exists(path) and os.path.isdir(path):
            return
        print('makedirs: %s' % path)
        os.makedirs(path)

    @staticmethod
    def _yaml_func_replace(__v, __running):
        # replace {{}}
        if '{{' not in __v or '}}' not in __v:
            return __v
        prefix, suffix = __v.split('{{', 1)
        c = 0
        while '}}' in suffix:
            target, suffix = suffix.split('}}', 1)
            value = {}
            value.update(__running)
            targets = target.split('.')
            for i, key in enumerate(targets):
                print('i, c', i, c)
                if i < c:
                    continue

                if key in value:
                    value = value[key]
                    print('match', key)
                    continue
                # key contains '.', such as 12.EPG.12-1R1N1S-N1S1.LOCAL.id
                matched = False
                key_n = key
                for n in range(i + 1, len(targets), 1):
                    key_n = '.'.join((key_n, targets[n]))
                    if key_n in value:
                        value = value[key_n]
                        c = n + 1
                        matched = True
                        print('match .', key_n)
                        break
                if matched:
                    continue
                # []
                if '[' in key and key.endswith(']'):
                    key, index = key.split('[', 1)
                    index, _ = index.split(']', 1)
                    value = value[key]
                    value = value[int(index)]
                    print('match []', key)
                else:
                    raise ValueError('CANNOT FIND: %s, %s in __running' % (target, key))
            prefix += value
        return prefix + suffix

    @staticmethod
    def _yaml_func_transform(__v, __running):
        # transform --
        if '--' not in __v:
            return __v
        __v = __v.strip()
        values = {}
        # --name vpn.01.ext1 --shared True --router:external True
        items = __v.split('--')
        items = [i.strip() for i in items if i.strip()]
        for i in items:
            kv = i.strip().split(' ', 1)
            if len(kv) != 2:
                key, value = kv[0], ''
            else:
                key, value = kv
            # print('key: "%s", value: "%s"' % (key, value))
            values[key] = value
        return values

    @classmethod
    def _yaml_display_params(cls, __params, __running, __yaml_func):
        if isinstance(__params, str):
            return __yaml_func(__params, __running)
        if isinstance(__params, (list, tuple, dict)):
            items = __params.items() if isinstance(__params, dict) else enumerate(__params)
            for i, v in items:
                if isinstance(v, str):
                    __params[i] = __yaml_func(v, __running)
                elif isinstance(v, (dict, list, tuple)):
                    __params[i] = cls._yaml_display_params(v, __running, __yaml_func)
                else:
                    pass
        return __params

    @classmethod
    def yaml_to_g6_tree(cls, target: str, base: str = None):
        base = PATH_PROJECT if base is None else base
        target_abs = os.path.join(base, target)
        print('yaml_to_g6_tree', target_abs)
        with open(target_abs, 'r', encoding='utf-8') as f:
            meta_scanned_resources = yaml.safe_load(f)

        for host in meta_scanned_resources.keys():
            pass


class WebSocketHelper(Namespace, CodeHelper):

    def __init__(self, *args, **kwargs):
        CodeHelper.__init__(self)
        Namespace.__init__(self, *args, **kwargs)
        self.actions = {}

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

    def on_task(self, data):
        # is_parallel = data['is_parallel']
        print('data:', data)
        self.socketio.start_background_task(
            self.backgrounds, data
        )

    def backgrounds(self, data):
        kid = data['kid']
        if kid:
            self.update_progress({'kid': kid, 'progress': 0})
            print('progress', 0)

        action = data['action']
        try:
            self.actions[action](data)
        except Exception as e:
            print('his:', e)
            print(traceback.print_exc())
            self.emit_signal('his', str(e))
            self.emit_signal('his', traceback.print_exc())

        if kid:
            print('progress', 100)
            self.update_progress({'kid': kid, 'progress': 100})


class ProcessHelper(multiprocessing.Process):

    def __init__(self, func, *args, **kwargs):
        super(ProcessHelper, self).__init__()
        self.func = func
        self.args = args
        self.kwargs = kwargs

    def run(self) -> None:
        self.func(*self.args, **self.kwargs)


if __name__ == '__main__':
    pass
