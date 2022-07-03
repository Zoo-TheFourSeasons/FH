def func_add_allow_nodes(_, _command):
    """
    add allow nodes for /etc/chrony.conf
    :return: None
    """
    # env = _command['env']
    # nodes = [env['%IP_MEMCACHED_SERVER%'],
    #          env['%IP_RABBIT_SERVER%'],
    #          env['%IP_COMPUTE_1%'],
    #          env['%IP_PLACEMENT_SERVER%'],
    #          env['%IP_HORIZON_SERVER%'],
    #          env['%IP_CONTROLLER_1%'],
    #          env['%IP_GLANCE_SERVER%'],
    #          env['%IP_KEYSTONE_SERVER%'],
    #          env['%IP_NTP_SERVER%'],
    #          env['%IP_MYSQL_SERVER%'],
    #          ]
    # # get allowed
    # allowed = []
    # for node in nodes:
    #     ip_mask = node.replace(' ', '').split('.')[:2]
    #     ip_mask += ['0.0/24']
    #     ip_mask = '.'.join(ip_mask)
    #     ip_mask = 'allow ' + ip_mask
    #     if ip_mask in allowed:
    #         continue
    #     allowed.append(ip_mask)
    #
    # _file = '/etc/chrony.conf'
    # _lines_without_comments = []
    #
    # # get conf without comments
    # with open(_file, 'r') as f:
    #     lines = f.readlines()
    #     for line in lines:
    #         # ignore comments
    #         line = line.strip()
    #         if line.startswith('#'):
    #             continue
    #         _lines_without_comments.append(line)
    # without_comments = '\n'.join(_lines_without_comments)
    #
    # # append if not contain
    # for item in allowed:
    #     if item in without_comments:
    #         continue
    #     without_comments += '\n' + item
    #
    # # write
    # with open(_file, 'w') as f:
    #     f.write(without_comments)
    pass


def func_delete_iptables(self, _command):
    # import os
    # env = _command['env']
    # _path = env['%PATH_YAML%'] + '/_files'
    # _file = os.path.join(_path, 'iptables.info')
    #
    # with open(_file, 'r') as f:
    #     # Chain INPUT (policy ACCEPT)
    #     # num  target     prot opt source               destination
    #     # 1    ACCEPT     udp  --  anywhere             anywhere             udp dpt:domain
    #     # 2    ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:domain
    #     # 3    ACCEPT     udp  --  anywhere             anywhere             udp dpt:bootps
    #     # 4    ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:bootps
    #     iptables = f.read()
    #
    # # FORWARD: ['4', '5']
    # chain_reject_map = {}
    # chains = iptables.split('\n\n')
    # for item in chains:
    #     if not item:
    #         continue
    #     rules = item.split('\n')
    #     chain = ''
    #     start_str = 'Chain '
    #     end_str = ' (policy'
    #
    #     for rule in rules:
    #         if rule.startswith('Chain '):
    #             chain = rule[rule.find(start_str) + len(start_str): rule.find(end_str)]
    #             chain_reject_map[chain] = []
    #             continue
    #         if rule.startswith('num'):
    #             continue
    #         if 'REJECT' not in rule:
    #             continue
    #         num = rule[:rule.find(' ')]
    #         chain_reject_map[chain].append(num)
    #
    # # iptables -D FORWARD 2
    # _data = []
    # for chain in chain_reject_map:
    #     # reverse
    #     for num in chain_reject_map[chain][::-1]:
    #         _data.append('iptables -D %s %s' % (chain, num))
    #
    # self.exe_sh({
    #     'title': 'Delete iptables',
    #     'type': 'SH',
    #     'cwd': None,
    #     'data': _data
    # })
    # self.exe_sh({
    #     'title': 'Show iptables grep REJECT',
    #     'type': 'SH',
    #     'cwd': None,
    #     'data': ['iptables -L --line-number | grep REJECT', ]
    # })
    pass


def func_libvirt(self, _command):
    with open('/proc/cpuinfo', 'r') as f:
        text = f.read()
    if 'vmx' in text and 'svm' in text:
        self.print('support vmx & svm')
        return
    if 'vmx' in text:
        self.print('support vmx')
        return
    if 'svm' in text:
        self.print('support svm')
        return

    self.print(_command)
    task = _command['task']
    libvirt = {'virt_type': 'qemu', }
    # cpu_mode for centos7.3
    if task['os'] == 'centos_linux_release_7.3.1611_core':
        libvirt['cpu_mode'] = 'none'

    command = {
        'type': 'CONF',
        'file': '/etc/nova/nova.conf',
        'data': {
            'libvirt': libvirt
        }
    }
    self.print('not support vmx & svm')
    self.edit_conf(command)


map_functions = {
    'func_add_allow_nodes': func_add_allow_nodes,
    'func_delete_iptables': func_delete_iptables,
    'func_libvirt': func_libvirt,
}
