import os

from security.cons import PATH_TSUNAMI


def init_folders():
    for path in (PATH_TSUNAMI, ):
        if not os.path.exists(path):
            os.makedirs(path)
            print('makedirs: %s' % path)


inits = [init_folders, ]
