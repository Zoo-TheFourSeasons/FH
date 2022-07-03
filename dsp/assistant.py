import os
import time
import datetime
import json
# import functions
import subprocess
import configparser

import yaml
import requests

from base import CodeHelper

from dsp.cons import F_ID, F_EXTRACT, F_PARAM, F_PARAMS, F_RUNNING
from dsp.cons import F_REPEAT, F_RESOURCE, F_SLEEP, F_SUCCESS, F_STACKS, F_HIS_CURRENT, F_HIS_BASE
from dsp.cons import F_MODULES, F_COMMANDS, F_PASS, F_FILE, F_CWD, F_MUTE, F_TIPS, F_SCAN, F_RESOURCES
from dsp.cons import F_NODES, F_NODES_EXCLUDES, F_ROLES, F_ROLES_EXCLUDES
from dsp.cons import O_CONF, O_TEXT, O_SH, O_FUNC
from dsp.cons import O_TEXT_IF_NOT_EXIST
from dsp.cons import O_TEXT_REPLACE_THIS
from dsp.cons import O_TEXT_BY
from dsp.cons import O_TEXT_AFTER_THIS
from dsp.cons import O_TEXT_INSERT
from dsp.cons import O_TEXT_APPEND
from dsp.cons import O_TEXT_COMMENT_IT
from dsp.cons import O_TEXT_IF_LINE_STARTSWITH
from dsp.cons import APPS, PATH_PROJECT


def fix_service_providers_in_neutron_conf(func):
    def _wrapper(ins, _command):
        _file = _command[F_FILE]
        _file = _file.strip()

        if _file.endswith('neutron.conf'):
            section_name = 'service_providers'
            section_name__ = ''.join(('[', section_name, ']'))

            # get service_providers in yaml
            _data = _command[O_CONF]
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


