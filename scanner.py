import os

from base import CodeHelper
from independence import timer

PATH_PROJECT = os.path.dirname(os.path.abspath(__file__))


class ScanHelper(CodeHelper):

    def __init__(self):
        pass

    @classmethod
    @timer
    def scan_by_tsunami(
            cls, path_data, path_source, jar, location, ip_v4_target, output_format):
        jar = os.path.join(path_source, jar)
        location = os.path.join(path_source, location)
        plugins = os.path.join(path_source, 'plugins/*')

        out_filename = ScanHelper.get_output_file_split_by_time(
            path_output=path_data, folder=ip_v4_target, precision='ns', suffix='.info'
        )
        cmd = 'java -cp "%s:%s"' \
              ' -Dtsunami-config.location=%s' \
              ' com.google.tsunami.main.cli.TsunamiCli' \
              ' --ip-v4-target=%s' \
              ' --scan-results-local-output-format=%s' \
              ' --scan-results-local-output-filename=%s' % (
                  jar, plugins, location, ip_v4_target, output_format, out_filename)
        print(cmd)
        shell = cls.run_in_subprocess(cmd, None)
        return shell
