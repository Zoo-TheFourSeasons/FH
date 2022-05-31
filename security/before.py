import os

from security.cons import APPS


def init_folders():
    for app, fds in APPS.items():
        for fd, path in fds.items():
            if not os.path.exists(path):
                os.makedirs(path)
                print('makedirs: %s' % path)


inits = [init_folders, ]