class YFDHelper(CodeHelper):
    app = APPS['yfd']
    stacks = 'meta_stacks.yaml'

    def __init__(self):
        self.mute = False
        self.lock = False
        self.waite = True
        self.yfd = None
        self.files = None
        self.host_ssh_map = None
        self.role_hosts_map = None
        # self.env = None
        self.agent_ssh_connect = {}
        self.agent_linux_release = {}
        super(YFDHelper, self).__init__()

    @classmethod
    def _get_nodes(cls, _command, nodes_default):
        if F_NODES in _command:
            nodes = _command[F_NODES]
        if F_ROLES in _command:
            roles = _command[F_ROLES]
        if F_NODES_EXCLUDES in _command:
            nodes_ex = _command[F_NODES_EXCLUDES]
        if F_ROLES_EXCLUDES in _command:
            roles_ex = _command[F_ROLES_EXCLUDES]
        return nodes_default

    def init(self):
        pass
        # path_configure = os.path.join(self.app_yfd['data'], _args.configure)
        # with open(path_configure, 'r', encoding='utf-8') as f:
        #     _configures = yaml.safe_load(f.read())
        #
        # self.server_ip = _args.server_ip
        # self.server_port = _args.server_port
        #
        # self.yfd = _configures['yfd']
        # self.host_ssh_map = _configures['host_ssh_map']
        # self.role_hosts_map = _configures['role_hosts_map']
        # self.env = _configures['env']
        #
        # print('hosts: %s' % [(h, self.host_ssh_map[h]['ssh_ip']) for h in self.host_ssh_map.keys()])
        # self.agent_ssh_connect = {}
        # self.agent_centos_release = {}
        # # self.api_get_agent_ssh_connect()
        # # self.api_get_agent_centos_release()
        # self.server_http = 'http://%s:%s' % (_args.server_ip, _args.server_port)

    def func(self, _command):
        _data = _command[O_FUNC]
        if self.mute:
            return
        for func in _data:
            try:
                while self.lock:
                    time.sleep(1)
                functions.map_functions[func](self, _command)
            except Exception as err:
                print('error ini func: %s, e: %s' % (func, err))

    def exe_sh(self, _command):
        _cwd = _command[F_CWD] if F_CWD in _command else None
        _data = _command[O_SH]

        if _cwd:
            self.print({'print': 'work path: \n%s' % _cwd})

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
            self.print({'print': _print + '\n'})

        for cmd in _data:
            while self.lock:
                time.sleep(1)
            try:
                do(cmd)
            except Exception as err:
                self.print({'print': 'error: %s, in do(cmd): %s' % (err, cmd)})

    @fix_service_providers_in_neutron_conf
    def edit_conf(self, _command):
        _file = _command[F_FILE]
        _file_as = _file if _file in self.files else None
        _file = self.files[_file] if _file in self.files else _file

        cp = configparser.ConfigParser()
        cp.read(_file)

        _data = _command[O_CONF]
        bool_edit = False
        self.print({'print': 'edit file: \n%s\ndata: \n%s' % (_file, json.dumps(_data, indent=4))})

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
                    self.print({'print': 'ok, [%s].%s %s' % (section, option, value)})
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
                        self.print({'print': 'ok, [%s].%s %s -> %s' % (section, option, v, value)})
                    # if value is string and startswith +=
                    else:
                        value = value.strip()
                        if not value.endswith(',') and not value.endswith(':') and not value.endswith(';'):
                            self.print({'print': '!!! value missing end sign in file: %s, section: %s, %s=%s' %
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
                        self.print({'print': 'ok, [%s].%s %s -> %s' % (section, option, v, value)})

        # for debug
        if self.mute:
            return

        if not bool_edit:
            return
        # self.backup_file(_file, _file_as)
        # write
        with open(_file, 'w') as f:
            cp.write(f)

    def edit_file(self, _command, nodes_default):
        nodes = self._get_nodes(_command, nodes_default)

        _file = _command[F_FILE]
        _file_as = _file if _file in self.files else None
        _file = self.files[_file] if _file in self.files else _file

        if not os.path.exists(_file):
            self.print({'print': 'error, not exist: %s' % _file})
            return

        with open(_file, 'r') as f:
            str_file = f.read()

        bool_edit = False
        _data = _command[F_FILE]
        # self.print({'print': 'edit file: \n%s\ndata: \n%s' % (_file, json.dumps(_data, indent=4))})
        self.print({'print': 'edit file: \n%s' % _file})

        for item in _data:
            while self.lock:
                time.sleep(1)

            # insert A after B
            if O_TEXT_AFTER_THIS in item and O_TEXT_INSERT in item:
                has_edit, str_file = self._file_insert(str_file, item)
            # replace A by B
            elif O_TEXT_REPLACE_THIS in item and O_TEXT_BY in item:
                has_edit, str_file = self._file_replace(str_file, item)
            # append A
            elif O_TEXT_APPEND in item:
                has_edit, str_file = self._file_append(str_file, item)
            # comment line, if line startswith A
            elif O_TEXT_IF_LINE_STARTSWITH in item and O_TEXT_COMMENT_IT in item:
                has_edit, str_file = self._file_comment(str_file, item)
            else:
                raise ValueError('data error: %s' % item)
            if has_edit:
                bool_edit = True

        # for debug
        if self.mute:
            return

        if not bool_edit:
            self.print({'print': 'edit pass for file: %s' % _file})
            return

        # self.backup_file(_file, _file_as)

        with open(_file, 'w') as f:
            f.write(str_file)
        self.print({'print': 'edit file: %s' % _file})

    def _file_insert(self, _str_file, _item):
        _if_not_exist = _item[O_TEXT_IF_NOT_EXIST]
        _after_this = _item[O_TEXT_AFTER_THIS]
        _insert = _item[O_TEXT_INSERT]

        self.print({'print': 'if not exist: "' + _if_not_exist + '"\n'
                            + 'then, after this: "' + _after_this + '"\n'
                            + 'insert: "' + _insert + '"'})

        if _if_not_exist in _str_file or _after_this not in _str_file:
            return False, _str_file

        tmp = _str_file.replace(_after_this, _after_this + _insert)
        return True, tmp

    def _file_replace(self, _str_file, _item):
        _if_not_exist = _item[O_TEXT_IF_NOT_EXIST]
        _replace_this = _item[O_TEXT_REPLACE_THIS]
        _by = _item[O_TEXT_BY]
        self.print({'print': 'if not exist: "' + _if_not_exist + '"\n'
                            + 'then, replace this: "' + _replace_this + '"\n'
                            + 'by: "' + _by + '"'})

        if _if_not_exist in _str_file or _replace_this not in _str_file:
            return False, _str_file

        tmp = _str_file.replace(_replace_this, _by)
        return True, tmp

    def _file_append(self, _str_file, _item):
        _if_not_exist = _item[O_TEXT_IF_NOT_EXIST]
        _append = _item[O_TEXT_APPEND]

        self.print({'print': 'if not exist: "' + _if_not_exist + '"\n'
                             + 'then, append: "' + _append + '"'})

        if _if_not_exist in _str_file:
            return False, _str_file
        tmp = _str_file + _append
        return True, tmp

    def _file_comment(self, _str_file, _item):
        _if_line_startswith = _item[O_TEXT_IF_LINE_STARTSWITH]
        _comment = _item[O_TEXT_COMMENT_IT]

        self.print({'print': 'comment line: "' + _if_line_startswith + '"'})

        if not _comment:
            return False, _str_file
        lines = _str_file.split('\n')
        # todo: 过滤空格的干扰
        tmp = ['# ' + t if t.startswith(_if_line_startswith) else t for t in lines]
        if tmp != lines:
            return True, '\n'.join(tmp)
        return False, _str_file

    def __agent_service_control(self, action='restart'):
        # print('api_agent_service_control, action: %s' % action)
        #
        # if action not in ('stop', 'start', 'restart'):
        #     raise
        # response = {}
        # for host in self.host_ssh_map.keys():
        #     self.execute_cmd(host, 'systemctl %s agent' % action)
        #     output = self.execute_cmd(host, 'systemctl status agent')
        #     response[host] = output
        # return {'status': True, 'data': response}
        pass

    def __get_release_path_of_file(self, host, file_task):
        # path_centos_release = os.path.join(self.app_yfd['data'], self.agent_centos_release[host])
        # return os.path.join(path_centos_release, file_task)
        pass

    @staticmethod
    def __get_task_id(host, file_yaml):
        # return '_'.join((str(datetime.datetime.now()), host, file_yaml)). \
        #     replace(' ', '_').replace('/', '_').replace('\\', '_')
        pass

    def __build_yfd_require(self):
        print('build_yfd_require')
        built_yfd = []
        field_requires = 'requires'

        yfd = {}
        yfd.update(self.yfd)

        while yfd:
            count = len(yfd)
            for _yaml in list(yfd.keys()):
                v = yfd[_yaml]
                if field_requires not in v:
                    built_yfd.append(_yaml)
                    yfd.pop(_yaml)
                    continue
                requires = v[field_requires]
                unsatisfied = False
                for require in requires:
                    if require not in built_yfd:
                        unsatisfied = True
                        break
                if unsatisfied:
                    continue
                built_yfd.append(_yaml)
                yfd.pop(_yaml)
            if count == len(yfd):
                raise ValueError('requires ')

        yfd = []
        for task in built_yfd:
            roles = self.yfd[task]['hosts']
            hosts = []
            for role in roles:
                _hosts = self.role_hosts_map[role]
                for _host in _hosts:
                    if _host in hosts:
                        continue
                    hosts.append(_host)
            yfd.append({
                'task': task,
                'hosts': hosts,
            })
        print(yfd)
        return yfd

    def __render_yfd(self, host, file_task):
        # ft = self.__get_release_path_of_file(host, file_task)
        #
        # if not os.path.exists(ft):
        #     raise FileNotFoundError('get_rendered_task, file not found, file_task: %s' % ft)
        #
        # rendered_yfd = []
        # loaded_modules = {}
        # env = self.env[host]
        #
        # def __load_modules(_modules, _rendered_yfd):
        #     for module in _modules:
        #         path_module = os.path.join(self.app['data'], module)
        #         if not os.path.exists(path_module):
        #             raise ValueError('__load_modules, file not exist: %s' % path_module)
        #         if path_module in loaded_modules:
        #             ValueError('__load_modules, duplicated load file, file: %s' % path_module)
        #
        #         with open(path_module, 'r', encoding='utf-8') as fm:
        #             try:
        #                 _data = yaml.safe_load(fm.read())
        #             except Exception as e:
        #                 print('__load_modules error, path_module: %s, e: %s' % (path_module, e))
        #         # reload
        #         if F_MODULES in _data:
        #             modules__ = _data[F_MODULES]
        #             __load_modules(modules__, _rendered_yfd)
        #         # load
        #         else:
        #             _rendered_task = self._yaml_display_params(_data, env, self._yaml_func_replace)
        #             _task_id = self.__get_task_id(host, module)
        #             rendered_yfd.append((_task_id, _rendered_task))
        #             print('load: %s' % module)
        #         loaded_modules[path_module] = True
        #
        # with open(ft, 'r', encoding='utf-8') as s:
        #     data = yaml.safe_load(s.read())
        #     data = self._yaml_display_params(data, env, self._yaml_func_replace)
        #
        # # modules
        # if F_MODULES in data and data[F_MODULES]:
        #     modules = data[F_MODULES]
        #     __load_modules(modules, rendered_yfd)
        #
        # # commands
        # if F_COMMANDS in data and data[F_COMMANDS]:
        #     rendered_task = self._yaml_display_params(data, env, self._yaml_func_replace)
        #     task_id = self.__get_task_id(host, file_task)
        #     rendered_yfd.append((task_id, rendered_task))
        # return rendered_yfd
        pass

    def __execute_yaml_on_host(self, host, path_file):
        # rendered_yfd = self.__render_yfd(host, path_file)
        # for _, rendered_task in rendered_yfd:
        #     commands = rendered_task[F_COMMANDS]
        #     for item in commands:
        #         data = item['data']
        #         for cmd in data:
        #             self.execute_cmd(host, cmd)
        pass

    def __sync_file_on_host(self, host, source, dst):
        # _command = 'wget %s -O %s' % (self.server_http + source, dst)
        # self.execute_cmd(host, _command)
        pass

    def __sync_folder_on_host(self, host, source, dst):
        # print('sync_folder, source:%s, dst:%s' % (source, dst))
        # self.execute_cmd(host, 'rm -rf ' + dst)
        # self.execute_cmd(host, 'mkdir ' + dst)
        # self.execute_cmd(host, 'chmod -R 777 ' + dst)
        # # create folder
        # for root, dirs, files in os.walk(source):
        #     for _dir in dirs:
        #         _dst_folder = os.path.join(root, _dir).replace(source, '')
        #         _dst_folder = _dst_folder[1:] if _dst_folder.startswith('/') else _dst_folder
        #         _dst_folder = os.path.join(dst, _dst_folder)
        #         self.execute_cmd(host, 'mkdir -p ' + _dst_folder)
        #
        # # sync files
        # for root, dirs, files in os.walk(source):
        #     for _file in files:
        #         _source = os.path.join(root, _file)
        #         _source = _source.replace(PATH_PROJECT, '')
        #         _source = _source.replace('\\', '/')
        #         _source = _source if _source.startswith('/') else '/' + _source
        #         _dst_folder = root.replace(source, '')
        #         _dst_folder = _dst_folder[1:] if _dst_folder.startswith('/') else _dst_folder
        #         _dst_folder = os.path.join(dst, _dst_folder)
        #         _dst = os.path.join(_dst_folder, _file)
        #         self.__sync_file_on_host(host, _source, _dst)
        pass

    def execute_yfd(self, files: str, base: str = None, ns=None):
        self.ns = ns
        base = PATH_PROJECT if base is None else base

        with open(os.path.join(self.app['data'], self.stacks), 'r', encoding='utf-8') as f:
            meta_stacks = yaml.safe_load(f)

        # each file
        for fn in files.split(','):
            fp = os.path.join(base, fn)
            with open(fp, 'r', encoding='utf-8') as fm:
                try:
                    data = yaml.safe_load(fm.read())
                except Exception as e:
                    raise ValueError('run_file error, path_module: %s, e: %s' % (fn, e))
            _, fn = os.path.split(fp)
            self.task_id = self.get_task_id(fn)
            self.current_his = self.get_output_file(self.app['his'], tid=self.task_id)
            # current his
            his = {F_HIS_CURRENT: os.path.relpath(self.current_his, self.app['his']),
                   F_HIS_BASE: self.app['his']}
            with open(fp + '.his', 'w', encoding='utf-8') as fm:
                yaml.safe_dump(his, fm)
            pass
        pass
        self.task_id = task_id
        self.print({'print': '\nstart task: \n%s' % task_id})
        self.mute = True if F_MUTE in task and task[F_MUTE] else False
        commands = task[F_COMMANDS]
        for command in commands:
            _tips = command[F_TIPS] if F_TIPS in command else ''
            self.print({'print': '\n### %s' % _tips})

            if F_PASS in command and command[F_PASS]:
                print('pass: %s' % _tips)
                continue

            _cwd = command[F_CWD] if F_CWD in command else None
            _data = {F_MUTE: self.mute, F_CWD: _cwd, 'task': task, 'env': {}}
            try:
                _data.update(command)
                # execute
                self.yfd[_type](_data)
            except Exception as err:
                self.print({'print': 'error: %s, in data: %s' % (err, _data)})


class YFTHelper(CodeHelper):
    meta = 'meta.yaml'
    stacks = 'meta_stacks.yaml'
    resources = 'meta_scanned_resources.yaml'

    app = APPS['yft']

    def __get_auth_token(self, service='identity'):
        rsp = requests.post(
            self.services[service] + '/auth/tokens',
            headers={'Content-Type': 'application/json'},
            data=json.dumps({
                "auth": {
                    "identity": {
                        "methods": [
                            "password"
                        ],
                        "password": {
                            "user": {
                                "name": self.name,
                                "domain": {
                                    "name": self.domain
                                },
                                "password": self.password
                            }
                        }
                    }
                }
            })
        )
        result = rsp.headers['x-subject-token']
        self.print('TOKEN: %s' % result)
        return result

    def __get_tn_session(self, service='tn'):
        if not self.tn_installed:
            return None
        tns = requests.Session()
        rsp = tns.post(
            self.services[service] + '/auth/',
            headers={'Accept': 'application/json, text/plain, */*',
                     'Content-Type': 'application/json;charset=UTF-8'},
            json={"username": self.name, "password": self.password}
        )
        self.print('   TN: %s\n' % rsp.status_code)
        return tns

    def generate_apis_for_test(self, apis):

        def __request(method, service, uri, data):
            url = self.services[service] + uri
            if method == 'get' and url.endswith('/'):
                url = url[:-1]

            self.print(method.upper().rjust(5, ' ') + ': ' + url)
            self.print(' DATA: %s' % data)

            if service == 'tn':
                # request with session for tn
                if method in ('get', 'patch'):
                    return self.tn_session.request(method, url, headers=self.header_with_token, params=data)
                return self.tn_session.request(method, url, headers=self.header_with_token, json=data)
            # request with token for openstack
            if method in ('get', 'patch'):
                return requests.request(method, url, headers=self.header_with_token, params=data)
            return requests.request(method, url, headers=self.header_with_token, json=data)

        def __api(m, s, r):
            # @warp_requests_for_json
            def ___api(data):
                pid = data.pop('pid', None) if data else None
                return __request(m, s, r.format(pid=pid) if pid else r, data)

            return ___api

        def __api_id(m, s, r):
            # @warp_requests_for_json
            def ___api(data):
                _id = data.pop('id', None)
                pid = data.pop('pid', None) if data else None
                if _id:
                    return __request(m, s, (r.format(pid=pid) if pid else r) + _id, data)
                return __request(m, s, (r.format(pid=pid) if pid else r), data)

            return ___api

        for sv, api_rs in apis.items():
            if sv in ('STACKS', 'MODULES'):
                continue
            for api, rs in api_rs.items():
                self.__apis__[sv + '_list_' + api] = __api('get', sv, rs)
                self.__apis__[sv + '_create_' + api] = __api('post', sv, rs)
                self.__apis__[sv + '_show_' + api] = __api_id('get', sv, rs)
                self.__apis__[sv + '_patch_' + api] = __api_id('patch', sv, rs)
                self.__apis__[sv + '_update_' + api] = __api_id('put', sv, rs)
                self.__apis__[sv + '_delete_' + api] = __api_id('delete', sv, rs)

    def api(self, service, operate, resource):
        return self.__apis__['_'.join((service, operate, resource))]

    def init(self, **kwargs):
        print('init', kwargs)
        self.device = kwargs.pop('device')
        self.name = str(kwargs.pop('name'))
        self.password = str(kwargs.pop('password'))  # psw 123456 maybe int !!!, and so on, name\domain
        self.domain = str(kwargs.pop('domain', 'default'))
        self.tn_installed = kwargs.pop('tn_installed', False)
        self.services = {
            'identity': 'http://%s:5000/v3' % self.device,
            'compute': 'http://%s:8774/v2.1' % self.device,
            'network': 'http://%s:9696/v2.0' % self.device,
            'image': 'http://%s:9292/v2' % self.device,
            'tn': 'http://%s/tristack/v1' % self.device,
        }
        self.auth_token = self.__get_auth_token()
        self.tn_session = self.__get_tn_session()
        self.header_with_token = {'Content-Type': 'application/json',
                                  'X-Auth-Token': self.auth_token}
        self.__apis__ = {}
        with open(os.path.join(self.app['data'], self.meta), 'r', encoding='utf-8') as f:
            self.generate_apis_for_test(yaml.safe_load(f))

    def __init__(self):
        self.device = None
        self.name = None
        self.password = None
        self.domain = None
        self.tn_installed = None
        self.services = None
        self.auth_token = None
        self.tn_session = None
        self.header_with_token = None
        self.__apis__ = {}
        self.task_id = 'empty'
        self.current_his = None
        super(YFTHelper, self).__init__()

    def execute_yft(self, files: str, base: str = None, ns=None):
        self.ns = ns
        base = PATH_PROJECT if base is None else base

        with open(os.path.join(self.app['data'], self.stacks), 'r', encoding='utf-8') as f:
            meta_stacks = yaml.safe_load(f)

        # each file
        for fn in files.split(','):
            fp = os.path.join(base, fn)
            with open(fp, 'r', encoding='utf-8') as fm:
                try:
                    data = yaml.safe_load(fm.read())
                except Exception as e:
                    raise ValueError('run_file error, path_module: %s, e: %s' % (fn, e))
            _, fn = os.path.split(fp)
            self.task_id = self.get_task_id(fn)
            self.current_his = self.get_output_file(self.app['his'], tid=self.task_id)

            # current his
            his = {F_HIS_CURRENT: os.path.relpath(self.current_his, self.app['his']),
                   F_HIS_BASE: self.app['his']}
            with open(fp + '.his', 'w', encoding='utf-8') as fm:
                yaml.safe_dump(his, fm)
            # validate
            commands = data[F_COMMANDS]
            scan_meta = data[F_SCAN] if F_SCAN in data else False

            for command in commands:
                if F_PARAMS in command and F_PARAM in command:
                    raise ValueError("BOTH WITH PARAM & PARAMS")
                if F_ID not in command:
                    raise ValueError("WITHOUT ID: %s" % command)
                if '.' not in command[F_ID]:
                    continue
                raise ValueError("ID CANNOT CONTAIN '.'")
            if len(commands) != len(set([c[F_ID] for c in commands])):
                raise ValueError("ID MUST BE UNIQUE")

            # each stack
            stacks = data[F_STACKS]
            for node in stacks:

                # rescan meta resource
                if scan_meta:
                    self.scan_meta_resources(nodes=[node, ], ns=ns)

                stack = meta_stacks[node]
                device = stack['device']
                ssh_user = stack.pop('ssh_user', '')
                ssh_psw = stack.pop('ssh_psw', '')
                logs = stack.pop('logs', '')

                try:
                    self.init(**stack)
                except Exception as e:
                    self.print(' ERROR: init failed, %s' % e)
                    return
                # get running
                running = data[F_RUNNING] if F_RUNNING in data else {}

                # update running by meta_scanned_resources
                with open(os.path.join(self.app['data'], self.resources), 'r', encoding='utf-8') as f:
                    meta_scanned_resources = yaml.safe_load(f)
                    running.update(meta_scanned_resources[node])

                logs_monitor = stack.pop('logs_monitor', False)
                executor = self.get_ssh_executor(device, ssh_user, ssh_psw) if logs_monitor else None

                # each command
                for command in commands:
                    _id = command[F_ID] if F_ID in command else None
                    _res = command[F_RESOURCE]
                    _params = command[F_PARAMS] if F_PARAMS in command else []
                    _param = command[F_PARAM] if F_PARAM in command else {}
                    _success = command[F_SUCCESS] if F_SUCCESS in command else None
                    _sleep = int(command[F_SLEEP]) if F_SLEEP in command else 1
                    _extract = command[F_EXTRACT] if F_EXTRACT in command else None
                    _repeat = int(command[F_REPEAT]) if F_REPEAT in command else 0
                    _pass = command[F_PASS] if F_PASS in command else False

                    self.print('   ID: ' + _id) if _id else None

                    if _pass:
                        self.print(' PASS: True\n')
                        continue

                    if not _params:
                        _params.append(_param)

                    # each params
                    for item in _params:
                        # record log files
                        record_start = dict([(g, self.file_get_count(g, executor)) for g in logs]) if executor else {}

                        if item:
                            item = self._yaml_display_params(item, None, self._yaml_func_transform)
                            item = self._yaml_display_params(item, running, self._yaml_func_replace)
                        time_start = time.time()
                        rsp = self.api(*_res.split(','))(item)
                        self.print(' TIME: %s %s' % (round(time.time() - time_start, 4), datetime.datetime.now()))
                        self.print(' CODE: %s' % rsp.status_code)
                        self.print(' TEXT: %s' % rsp.text)

                        if rsp.status_code == 204:
                            rsp = rsp.text
                        else:
                            try:
                                rsp = rsp.json()
                            except Exception as e:
                                rsp = {'failed': str(e)}
                            self.print(' JSON: %s' % json.dumps(rsp, indent=4))
                        # save results
                        if _id:
                            running[_id] = rsp
                        # extract
                        if _extract:
                            _extract = self._yaml_display_params(_extract, None, self._yaml_func_transform)
                            _extract = self._yaml_display_params(_extract, running, self._yaml_func_replace)
                            running.update(_extract)
                        # sleep
                        time.sleep(_sleep)
                        # logs
                        record_end = dict([(g, self.file_get_count(g, executor)) for g in logs]) if executor else None
                        for g, start in record_start.items():
                            self.file_read_specified(g, start, record_end[g], executor)
                # self.print('RUNNING: %s' % json.dumps(running, indent=4))

    def view_his_current(self, file: str, base: str = None):
        base = PATH_PROJECT if base is None else base
        fp = os.path.join(base, file)
        f = fp + '.his'
        if not os.path.exists(f):
            return {'status': False, 'message': 'there is not exist: %s' % f}
        with open(f, 'r', encoding='utf-8') as fm:
            data = yaml.safe_load(fm.read())
        his_current = data[F_HIS_CURRENT]
        his_base = data[F_HIS_BASE]
        return self.view(his_current, base=his_base)

    def scan_meta_resources(self, nodes=None, ns=None):
        self.ns = ns
        self.task_id = self.get_task_id(self.resources)
        self.current_his = self.get_output_file(self.app['his'], tid=self.task_id)
        path_resources = os.path.join(self.app['data'], self.resources)

        # meta stacks
        with open(os.path.join(self.app['data'], self.stacks), 'r', encoding='utf-8') as f:
            stacks = yaml.safe_load(f)

        # meta
        with open(os.path.join(self.app['data'], self.meta), 'r', encoding='utf-8') as f:
            meta = yaml.safe_load(f)

        # dump meta resources if not exist
        if not os.path.exists(path_resources):
            with open(path_resources, 'w', encoding='utf-8') as f:
                yaml.safe_dump({}, f)

        # update meta resources by node
        with open(path_resources, 'r', encoding='utf-8') as f:
            resources = yaml.safe_load(f)

        for node, stack in stacks.items():
            # update by nodes if nodes not empty
            if nodes and node not in nodes:
                continue

            self.init(**stack)
            resources[node] = {}
            for s, rms in meta[F_RESOURCES].items():
                for r, m in rms.items():
                    resources[node][m] = {}
                    rsp = self.api(s, 'list', r)(data={})
                    if rsp.status_code != 200:
                        resources[node][m]['_text'] = rsp.text
                        continue
                    jn = rsp.json()
                    if not jn:
                        continue
                    resources[node][m]['_json'] = jn
                    if len(jn) != 1 or not isinstance(list(jn.values())[0], list):
                        self.print('!NOTE: %s, %s\n' % (node, m))
                        continue
                    items = list(jn.values())[0]
                    for item in items:
                        key = item['name'] if 'name' in item and item['name'] else item['id']

                        # rename by order
                        i_suffix = 1
                        tmp = key
                        while tmp in resources[node][m]:
                            tmp = '-'.join((key, str(i_suffix)))
                            i_suffix += 1
                        resources[node][m][tmp] = item

                    # self.print(' CODE: %s' % rsp.status_code)
                    # self.print(' TEXT: %s' % rsp.text)
        self.print('RESOURCES: %s' % json.dumps(resources, indent=4))

        with open(path_resources, 'w', encoding='utf-8') as f:
            yaml.safe_dump(resources, f)

        his = {F_HIS_CURRENT: os.path.relpath(self.current_his, self.app['his']),
               F_HIS_BASE: self.app['his']}
        with open(path_resources + '.his', 'w', encoding='utf-8') as fm:
            yaml.safe_dump(his, fm)


if __name__ == '__main__':
    pass
