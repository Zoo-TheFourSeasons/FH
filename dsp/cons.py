import os

from cons import PATH_PROJECT

PATH_TASKS = os.path.join(PATH_PROJECT, 'dsp/static/task')

path_project = os.path.dirname(os.path.abspath(__file__))
path_history = os.path.join(path_project, 'history')
path_static = os.path.join(path_project, 'static')
path_package = os.path.join(path_static, 'package')
path_script = os.path.join(path_static, 'script')
path_task = os.path.join(path_static, 'task')


SIGNAL_EXCEPT = 'EXCEPT'
SIGNAL_START = 'START'
SIGNAL_ECHO = 'ECHO'
SIGNAL_END = 'END'
SIGNAL_ONLINE = 'ONLINE'

SIGNALS = (
    SIGNAL_EXCEPT,
    SIGNAL_START,
    SIGNAL_ECHO,
    SIGNAL_END,
    SIGNAL_ONLINE
)
FIELD_YAML = 'YAML'
FIELD_TASK = 'TASK'
FIELD_MESSAGE = 'MESSAGE'
FIELD_MODULES = 'modules'
FIELD_COMMANDS = 'commands'
