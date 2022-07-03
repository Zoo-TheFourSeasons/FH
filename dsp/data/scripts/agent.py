#!/usr/lib/dsp-python/bin/python3
# coding=utf-8
import os
import json
import datetime
import time
import subprocess
import configparser

from flask import Flask
from flask import jsonify, request
import requests

import functions

input_func = input
K_TITLE = 'title'
K_COMMANDS = 'commands'
K_OUTPUT = 'output'
K_ERROR = 'error'
K_TIPS = 'tips'
K_TYPE = 'type'
K_FILE = 'file'
K_CWD = 'cwd'
K_PASS = 'pass'
K_MUTE = 'mute'

T_FILE = 'FILE'
T_CONF = 'CONF'
T_SHS = 'SHS'
T_SH = 'SH'
T_CONFIRM = 'CONFIRM'
T_FUNC = 'FUNC'
T_TASK = 'TASK'
F_IF_NOT_EXIST = '__IF_NOT_EXIST'
F_REPLACE_THIS = '__REPLACE_THIS'
F_BY = '__BY'
F_AFTER_THIS = '__AFTER_THIS'
F_INSERT = '__INSERT'
F_APPEND = '__APPEND'
F_COMMENT_IT = '__COMMENT_IT'
F_IF_LINE_STARTSWITH = '__IF_LINE_STARTSWITH'
SIGNAL_EXCEPT = 'EXCEPT'
SIGNAL_START = 'START'
SIGNAL_ECHO = 'ECHO'
SIGNAL_END = 'END'
SIGNAL_ONLINE = 'ONLINE'

FIELD_YAML = 'YAML'
FIELD_TASK = 'TASK'
FIELD_DETAIL = 'DETAIL'
path_project = os.path.dirname(os.path.abspath(__file__))

_app = Flask(__name__)
_app.debug = True
_app.secret_key = 'V66dc5UTM6eWa8C3qgYRt12u7oiFwSrN'
_app.config.update(WTF_CSRF_SECRET_KEY='V66dc5UTM6eWa8C3qgYRt12u7oiFwSrN',
                   WTF_CSRF_TIME_LIMIT=14400,
                   WTF_CSRF_ENABLED=False,
                   PERMANENT_SESSION_LIFETIME=144000,
                   SESSION_REFRESH_EACH_REQUEST=True,
                   SEND_FILE_MAX_AGE_DEFAULT=3600,
                   FLASK_DB_QUERY_TIMEOUT=0.000001)


def fix_service_providers_in_neutron_conf(func):
    def _wrapper(ins, _command):
        _file = _command[K_FILE]
        _file = _file.strip()

        if _file.endswith('neutron.conf'):
            section_name = 'service_providers'
            section_name__ = ''.join(('[', section_name, ']'))

            # get service_providers in yaml
            _data = _command[T_CONF]
            service_providers_yaml = _data.pop(section_name, {})
            service_providers_yaml = ['='.join((k, v)) for k, v in service_providers_yaml.items()]

            # get service_providers in conf
            service_providers_conf = []
            with open(_file, 'r') as f:
                content = f.read()
                content = '\n' + content.replace(' ', '')
                items = content.split('\n' + section_name__)
                # agent.echo({'print': 'self.FIELD_DETAIL items: %s' % json.dumps(items)})
            if len(items) == 2:
                head = items[0]
                service_providers_str = items[1]
                tail = '\n'
                if '[' in service_providers_str:
                    tail += service_providers_str[service_providers_str.find('['):]
                    service_providers_str = service_providers_str[:service_providers_str.find('[')]
                service_providers_conf = service_providers_str.split('\n')
                # truncation
                with open(_file, 'w') as f:
                    f.write(head + tail)

            v = func(ins, _command)
            service_providers = list(set(service_providers_yaml + service_providers_conf))
            with open(_file, 'a') as f:
                f.write(section_name__ + '\n' + '\n'.join(service_providers))
            return v

        v = func(ins, _command)
        return v

    return _wrapper


