# -*- coding: utf-8 -*-
from flask import Blueprint, jsonify, request

from app import socket_io
from dsp.assistant import YFDHelper, YFTHelper
from dsp.cons import APPS
from base import WebSocketHelper


class NameSpace(WebSocketHelper, YFDHelper):

    def __init__(self, *args, **kwargs):
        YFDHelper.__init__(self)
        WebSocketHelper.__init__(self, *args, **kwargs)
        self.actions = {
            'yft:execute': self.api_yft_execute,
            'yft:scan-meta-resources': self.api_yft_scan_meta_resources,
            'yfd:execute': self.api_yfd_execute,
            # 'node:linux_release': self.api_get_linux_release,
            # 'node:ssh_connect': self.api_get_ssh_connect,
            # 'node:stop_agent': self.api_stop_agent,
            # 'node:restart_agent': self.api_restart_agent,
            # 'node:install_interpreter': self.api_install_interpreter,
        }

    def api_install_interpreter(self, data):
        print('api_install_interpreter, host: %s' % host)
        # if enforce == 0 and self.has_path_on_host(host, '/usr/lib/dsp-python'):
        #     return {'status': False, 'data': list(self.agent_ssh_connect.keys())}
        # self.execute_cmd(host, 'mr -rf /var/dsp/')
        # self.execute_cmd(host, 'mkdir /var/dsp/')
        # self.execute_cmd(host, 'chmod -R 777 /var/dsp/')
        # self.execute_cmd(host, 'rm -rf /var/dsp/package')
        # self.execute_cmd(host, 'mkdir /var/dsp/package')
        # self.__sync_folder_on_host(host, path_package, '/var/dsp/package/')
        # self.__execute_yaml_on_host(host, 'dsp_agent/build_agent.yaml')
        # return {'status': True, 'data': list(self.agent_ssh_connect.keys())}

    def api_restart_agent(self, data):
        print('api_restart_agent')
        # return self.__agent_service_control(action='restart')

    def api_stop_agent(self, data):
        print('api_stop_agent')
        # return self.__agent_service_control(action='stop')

    def api_get_ssh_connect(self, data):
        print('api_get_agent_ssh_connect')
        # agent_ssh_connect = {}
        # print('api_get_agent_ssh_connect, host: %s' % host)
        # ssh = paramiko.SSHClient()
        # ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        # try:
        #     ssh.connect(_map['ssh_ip'], _map['ssh_port'], _map['ssh_username'], _map['ssh_password'], timeout=3)
        #     agent_ssh_connect[host] = ssh
        # except Exception as e:
        #     return {'status': False, 'message': 'connect error, e: %s, host_ssh_map: %s' % (e, _map)}
        # self.agent_ssh_connect = agent_ssh_connect
        # return self.api_get_node_centos_release()

    def api_get_linux_release(self, data):
        print('api_get_linux_release')

        # agent_centos_release = {}
        # for host in self.agent_ssh_connect.keys():
        #     print('api_get_linux_release, host: %s' % host)
        #     release = self.execute_cmd(host, 'cat /etc/centos-release')
        #     release = release.strip().lower().replace(' ', '_').replace('(', '').replace(')', '')
        #     agent_centos_release[host] = release
        # self.agent_centos_release = agent_centos_release
        # return {'status': True, 'data': self.agent_centos_release}

    def api_yfd_execute(self, data):
        print('api_yfd_execute')
        params = data['params']
        target = params['target']
        dsp = YFDHelper()
        dsp.execute_yfd(target, APPS['dsp']['data'], ns=self)

        # built_yfd = self.__build_yfd_require()
        # for built_task in built_yfd:
        #     file_task, hosts = built_task['task'], built_task['hosts']
        #     for host in hosts:
        #         project_path = self.yfd[file_task]['project_path']
        #         project_name = project_path.replace('/', '_')
        #         dst_project_path = '/var/dsp/' + project_name
        #         self.env[host]['%PATH_PROJECT%'] = dst_project_path
        #         rendered_yfd = self.__render_yfd(host, file_task)
        #
        #         dst_release_path = os.path.join(path_task, self.agent_centos_release[host])
        #         src_project_path = os.path.join(dst_release_path, project_path)
        #         self.__sync_folder_on_host(host, src_project_path, dst_project_path)
        #         for task_id, rendered_task in rendered_yfd:
        #             url = 'http://%s:8686/agent/run_task' % self.host_ssh_map[host]['ssh_ip']
        #             data = json.dumps(rendered_task, indent=4)
        #             self.output({'task_id': task_id, 'task': rendered_task}, folder='commands')
        #             rsp = requests.post(url, {'task_id': task_id, 'data': data})
        # return {'status': True}

    def api_yft_execute(self, data):
        # action = data['action']
        params = data['params']
        target = params['target']
        yft = YFTHelper()
        yft.execute_yft(target, APPS['yft']['data'], ns=self)
        # try:
        #     yft.run_file(target, APPS['yft']['data'], ns=self)
        # except Exception as e:
        #     # todo: fix
        #     yft.print(e)

    def api_yft_scan_meta_resources(self, data):
        # params = data['params']
        yft = YFTHelper()
        yft.scan_meta_resources(ns=self)


