# -*- coding: utf-8 -*-

from flask import Blueprint
from flask import request
from flask import jsonify

from photo import PhotoHelper
from dsp.cons import PATH_TASKS

bp = Blueprint('dsp', __name__)


class Server(object):

    def __init__(self, _args):
        path_configure = os.path.join(path_project, _args.configure)
        with open(path_configure, 'r', encoding='utf-8') as f:
            _configures = yaml.safe_load(f.read())

        self.server_ip = _args.server_ip
        self.server_port = _args.server_port

        self.tasks = _configures['tasks']
        self.host_ssh_map = _configures['host_ssh_map']
        self.role_hosts_map = _configures['role_hosts_map']
        self.env = _configures['env']

        print('hosts: %s' % [(h, self.host_ssh_map[h]['ssh_ip']) for h in self.host_ssh_map.keys()])
        self.agent_ssh_connect = {}
        self.agent_centos_release = {}
        self.api_get_agent_ssh_connect()
        self.api_get_agent_centos_release()
        self.server_http = 'http://%s:%s' % (_args.server_ip, _args.server_port)

    def api_install_interpreter_for_agent(self, enforce):
        print('api_install_interpreter_for_agent')
        for host in self.agent_ssh_connect.keys():
            print('api_install_interpreter_for_agent, host: %s' % host)
            if enforce == 0 and self.__has_path_on_host(host, '/usr/lib/dsp-python'):
                continue
            self.__execute_cmd_on_host(host, 'mr -rf /var/dsp/')
            self.__execute_cmd_on_host(host, 'mkdir /var/dsp/')
            self.__execute_cmd_on_host(host, 'chmod -R 777 /var/dsp/')
            self.__execute_cmd_on_host(host, 'rm -rf /var/dsp/package')
            self.__execute_cmd_on_host(host, 'mkdir /var/dsp/package')

            self.__sync_folder_on_host(host, path_package, '/var/dsp/package/')
            self.__execute_yaml_on_host(host, 'dsp_agent/build_agent.yaml')
        return {'status': True, 'data': list(self.agent_ssh_connect.keys())}

    def api_install_agent_service(self):
        print('api_install_agent')
        _cmd = 'cp -rp /usr/lib/systemd/system/agent.service /etc/systemd/system/multi-user.target.wants/agent.service'
        response = {}
        for host in self.host_ssh_map.keys():
            print('api_install_agent_service, host: %s' % host)
            self.__agent_service_control(action='stop')
            self.__execute_cmd_on_host(host, 'rm -rf /var/dsp/')
            self.__execute_cmd_on_host(host, 'rm -rf /usr/lib/systemd/system/agent.service')
            self.__execute_cmd_on_host(host, 'rm -rf /etc/systemd/system/multi-user.target.wants/agent.service')
            self.__execute_cmd_on_host(host, 'mkdir /var/dsp/')
            self.__execute_cmd_on_host(host, 'mkdir /var/dsp/static')
            self.__execute_cmd_on_host(host, 'mkdir /var/dsp/templates')
            conf = json.dumps({'server_http': self.server_http,
                               'host': host,
                               'path_site_packages': self.env[host]['%PATH_SITE_PACKAGES%'],
                               'agent_port': '8686',
                               'agent_ip': self.host_ssh_map[host]['ssh_ip']}, indent=4)
            self.__sync_folder_on_host(host, path_script, '/var/dsp/')
            self.__execute_cmd_on_host(host, 'chmod 755 /var/dsp/agent.py')
            self.__execute_cmd_on_host(host, "echo '%s' > /var/dsp/agent.json" % conf)
            self.__execute_cmd_on_host(host, 'cp -rp /var/dsp/agent.service /usr/lib/systemd/system/agent.service')
            self.__execute_cmd_on_host(host, _cmd)
            self.__execute_cmd_on_host(host, 'systemctl daemon-reload')
            self.__execute_cmd_on_host(host, 'systemctl enable agent')
        return {'status': True, 'data': response}

    def __agent_service_control(self, action='restart'):
        print('api_agent_service_control, action: %s' % action)

        if action not in ('stop', 'start', 'restart'):
            raise
        response = {}
        for host in self.host_ssh_map.keys():
            self.__execute_cmd_on_host(host, 'systemctl %s agent' % action)
            output = self.__execute_cmd_on_host(host, 'systemctl status agent')
            response[host] = output
        return {'status': True, 'data': response}

    def api_restart_agent_service(self):
        return self.__agent_service_control(action='restart')

    def api_start_agent_service(self):
        return self.__agent_service_control(action='start')

    def api_stop_agent_service(self):
        return self.__agent_service_control(action='stop')

    def api_get_agent_ssh_connect(self):
        print('api_get_agent_ssh_connect')

        agent_ssh_connect = {}
        for host, _map in self.host_ssh_map.items():
            print('api_get_agent_ssh_connect, host: %s' % host)
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            try:
                ssh.connect(_map['ssh_ip'], _map['ssh_port'], _map['ssh_username'], _map['ssh_password'], timeout=3)
                agent_ssh_connect[host] = ssh
            except Exception as e:
                return {'status': False, 'message': 'connect error, e: %s, host_ssh_map: %s' % (e, _map)}
        self.agent_ssh_connect = agent_ssh_connect
        return self.api_get_agent_centos_release()

    def api_get_agent_centos_release(self):
        print('api_get_agent_centos_release')

        agent_centos_release = {}
        for host in self.agent_ssh_connect.keys():
            print('api_get_agent_centos_release, host: %s' % host)
            release = self.__execute_cmd_on_host(host, 'cat /etc/centos-release')
            release = release.strip().lower().replace(' ', '_').replace('(', '').replace(')', '')
            agent_centos_release[host] = release
        self.agent_centos_release = agent_centos_release
        return {'status': True, 'data': self.agent_centos_release}

    def api_run_task_on_agent(self):
        print('api_run_task_on_agent')

        built_tasks = self.__build_tasks_require()
        for built_task in built_tasks:
            file_task, hosts = built_task['task'], built_task['hosts']
            for host in hosts:
                project_path = self.tasks[file_task]['project_path']
                project_name = project_path.replace('/', '_')
                dst_project_path = '/var/dsp/' + project_name
                self.env[host]['%PATH_PROJECT%'] = dst_project_path
                rendered_tasks = self.__render_tasks(host, file_task)

                dst_release_path = os.path.join(path_task, self.agent_centos_release[host])
                src_project_path = os.path.join(dst_release_path, project_path)
                self.__sync_folder_on_host(host, src_project_path, dst_project_path)
                for task_id, rendered_task in rendered_tasks:
                    url = 'http://%s:8686/agent/run_task' % self.host_ssh_map[host]['ssh_ip']
                    data = json.dumps(rendered_task, indent=4)
                    self.output({'task_id': task_id, 'task': rendered_task}, folder='commands')
                    rsp = requests.post(url, {'task_id': task_id, 'data': data})
                    # print(rsp.json())
        return {'status': True}

    def reload_configure(self, *args, **kwargs):
        def wrap(func):
            func(self, args, kwargs)

        return wrap

    def __get_release_path_of_file(self, host, file_task):
        path_centos_release = os.path.join(path_task, self.agent_centos_release[host])
        return os.path.join(path_centos_release, file_task)

    @staticmethod
    def __get_task_id(host, file_yaml):
        return '_'.join((str(datetime.datetime.now()), host, file_yaml)). \
            replace(' ', '_').replace('/', '_').replace('\\', '_')

    def __build_tasks_require(self):
        print('build_tasks_require')
        built_tasks = []
        field_requires = 'requires'

        tasks = {}
        tasks.update(self.tasks)

        while tasks:
            count = len(tasks)
            for _yaml in list(tasks.keys()):
                v = tasks[_yaml]
                if field_requires not in v:
                    built_tasks.append(_yaml)
                    tasks.pop(_yaml)
                    continue
                requires = v[field_requires]
                unsatisfied = False
                for require in requires:
                    if require not in built_tasks:
                        unsatisfied = True
                        break
                if unsatisfied:
                    continue
                built_tasks.append(_yaml)
                tasks.pop(_yaml)
            if count == len(tasks):
                raise ValueError('requires ')

        tasks = []
        for task in built_tasks:
            roles = self.tasks[task]['hosts']
            hosts = []
            for role in roles:
                _hosts = self.role_hosts_map[role]
                for _host in _hosts:
                    if _host in hosts:
                        continue
                    hosts.append(_host)
            tasks.append({
                'task': task,
                'hosts': hosts,
            })
        print(tasks)
        return tasks

    def __render_tasks(self, host, file_task):
        ft = self.__get_release_path_of_file(host, file_task)

        if not os.path.exists(ft):
            raise FileNotFoundError('get_rendered_task, file not found, file_task: %s' % ft)

        rendered_tasks = []
        loaded_modules = {}
        env = self.env[host]

        def __load_modules(_modules, _rendered_tasks):
            for module in _modules:
                path_module = os.path.join(path_task, module)
                if not os.path.exists(path_module):
                    raise ValueError('__load_modules, file not exist: %s' % path_module)
                if path_module in loaded_modules:
                    ValueError('__load_modules, duplicated load file, file: %s' % path_module)

                with open(path_module, 'r', encoding='utf-8') as fm:
                    try:
                        _data = yaml.safe_load(fm.read())
                    except Exception as e:
                        print('__load_modules error, path_module: %s, e: %s' % (path_module, e))
                # reload
                if FIELD_MODULES in _data:
                    modules__ = _data[FIELD_MODULES]
                    __load_modules(modules__, _rendered_tasks)
                # load
                else:
                    _rendered_task = self.__display_params(env, _data)
                    _task_id = self.__get_task_id(host, module)
                    rendered_tasks.append((_task_id, _rendered_task))
                    print('load: %s' % module)
                loaded_modules[path_module] = True

        with open(ft, 'r', encoding='utf-8') as s:
            data = yaml.safe_load(s.read())
            data = self.__display_params(env, data)

        # modules
        if FIELD_MODULES in data and data[FIELD_MODULES]:
            modules = data[FIELD_MODULES]
            __load_modules(modules, rendered_tasks)

        # commands
        if FIELD_COMMANDS in data and data[FIELD_COMMANDS]:
            rendered_task = self.__display_params(self.env, data)
            task_id = self.__get_task_id(host, file_task)
            rendered_tasks.append((task_id, rendered_task))
        return rendered_tasks

    def __has_path_on_host(self, host, path):
        out = self.__execute_cmd_on_host(host, 'ls %s' % path)
        return 'No such file or directory' not in out

    def __execute_cmd_on_host(self, host, cmd, with_stdout=True):
        ssh = self.agent_ssh_connect[host]
        _, stdout, stderr = ssh.exec_command('date')
        date = stdout.read().decode()
        print('date: %s' % date)
        print('cmd: %s' % cmd)
        _, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
        if not with_stdout:
            return None
        result = stdout.read().decode()
        print(result)
        return result

    def __execute_yaml_on_host(self, host, path_file):
        rendered_tasks = self.__render_tasks(host, path_file)
        for _, rendered_task in rendered_tasks:
            commands = rendered_task[FIELD_COMMANDS]
            for item in commands:
                data = item['data']
                for cmd in data:
                    self.__execute_cmd_on_host(host, cmd)

    def __sync_file_on_host(self, host, source, dst):
        _command = 'wget %s -O %s' % (self.server_http + source, dst)
        self.__execute_cmd_on_host(host, _command)

    def __sync_folder_on_host(self, host, source, dst):
        print('sync_folder, source:%s, dst:%s' % (source, dst))
        self.__execute_cmd_on_host(host, 'rm -rf ' + dst)
        self.__execute_cmd_on_host(host, 'mkdir ' + dst)
        self.__execute_cmd_on_host(host, 'chmod -R 777 ' + dst)
        # create folder
        for root, dirs, files in os.walk(source):
            for _dir in dirs:
                _dst_folder = os.path.join(root, _dir).replace(source, '')
                _dst_folder = _dst_folder[1:] if _dst_folder.startswith('/') else _dst_folder
                _dst_folder = os.path.join(dst, _dst_folder)
                self.__execute_cmd_on_host(host, 'mkdir -p ' + _dst_folder)

        # sync files
        for root, dirs, files in os.walk(source):
            for _file in files:
                _source = os.path.join(root, _file)
                _source = _source.replace(path_project, '')
                _source = _source.replace('\\', '/')
                _source = _source if _source.startswith('/') else '/' + _source
                _dst_folder = root.replace(source, '')
                _dst_folder = _dst_folder[1:] if _dst_folder.startswith('/') else _dst_folder
                _dst_folder = os.path.join(dst, _dst_folder)
                _dst = os.path.join(_dst_folder, _file)
                self.__sync_file_on_host(host, _source, _dst)

    @staticmethod
    def __display_params(_env, _commands):

        def replace_pxp(p):
            # replace str, if it contains: %x%
            for _e in _env:
                if _e in p:
                    p = p.replace(_e, _env[_e])
            return p

        def _f(f_command):
            # replace, if it contains: %x%
            # list
            if isinstance(f_command, list):
                tmp_f_command = [] + f_command
                for i, f_value in enumerate(tmp_f_command):
                    tmp_f_command[i] = replace_pxp(f_value) if isinstance(f_value, str) else _f(f_value)
                return tmp_f_command
            # dict
            elif isinstance(f_command, dict):
                tmp_f_command = {}
                for f_key, f_value in f_command.items():
                    _key = replace_pxp(f_key)
                    f_value = replace_pxp(f_value) if isinstance(f_value, str) else _f(f_value)
                    tmp_f_command[_key] = f_value
                return tmp_f_command
            # str
            elif isinstance(f_command, str):
                f_command = replace_pxp(f_command)
                return f_command
            # other
            else:
                return f_command

        tmp = _f(_commands)
        tmp = _f(tmp)
        return tmp

    @staticmethod
    def __get_output_file(folder):
        name_file = str(datetime.datetime.now())[:13].replace(' ', '.') + '.info'

        path_folder = os.path.join(path_history, folder)
        if not os.path.exists(path_folder):
            os.makedirs(path_folder)

        path_file = os.path.join(path_folder, name_file)
        if not os.path.exists(path_file):
            print('get a new file: ', path_file)
        return path_file

    def output(self, ob, folder):
        f = self.__get_output_file(folder=folder)
        with open(f, 'a') as file:
            try:
                if isinstance(ob, (dict, list, tuple)):
                    ob = json.dumps(ob, indent=4)
                file.write(ob + '\n')
            except Exception as err:
                file.write(json.dumps({'error': str(err), 'op': str(ob)}, indent=4) + '\n')