class Agent(object):
    """
    分布式任务进程
    """

    def __init__(self, server_http, server_key, host, path_site_packages):
        # 任务函数列表
        self.yfd = {
            T_SH: self.exe_sh,
            T_FILE: self.edit_file,
            T_CONF: self.edit_conf,
            T_FUNC: self.func,
        }
        self.server_http = server_http
        self.server_key = server_key
        self.host = host
        self.mute = False
        self.waite = True
        self.files = None
        self.path_site_packages = path_site_packages
        self.task_id = None
        self.lock = False

    def api_run_task(self, task_id, task):
        self.task_id = task_id
        self.echo({'print': '\nstart task: \n%s' % task_id})
        self.mute = True if K_MUTE in task and task[K_MUTE] else False
        commands = task[K_COMMANDS]
        for command in commands:
            _tips = command[K_TIPS] if K_TIPS in command else ''
            self.echo({'print': '\n### %s' % _tips}, signal=SIGNAL_ECHO)

            if K_PASS in command and command[K_PASS]:
                print('pass: %s' % _tips)
                continue
            # _type = command[K_TYPE]
            _cwd = command[K_CWD] if K_CWD in command else None
            _data = {K_MUTE: self.mute, K_CWD: _cwd, 'task': task, 'env': {}}
            try:
                _data.update(command)
                self.update_files_path()
                # execute
                self.yfd[_type](_data)
            except Exception as err:
                self.echo({'print': 'error: %s, in data: %s' % (err, _data)}, signal=SIGNAL_EXCEPT)
        self.echo(signal=SIGNAL_END)

    def api_unlock_task(self):
        self.lock = False

    def func(self, _command):
        _data = _command[T_FUNC]
        if self.mute:
            return
        for func in _data:
            try:
                while self.lock:
                    time.sleep(1)
                functions.map_functions[func](self, _command)
            except Exception as err:
                print('error ini func: %s, e: %s' % (func, err))

    def echo(self, info=None, signal=SIGNAL_ECHO):
        __info = {
            'signal': signal,
            'host': self.host,
            'task_id': self.task_id,
            'info': info,
            'time': str(datetime.datetime.now())
        }
        if not self.server_http:
            return
        _ = requests.post(self.server_http + '/server/echo', data={'__info': json.dumps(__info, indent=4)})

    def exe_sh(self, _command):
        _cwd = _command[K_CWD] if K_CWD in _command else None
        _data = _command[T_SH]

        if _cwd:
            self.echo({'print': 'work path: \n%s' % _cwd})

        def do(__cmd):
            # wait
            if self.waite:
                time.sleep(1.5)
            # for debug
            if self.mute:
                return
            shell_cmd = subprocess.Popen(
                __cmd,
                cwd=_cwd,
                shell=True,
                stdout=subprocess.PIPE,
            )
            output, error = shell_cmd.communicate()

            _print = 'command: \n%s' % __cmd
            if output:
                output = output.decode('utf-8')
                _print += '\noutput: %s' % output
            if error:
                error = error.decode('utf-8')
                _print += '\nerror: %s' % error
            self.echo({'print': _print + '\n'})

        for cmd in _data:
            while self.lock:
                time.sleep(1)
            try:
                do(cmd)
            except Exception as err:
                self.echo({'print': 'error: %s, in do(cmd): %s' % (err, cmd)}, signal=SIGNAL_EXCEPT)

    @fix_service_providers_in_neutron_conf
    def edit_conf(self, _command):
        _file = _command[K_FILE]
        _file_as = _file if _file in self.files else None
        _file = self.files[_file] if _file in self.files else _file

        cp = configparser.ConfigParser()
        cp.read(_file)

        _data = _command[T_CONF]
        bool_edit = False
        self.echo({'print': 'edit file: \n%s\ndata: \n%s' % (_file, json.dumps(_data, indent=4))})

        for section in _data:
            while self.lock:
                time.sleep(1)

            for option, value in _data[section].items():
                if self.mute:
                    continue
                # if section not exist: add
                if not cp.has_section(section):
                    if section not in ('DEFAULT', 'default'):
                        cp.add_section(section)
                        bool_edit = True

                # if option not exist: add
                if not cp.has_option(section, option):
                    if isinstance(value, str):
                        value = value.strip()
                        if value.startswith('+='):
                            value = value[2:-1]
                    cp.set(section, option, value)
                    self.echo({'print': 'ok, [%s].%s %s' % (section, option, value)})
                    bool_edit = True
                # if option exist: modify
                else:
                    v = cp.get(section, option)
                    # if value is not string, or is string but not startswith +=
                    if not isinstance(value, str) or not value.startswith('+='):
                        if v == value:
                            continue
                        cp.set(section, option, value)
                        bool_edit = True
                        self.echo({'print': 'ok, [%s].%s %s -> %s' % (section, option, v, value)})
                    # if value is string and startswith +=
                    else:
                        value = value.strip()
                        if not value.endswith(',') and not value.endswith(':') and not value.endswith(';'):
                            self.echo({'print': '!!! value missing end sign in file: %s, section: %s, %s=%s' %
                                                (_file, section, option, value)})
                            continue
                        tmp = value[2:-1]
                        # 往空值+=时, 不带入分隔符
                        if not v:
                            value = value[2:-1]
                        # 往非空值+=时
                        else:
                            # 不包含
                            if tmp not in v:
                                # +=router,  to ,router
                                value = v + value[-1] + value[2:-1]
                                bool_edit = True
                            # 已包含
                            else:
                                value = v
                        cp.set(section, option, value)
                        self.echo({'print': 'ok, [%s].%s %s -> %s' % (section, option, v, value)})

        # for debug
        if self.mute:
            return

        if not bool_edit:
            return
        # self.backup_file(_file, _file_as)
        # write
        with open(_file, 'w') as f:
            cp.write(f)

    def edit_file(self, _command):
        _file = _command[K_FILE]
        _file_as = _file if _file in self.files else None
        _file = self.files[_file] if _file in self.files else _file

        if not os.path.exists(_file):
            self.echo({'print': 'error, not exist: %s' % _file})
            return

        with open(_file, 'r') as f:
            str_file = f.read()

        bool_edit = False
        _data = _command[T_FILE]
        # self.echo({'print': 'edit file: \n%s\ndata: \n%s' % (_file, json.dumps(_data, indent=4))})
        self.echo({'print': 'edit file: \n%s' % _file})

        for item in _data:
            while self.lock:
                time.sleep(1)

            # insert A after B
            if F_AFTER_THIS in item and F_INSERT in item:
                has_edit, str_file = self._file_insert(str_file, item)
            # replace A by B
            elif F_REPLACE_THIS in item and F_BY in item:
                has_edit, str_file = self._file_replace(str_file, item)
            # append A
            elif F_APPEND in item:
                has_edit, str_file = self._file_append(str_file, item)
            # comment line, if line startswith A
            elif F_IF_LINE_STARTSWITH in item and F_COMMENT_IT in item:
                has_edit, str_file = self._file_comment(str_file, item)
            else:
                raise ValueError('data error: %s' % item)
            if has_edit:
                bool_edit = True

        # for debug
        if self.mute:
            return

        if not bool_edit:
            self.echo({'print': 'edit pass for file: %s' % _file})
            return

        # self.backup_file(_file, _file_as)

        with open(_file, 'w') as f:
            f.write(str_file)
        self.echo({'print': 'edit file: %s' % _file})

    def _file_insert(self, _str_file, _item):
        _if_not_exist = _item[F_IF_NOT_EXIST]
        _after_this = _item[F_AFTER_THIS]
        _insert = _item[F_INSERT]

        self.echo({'print': 'if not exist: "' + _if_not_exist + '"\n'
                            + 'then, after this: "' + _after_this + '"\n'
                            + 'insert: "' + _insert + '"'})

        if _if_not_exist in _str_file or _after_this not in _str_file:
            return False, _str_file

        tmp = _str_file.replace(_after_this, _after_this + _insert)
        return True, tmp

    def _file_replace(self, _str_file, _item):
        _if_not_exist = _item[F_IF_NOT_EXIST]
        _replace_this = _item[F_REPLACE_THIS]
        _by = _item[F_BY]
        self.echo({'print': 'if not exist: "' + _if_not_exist + '"\n'
                            + 'then, replace this: "' + _replace_this + '"\n'
                            + 'by: "' + _by + '"'})

        if _if_not_exist in _str_file or _replace_this not in _str_file:
            return False, _str_file

        tmp = _str_file.replace(_replace_this, _by)
        return True, tmp

    def _file_append(self, _str_file, _item):
        _if_not_exist = _item[F_IF_NOT_EXIST]
        _append = _item[F_APPEND]

        self.echo({'print': 'if not exist: "' + _if_not_exist + '"\n'
                            + 'then, append: "' + _append + '"'})

        if _if_not_exist in _str_file:
            return False, _str_file
        tmp = _str_file + _append
        return True, tmp

    def _file_comment(self, _str_file, _item):
        _if_line_startswith = _item[F_IF_LINE_STARTSWITH]
        _comment = _item[F_COMMENT_IT]

        self.echo({'print': 'comment line: "' + _if_line_startswith + '"'})

        if not _comment:
            return False, _str_file
        lines = _str_file.split('\n')
        # todo: 过滤空格的干扰
        tmp = ['# ' + t if t.startswith(_if_line_startswith) else t for t in lines]
        if tmp != lines:
            return True, '\n'.join(tmp)
        return False, _str_file

    def update_files_path(self):
        self.files = {}
        list_dir = os.listdir(self.path_site_packages)

        # python_neutronclient-version.egg-info/entry_points.txt
        file_name = 'f_python_neutron_client_entry_points_TXT'
        if file_name not in self.files:
            tmp = [d for d in list_dir if d.startswith('python_neutronclient-') and d.endswith('.egg-info')]
            if tmp:
                d_tmp = tmp[0]
                path_tmp = os.path.join(self.path_site_packages, d_tmp)
                self.files[file_name] = os.path.join(path_tmp, 'entry_points.txt')

        # neutron-version.egg-info/entry_points.txt
        file_name = 'f_neutron_entry_points_TXT'
        if file_name not in self.files:
            tmp = [d for d in list_dir if d.startswith('neutron-') and d.endswith('.egg-info')]
            if tmp:
                d_tmp = tmp[0]
                path_tmp = os.path.join(self.path_site_packages, d_tmp)
                self.files[file_name] = os.path.join(path_tmp, 'entry_points.txt')

        # neutron_vpnaas-version.egg-info/entry_points.txt
        file_name = 'f_neutron_VPNAAS_entry_points_TXT'
        if file_name not in self.files:
            tmp = [d for d in list_dir if d.startswith('neutron_vpnaas-') and d.endswith('.egg-info')]
            if tmp:
                d_tmp = tmp[0]
                path_tmp = os.path.join(self.path_site_packages, d_tmp)
                self.files[file_name] = os.path.join(path_tmp, 'entry_points.txt')

        # neutron_fwaas-version.egg-info/entry_points.txt
        file_name = 'f_neutron_FWAAS_entry_points_TXT'
        if file_name not in self.files:
            tmp = [d for d in list_dir if d.startswith('neutron_fwaas') and d.endswith('.egg-info')]
            if tmp:
                d_tmp = tmp[0]
                path_tmp = os.path.join(self.path_site_packages, d_tmp)
                self.files[file_name] = os.path.join(path_tmp, 'entry_points.txt')


@_app.route('/agent/run_task', methods=['post'], endpoint='run_task')
def run_task():
    task_id = request.form['task_id']
    task_data = json.loads(request.form['data'])
    agent.api_run_task(task_id, task_data)
    return jsonify({'status': True, 'info': ''})


@_app.route('/agent/unlock_task', methods=['get'], endpoint='unlock_task')
def unlock_task():
    agent.api_unlock_task()
    return jsonify({'status': True, 'info': ''})


if __name__ == '__main__':
    with open(os.path.join(path_project, 'agent.json'), 'r') as ff:
        data = json.load(ff)

    _host = data['host']
    _server = data['server_http']
    _server = _server[:-1] if _server.endswith('/') else _server
    _agent_ip = data['agent_ip']
    _agent_port = data['agent_port']
    _path_site_packages = data['path_site_packages']

    agent = Agent(_server, '', _host, _path_site_packages)
    _app.run(host=_agent_ip, port=int(_agent_port), use_reloader=False)
