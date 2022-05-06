import os

import pandas

import invest.ins as ins
from independence import timer
from invest.cons import PATH_DFS, PATH_PYS


def init_folders():
    for path in (PATH_DFS, PATH_PYS,):
        if not os.path.exists(path):
            os.makedirs(path)
            print('makedirs: %s' % path)


def cache_dfs():
    @timer
    def read_dfs(target_abs):
        stat = os.stat(target_abs)

        # filter by size of 1M
        size_m = os.path.getsize(target_abs) / 1024.0 / 1024.0
        if size_m < 1.0:
            return

        ins.ins_dfs_cache[target_abs] = {
            'df': pandas.read_excel(target_abs),
            'st_mtime': stat.st_mtime
        }
        print('cache_dfs: %s' % target_abs)

    for root, dirs, files in os.walk(PATH_DFS):
        for _file in files:
            if not _file.endswith('.xlsx') and not _file.endswith('.xls'):
                continue
            read_dfs(os.path.join(root, _file))


inits = [init_folders, ]