socket_io.on_namespace(NameSpace('/dsp'))
bp = Blueprint('dsp', __name__)


@bp.route('/dsp/yft/index', methods=['get'], defaults={'app': 'yft'}, endpoint='yft_index')
@bp.route('/dsp/yfd/index', methods=['get'], defaults={'app': 'yfd'}, endpoint='yfd_index')
def index(app):
    target = request.args.get('target', '')
    base = APPS[app]['data']
    data = YFDHelper.listdir(target, base, args_r=request.args, suffix='.yaml')
    return jsonify(data)


@bp.route('/dsp/yft/delete', methods=['get'], defaults={'app': 'yft'}, endpoint='yft_delete')
@bp.route('/dsp/yfd/delete', methods=['get'], defaults={'app': 'yfd'}, endpoint='yfd_delete')
def delete(app):
    target = request.args.get('target')
    data = YFDHelper.delete(target, APPS[app]['data'])
    return jsonify(data)


@bp.route('/dsp/yft/mkdir', methods=['get'], defaults={'app': 'yft'}, endpoint='yft_mkdir')
@bp.route('/dsp/yfd/mkdir', methods=['get'], defaults={'app': 'yfd'}, endpoint='yfd_mkdir')
def mkdir(app):
    target = request.args.get('target', '')
    base = APPS[app]['data']
    data = YFDHelper.mkdir(target, base)
    return jsonify(data)


@bp.route('/dsp/yft/view', methods=['get'], defaults={'app': 'yft', }, endpoint='yft_view')
@bp.route('/dsp/yft/view-in-table', methods=['get'], defaults={'app': 'yft'}, endpoint='yft_view_in_table')
@bp.route('/dsp/yfd/view', methods=['get'], defaults={'app': 'yfd'}, endpoint='yfd_view')
def view(app):
    target = request.args.get('target', '')
    base = APPS[app]['data']
    data = YFDHelper.view(target, base, request.args)
    return jsonify(data)


@bp.route('/dsp/yft/touch', methods=['get'], defaults={'app': 'yft'}, endpoint='yft_touch')
@bp.route('/dsp/yfd/touch', methods=['get'], defaults={'app': 'yfd'}, endpoint='yfd_touch')
def touch(app):
    text = request.args.get('text')
    target = request.args.get('target')
    base = APPS[app]['data']
    data = YFDHelper.touch(text, target, base)
    return jsonify(data)


@bp.route('/dsp/yft/history', methods=['get'], defaults={'app': 'yft'}, endpoint='yft_history')
def history(app):
    target = request.args.get('target')
    base = APPS[app]['data']
    data = YFTHelper().view_his_current(target, base)
    return jsonify(data)
