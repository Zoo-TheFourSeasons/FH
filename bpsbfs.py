import importlib

import cons


def get_bps_bfs(bps):
    _bps, _bfs = [], []
    for bp in cons.BPS:
        if bp not in bps:
            continue
        print('import', bp + '.bp')
        _bps.append(importlib.import_module(bp + '.bp'))
        print('import', bp + '.before')
        _bfs.append(importlib.import_module(bp + '.before'))
    return _bps, _bfs
