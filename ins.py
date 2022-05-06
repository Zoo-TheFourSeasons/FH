from queue import Queue
import datetime

que = Queue()

opened = False
app = None


class FLOG(object):
    """
    FLOG
    """
    # 预期错误
    LEVEL_ERROR_EXCEPTED = 1
    # 意外错误
    LEVEL_ERROR_UN_EXCEPTED = 2
    # 普通消息
    LEVEL_INFO_NORMAL = 3
    # 重要的消息
    LEVEL_INFO_IMPORTANT = 4
    # 警告, 可能引起ERROR的地方
    LEVEL_WARN = 5

    LEVEL = {
        LEVEL_ERROR_EXCEPTED: '预期错误',
        LEVEL_ERROR_UN_EXCEPTED: '意外错误',
        LEVEL_INFO_NORMAL: '普通消息',
        LEVEL_INFO_IMPORTANT: '重要消息',
        LEVEL_WARN: '警告'
    }


def error_excepted(m, lo=None, func=None, put=False):
    # 预期错误
    log = {'f_level': FLOG.LEVEL_ERROR_EXCEPTED,
           'f_message': m,
           'f_local': lo,
           'f_function': func,
           'put': put
           }
    put_flog(log)


def error_un_excepted(m, lo=None, func=None, put=False):
    # 意外错误
    log = {'f_level': FLOG.LEVEL_ERROR_UN_EXCEPTED,
           'f_message': m,
           'f_local': lo,
           'f_function': func,
           'put': put
           }
    put_flog(log)


def info_normal(m, lo=None, func=None, put=False):
    # 普通消息
    pass
    log = {'f_level': FLOG.LEVEL_INFO_NORMAL,
           'f_message': m,
           'f_local': lo,
           'f_function': func,
           'put': put
           }
    put_flog(log)


def info_important(m, lo=None, func=None, put=False):
    # 重要信息
    log = {'f_level': FLOG.LEVEL_INFO_IMPORTANT,
           'f_message': m,
           'f_local': lo,
           'f_function': func,
           'put': put
           }
    put_flog(log)


def warning(m, lo=None, func=None, put=False):
    # 警告
    log = {'f_level': FLOG.LEVEL_WARN,
           'f_message': m,
           'f_local': lo,
           'f_function': func,
           'put': put
           }
    put_flog(log)


def put_flog(log):
    log['f_time'] = datetime.datetime.now()
    print('f:', log['f_function'], 'm:', log['f_message'])
    if log['f_local']:
        print('local:', log['f_local'], '\n')
    put = log.pop('put', None)
    if put:
        que.put(log)


def func_mute(_):
    # 空函数
    pass
