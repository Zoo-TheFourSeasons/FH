# coding=utf-8
import os
import json
from io import BytesIO
# import datetime
import memcache

import pycurl
import yaml

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base

try:
    import ConfigParser

    input_func = raw_input
except Exception as _:
    import configparser as ConfigParser

    input_func = input

path_project = os.path.dirname(os.path.abspath(__file__))

OUTPUT_LEVEL_SIMPLE = 1
OUTPUT_LEVEL_DETAIL = 2
OUTPUT_LEVEL_TOP = 3


class TimeFlag(object):
    def __init__(self):
        self.flag = False


class Inspector(object):

    FIELD_MODULES = 'modules'
    FIELD_CONFIGS = 'configs'

    def __init__(self):
        self.output_level = None
        self.parser_log_hours = None
        self.module = None
        self.module_file = None
        self.configs = {}
        self.PATH_SITE_PACKAGES = None
        #
        self.files = {}

        # load setting.yaml
        _file = 'env_setting.yaml'
        path_setting = os.path.join(path_project, _file)
        if not os.path.exists(path_setting):
            raise ValueError('file not exist: %s' % path_setting)
        with open(path_setting, 'r') as f:
            setting = yaml.safe_load(f.read())
            if self.FIELD_MODULES not in setting:
                raise ValueError('modules not found in %s' % _file)

        for field in ('output_level', 'parser_log_hours', 'modules', 'PATH_SITE_PACKAGES'):
            if field not in setting:
                raise ValueError('%s not found in %s' % (field, _file))

        # load modules
        modules = setting[self.FIELD_MODULES]
        self.__load_modules(modules)

        # update files path
        self.__update_files_path(setting['PATH_SITE_PACKAGES'])
        for f, abs_f in self.files.items():
            if f in self.configs:
                self.configs[abs_f] = self.configs.pop(f)

        # set
        for field, value in setting.items():
            self.__setattr__(field, value)
        for field in ('output_level', 'parser_log_hours'):
            print('%s: %s' % (field, self.__getattribute__(field)))
        print('Inspector init end')

    def __update_files_path(self, path_site_packages):
        # update file path: f_python_neutron_client.entry_points, /usr/lib/python*/***
        self.files = {}
        list_dir = os.listdir(path_site_packages)

        # python_neutronclient-version.egg-info/entry_points.txt
        file_name = 'f_python_neutron_client.entry_points'
        if file_name not in self.files:
            tmp = [d for d in list_dir if d.startswith('python_neutronclient-') and d.endswith('.egg-info')]
            if tmp:
                d_tmp = tmp[0]
                path_tmp = os.path.join(path_site_packages, d_tmp)
                self.files[file_name] = os.path.join(path_tmp, 'entry_points.txt')

        # neutron-version.egg-info/entry_points.txt
        file_name = 'f_neutron.entry_points'
        if file_name not in self.files:
            tmp = [d for d in list_dir if d.startswith('neutron-') and d.endswith('.egg-info')]
            if tmp:
                d_tmp = tmp[0]
                path_tmp = os.path.join(path_site_packages, d_tmp)
                self.files[file_name] = os.path.join(path_tmp, 'entry_points.txt')

        # neutron_vpnaas-version.egg-info/entry_points.txt
        file_name = 'f_neutron_vpnaas.entry_points'
        if file_name not in self.files:
            tmp = [d for d in list_dir if d.startswith('neutron_vpnaas-') and d.endswith('.egg-info')]
            if tmp:
                d_tmp = tmp[0]
                path_tmp = os.path.join(path_site_packages, d_tmp)
                self.files[file_name] = os.path.join(path_tmp, 'entry_points.txt')

        # neutron_fwaas-version.egg-info/entry_points.txt
        file_name = 'f_neutron_fwaas.entry_points'
        if file_name not in self.files:
            tmp = [d for d in list_dir if d.startswith('neutron_fwaas') and d.endswith('.egg-info')]
            if tmp:
                d_tmp = tmp[0]
                path_tmp = os.path.join(path_site_packages, d_tmp)
                self.files[file_name] = os.path.join(path_tmp, 'entry_points.txt')

    def __load_modules(self, modules):
        for module in modules:
            path_module = os.path.join(path_project, module)
            if not os.path.exists(path_module):
                raise ValueError('file not exist: %s' % path_module)
            with open(path_module, 'r') as f:
                setting = yaml.safe_load(f.read())
            # reload
            if self.FIELD_MODULES in setting:
                modules__ = setting[self.FIELD_MODULES]
                self.__load_modules(modules__)
            # load
            if self.FIELD_CONFIGS in setting:
                configs = setting[self.FIELD_CONFIGS]
                for path_file in configs:
                    if path_file in self.configs:
                        raise ValueError('duplicated load file: %s, in module: %s' % (path_file, module))
                self.configs.update(configs)
                print('load: %s' % module)

    def inspect_services(self):
        services = self.__list_units()

        print('\n##1. INSPECT SERVICES:')
        openstack_related_ordered = [
            'openstack',
            'neutron',
            'mariadb',
            'httpd',
            'iptables',
            'memcached',
            'rabbitmq-server',
            'selinux',
            'firewalld',
            'libvirtd',
            'chronyd',
        ]

        related = dict(
            [(key, services[key]) for r in openstack_related_ordered for key in services if key.startswith(r)])
        related_keys = list(related.keys())
        related_keys.sort()
        related_inactive = ['\tinactive(openstack related services):']
        related_active = ['\tactive(openstack related services):']
        for key in related_keys:
            value = '\t\t\t'.join(related[key])
            if 'inactive' == related[key][1]:
                related_inactive.append('\t[service]' + value)
            else:
                related_active.append('\t[service]' + value)

        unrelated = dict([(key, services[key]) for key in services if key not in related])
        unrelated_keys = list(unrelated.keys())
        unrelated_keys.sort()
        unrelated_inactive = ['\tinactive(other services):']
        unrelated_active = ['\tactive(other services):']
        for key in unrelated_keys:
            value = '\t\t\t'.join(unrelated[key])
            if 'inactive' == unrelated[key][1]:
                unrelated_inactive.append('\t[service]' + value)
            else:
                unrelated_active.append('\t[service]' + value)
        print('\n'.join(related_inactive))
        print('\n'.join(related_active))

        if self.output_level >= OUTPUT_LEVEL_DETAIL:
            print('\n'.join(unrelated_inactive))

    def inspect_modules(self):
        print('\n##2. INSPECT MODULES:')
        result = []
        for path_file in self.configs:
            if not os.path.exists(path_file):
                result.append('\nN file not exist: %s' % path_file)
                continue
            result.append('\n### INSPECT FILE: %s' % path_file)
            cp = ConfigParser.ConfigParser()
            cp.read(path_file)
            items = self.configs[path_file]
            result += self.__inspect_conf(cp, items)
        print('\n'.join(result))

    def inspect_devices(self):
        path_file = "/etc/neutron/fwaas_driver.ini"
        result = []
        print('\n##2. INSPECT DEVICES:')
        if not os.path.exists(path_file):
            return

        cp = ConfigParser.ConfigParser()
        cp.read(path_file)

        # device connection
        for section in ('vpn', 'external_fw_fip', ):
            if self.__has_section(cp, section):
                result += self.__connect_dp_device(cp, section)
        print('\n'.join(result))

    def inspect_mysql_memcached(self):
        path_file = "/etc/neutron/neutron.conf"
        result = []
        print('\n##4. INSPECT MYSQL & MEMCACHED:')
        if not os.path.exists(path_file):
            return
        cp = ConfigParser.ConfigParser()
        cp.read(path_file)

        # # rabbitmq
        # result += __connect_rabbitmq(cp, 'DEFAULT', 'transport_url')
        # mariadb
        result += self.__connect_mysql(cp, 'database', 'connection')
        # memcached
        result += self.__connect_memcached(cp, 'keystone_authtoken', 'memcached_servers')

        print('\n'.join(result))

    @classmethod
    def inspect_logs(cls, time_threshold):
        print('\n##5. INSPECT LOG:')
        result = []
        path_folders = [
            '/var/log/neutron',
            '/var/log/nova',
            '/var/log/keystone',
            '/var/log/horizon',
            '/var/log/rabbitmq',
            '/var/log/glance',
            '/var/log/mariadb'
        ]

        for path_folder in path_folders:
            if not os.path.exists(path_folder):
                continue
            if not os.path.isdir(path_folder):
                continue

            for root, dirs, files in os.walk(path_folder):
                for f in files:
                    if not f.endswith('.log'):
                        continue
                    path_file = os.path.join(root, f)
                    result += cls.__parser_format_log(path_file, time_threshold)
        print('\n'.join(result))

    def __inspect_conf(self, cp, items):
        result = []
        func_map = {
            'require-all-options-if-section-exist': self.__conf_require_all_options_if_section_exist,
            'require-all-options': self.__conf_require_all_options,
            'require-any-sections': self.__conf_require_any_sections,
            'require-all-sections': self.__conf_require_all_sections,
            'equal-all': self.__conf_equal_all,
            'enabled-selectors': self.__conf_enabled_selectors,
            'option-contains': self.__conf_option_contains,
        }
        for func, data in items.items():
            if func not in func_map:
                print('unknown func: %s' % func)
                continue
            result += func_map[func](cp, data)
        return result

    def __conf_enabled_selectors(self, cp, data):
        # selectors:
        #    fwaas:
        #       enabled: 'True'
        #    dpwatch_listener:
        #       enabled: 'True'
        result = []
        for section, option_value in data.items():
            on_section = True
            tmp = []
            for option, value in option_value.items():
                has, v_current = self.__get_section_option(cp, section, option)
                if not has:
                    on_section = False
                    tmp.append('N selector, option miss, [%s] %s' % (section, option))
                    continue
                if v_current != value:
                    on_section = False
                    tmp.append(
                        'N selector, option not equal, [%s] %s: %s(need: %s)' % (section, option, v_current, value)
                    )
                    continue
                if self.output_level >= OUTPUT_LEVEL_DETAIL:
                    tmp.append('Y selector, option equal, [%s] %s: %s' % (section, option, value))
            if on_section:
                if self.output_level >= OUTPUT_LEVEL_DETAIL:
                    result.append('Y selector, %s on' % section)
            else:
                result.append('N selector, %s off' % section)
            result += tmp
        return result

    def __conf_require_all_options_if_section_exist(self, cp, data):
        # require-all-options-if-section-exist:
        #       svn:
        #         - 'device_ip'
        #         - 'username'
        #         - 'password'
        #       external_fw_fip:
        #         - 'device_ip'
        #         - 'username'
        #         - 'password'
        result = []
        for section, options in data.items():
            if not self.__has_section(cp, section):
                continue
            for option in options:
                has, _ = self.__get_section_option(cp, section, option)
                if not has:
                    result.append('N configure, option miss, [%s] %s' % (section, option))
                    continue
                if self.output_level > OUTPUT_LEVEL_DETAIL:
                    result.append('Y configure, option has, [%s] %s' % (section, option))
        return result

    def __conf_require_all_sections(self, cp, data):
        # require-all-sections:
        result = []
        for section in data:
            if not self.__has_section(cp, section):
                result.append('N configure, section miss, %s' % section)
                continue
            if self.output_level > OUTPUT_LEVEL_DETAIL:
                result.append('Y configure, section has, %s' % section)
        return result

    def __conf_require_any_sections(self, cp, data):
        # require-any-sections:
        result = []
        for section in data:
            if self.__has_section(cp, section):
                if self.output_level > OUTPUT_LEVEL_DETAIL:
                    result.append('Y configure, section has, %s' % section)
                return result
        result.append('N configure, section miss, %s' % ', '.join(data))
        return result

    def __conf_require_all_options(self, cp, data):
        # require-all-options:
        #       DEFAULT:
        #         - 'service_plugins'
        #         - 'api_extensions_path'
        #       database:
        #         - 'connection'
        #       keystone_authtoken:
        #         - 'memcached_servers'
        result = []
        for section, options in data.items():
            result += self.__conf_require_all_sections(cp, [section, ])
            for option in options:
                has, _ = self.__get_section_option(cp, section, option)
                if not has:
                    result.append('N configure, option miss, [%s] %s' % (section, option))
                    continue
                if self.output_level > OUTPUT_LEVEL_DETAIL:
                    result.append('Y configure, option has, [%s] %s' % (section, option))
        return result

    def __conf_equal_all(self, cp, data):
        # equal:
        #       fwaas:
        #         enabled: 'True'
        result = []
        for section, option_value in data.items():
            result += self.__conf_require_all_sections(cp, [section, ])

            for option, value in option_value.items():
                has, v_current = self.__get_section_option(cp, section, option)
                if not has:
                    result.append('N configure, option miss, [%s] %s' % (section, option))
                    continue
                if v_current != value:
                    result.append(
                        'N configure, option not equal, [%s] %s: %s(need: %s)' % (section, option, v_current, value))
                    continue
                if self.output_level >= OUTPUT_LEVEL_DETAIL:
                    result.append('Y configure, option equal, [%s] %s: %s' % (section, option, value))
        return result

    def __conf_option_contains(self, cp, data):
        # option-contain:
        #       DEFAULT:
        #         service_plugins:
        #           - nat_gateway
        #           - underlayacl
        #           - dci_connect
        #           - neutron.services.qos.qos_plugin.QoSPlugin
        result = []
        for section, options in data.items():
            result += self.__conf_require_all_sections(cp, [section, ])
            for option, values in options.items():
                has, v_current = self.__get_section_option(cp, section, option)
                if not has:
                    result.append('N configure, option miss, [%s] %s' % (section, option))
                    continue
                for value in values:
                    if value in v_current:
                        if self.output_level >= OUTPUT_LEVEL_DETAIL:
                            result.append('Y configure, option contain, [%s] %s: %s' % (section, option, value))
                        continue
                    result.append('N configure, value miss, [%s] %s: %s' % (section, option, value))
        return result

    def __list_units(self):
        buff = os.popen('systemctl list-units --all')
        """
          UNIT                                               LOAD   ACTIVE SUB       DESCRIPTION
          proc-sys-fs-binfmt_misc.automount                  loaded active running   Arbitrary Executable File Formats File System Automount Point
          multi-user.target                                  loaded active active    Multi-User System
          remote-fs.target                                   loaded active active    Remote File Systems
          phpsessionclean.timer                              loaded active waiting   Clean PHP session files every 30 mins
          systemd-tmpfiles-clean.timer                       loaded active waiting   Daily Cleanup of Temporary Directories
    
        LOAD   = Reflects whether the unit definition was properly loaded.
        ACTIVE = The high-level unit activation state, i.e. generalization of SUB.
        SUB    = The low-level unit activation state, values depend on unit type.
        127 loaded units listed. Pass --all to see loaded but inactive units, too.
        To show all installed unit files use 'systemctl list-unit-files'.
        """
        output = buff.read()
        lines = output.split('\n')
        result = {}
        for index, line in enumerate(lines):
            if index == 0:
                continue
            if not (line.startswith('●') or line.startswith('  ')):
                continue
            words = line.strip().split(' ')
            words = [w for w in words if w]
            if '●' == words[0]:
                words = words[1:]
            name = words[0]
            # load = words[1]
            # active = words[2]
            # sub = words[3]
            result[name] = words[1], words[2], words[3], name
        if self.output_level == OUTPUT_LEVEL_TOP:
            print(output)
        return result

    @staticmethod
    def __parser_format_log(path_log, time_threshold):
        flag = TimeFlag()

        def filter_by_time(line):
            if not flag.flag:
                time_line = line[:19]
                # fix line not start with time
                if ' ' in time_line and '-' in time_line and ':' in time_line and time_line.startswith('20'):
                    if time_line >= time_threshold:
                        flag.flag = True
            return flag.flag

        with open(path_log, 'r') as f:
            effective = [i for i in f.readlines() if filter_by_time(i)]
            print(path_log)
            print(len(effective))
            print(''.join(effective))
        return []

    @staticmethod
    def __get_section_option(cp, section, option):
        value = None
        if 'default' == section.lower():
            if option not in cp.defaults():
                return False, value
            value = str(cp.defaults()[option])
        else:
            if not cp.has_option(section, option):
                return False, value
            value = str(cp.get(section, option))
        return True, value

    @staticmethod
    def __has_section(cp, section):
        return False if 'default' != section.lower() and not cp.has_section(section) else True

    @classmethod
    def __connect_dp_device(cls, cp, section):
        result = []

        device_ip = cp.get(section, 'device_ip')
        username = cp.get(section, 'username')
        password = cp.get(section, 'password')
        io_bytes = BytesIO()
        curl = pycurl.Curl()
        url = "http://%s/func/web_main/api/vfw/vsyslist/vsyslist" % device_ip

        curl.setopt(pycurl.CUSTOMREQUEST, 'GET')
        curl.setopt(pycurl.URL, url)
        curl.setopt(pycurl.USERPWD, '%s:%s' % (username, password))
        curl.setopt(pycurl.HTTPHEADER, [
            'Content-Type:application/json',
            'Accept:application/json',
        ])
        curl.setopt(pycurl.WRITEFUNCTION, io_bytes.write)
        curl.setopt(pycurl.TIMEOUT, 5)
        curl.setopt(pycurl.SSL_VERIFYPEER, False)
        curl.setopt(pycurl.SSL_VERIFYHOST, False)
        try:
            curl.perform()
            value = io_bytes.getvalue().decode('utf-8')
            data = json.loads(value)
            if 'vsyslist' in data:
                result += ['Y dp_device, connect ok, %s: %s' % (section, device_ip)]
            else:
                result += ['N dp_device, connect failed, %s: %s, data: %s' % (section, device_ip, data)]
        except Exception as e:
            result += ['N dp_device, connect failed, %s: %s, e: %s' % (section, device_ip, e)]
        return result

    def __connect_mysql(self, cp, section, option):
        result = []
        has, value = self.__get_section_option(cp, section, option)
        if has:
            params = {
                'encoding': 'utf-8',
                'pool_recycle': 3600,
                'pool_size': 150,
                'max_overflow': 0}

            value = value.replace(' ', '')
            # todo: multi-value
            # mysql+pymysql://neutron:1q2w3e4r5@10.121.10.109/neutron,mysql+pymysql://neutron:1q2w3e4r5@10.121.10.108/neutron
            if ',' in value:
                pass
            try:
                engine = create_engine(value, **params)
                base = declarative_base()
                base.metadata.reflect(engine)
                tables = list(base.metadata.tables.keys())
                tables.sort()
                if self.output_level >= OUTPUT_LEVEL_DETAIL:
                    result.append('\t' + 'tables(%s):' % value.split('@')[1])
                    result += tables
                result += ['Y mysql, connect ok, server: %s' % value]
            except Exception as e:
                result += ['N mysql, connect failed, server: %s, e: %s' % (value, e)]

        return result

    @classmethod
    def __connect_memcached(cls, cp, section, option):
        result = []
        has, value = cls.__get_section_option(cp, section, option)
        if has:
            # 10.121.10.109:11211, 10.121.10.108:11211
            servers = value.replace(' ', '').split(',')
            for server in servers:
                try:
                    mc = memcache.Client([server], debug=True)
                    rsp = mc.set('__env_inspector_connect_memcached', 'ok')
                    if rsp is True:
                        result += ['Y memcached, connect ok, server: %s' % server]
                    else:
                        result += ['N memcached, connect failed, server: %s' % server]
                except Exception as e:
                    result += ['N memcached, connect failed, server: %s, e:%s' % (server, e)]
        return result


if __name__ == '__main__':

    ins = Inspector()
    ins.inspect_services()
    ins.inspect_modules()
    ins.inspect_devices()
    ins.inspect_mysql_memcached()
    # inspect_logs(threshold_time)