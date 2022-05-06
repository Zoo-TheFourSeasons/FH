# -*- coding: utf-8 -*-
import time
from functools import wraps
from types import FunctionType


def timer(func):
    @wraps(func)
    def function_timer(*args, **kwargs):
        rel_start = time.time()
        cpu_start = time.perf_counter()
        result = func(*args, **kwargs)
        rel_cost = time.time() - rel_start
        cpu_cost = time.perf_counter() - cpu_start

        if '__code__' in dir(func):
            file_ = func.__getattribute__('__code__').co_filename
        else:
            file_ = 'builtin_function_or_method'

        s = ' '.join((file_ + '.' + func.__name__, str(rel_cost), str(cpu_cost)))
        print(s)
        return result

    return function_timer


def decorate_meta(decorator):
    class MetaDecorate(type):
        def __new__(mcs, class_name, supers, class_dict):
            for attr, attr_val in class_dict.items():
                if type(attr_val) is FunctionType:
                    class_dict[attr] = decorator(attr_val)
            return type.__new__(mcs, class_name, supers, class_dict)

    return MetaDecorate


TimerMeta = decorate_meta(timer)