@bp.route('/dsp/tasks/listdir', methods=['get'], endpoint='listdir')
def listdir():
    data = PhotoHelper.listdir(request.args.get('target', ''), PATH_TASKS, args_r=request.args)
    return jsonify(data)


@bp.route('/dsp/tasks/view', methods=['get'], endpoint='view')
def view():
    data = PhotoHelper.view(request.args.get('target', ''), PATH_TASKS)
    return jsonify(data)


@bp.route('/dsp/images/mkdir', methods=['get'], endpoint='mkdir')
def mkdir():
    data = PhotoHelper.mkdir(request.args.get('target', ''), PATH_TASKS)
    return jsonify(data)


@bp.route('/dsp/images/delete', methods=['get'], endpoint='delete')
def delete():
    files = request.args.get('files')
    data = PhotoHelper.delete(files, PATH_TASKS)
    return jsonify(data)


@bp.route('/dsp/agent/echo', methods=['post'], endpoint='echo')
def echo():
    __info = request.form['__info']
    info = json.loads(__info)['info']
    if info and 'print' in info:
        server.output(info['print'], folder='responses')
    return jsonify({'status': True})


@bp.route('/dsp/agent/get_agent_ssh_connect', methods=['get'],
          endpoint='get_agent_ssh_connect')
def get_agent_ssh_connect():
    return jsonify(server.get_agent_ssh_connect())


@bp.route('/dsp/agent/install_interpreter_for_agent/<int:enforce>', methods=['get'],
          endpoint='install_interpreter_for_agent')
def install_interpreter_for_agent(enforce):
    return jsonify(server.install_interpreter_for_agent(enforce))


@bp.route('/dsp/agent/install_agent_service', methods=['get'],
          endpoint='install_agent_service')
def install_agent_service():
    return jsonify(server.install_agent_service())


@bp.route('/dsp/agent/start_agent_service', methods=['get'],
          endpoint='start_agent_service')
def start_agent_service():
    return jsonify(server.start_agent_service())


@bp.route('/dsp/agent/restart_agent_service', methods=['get'],
          endpoint='restart_agent_service')
def restart_agent_service():
    return jsonify(server.restart_agent_service())


@bp.route('/dsp/agent/stop_agent_service', methods=['get'],
          endpoint='stop_agent_service')
def stop_agent_service():
    return jsonify(server.stop_agent_service())


@bp.route('/dsp/agent/run_task_on_agent', methods=['get'],
          endpoint='run_task_on_agent')
def run_task_on_agent():
    return jsonify(server.run_task_on_agent())
