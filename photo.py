# -*- coding: utf-8 -*-
# !/bin/python3

import os
import json
import math

from PIL import Image, ImageStat, ExifTags

from base import CodeHelper
from independence import timer

PATH_PROJECT = os.path.dirname(os.path.abspath(__file__))


class PhotoHelper(CodeHelper):
    positions = (
        'bottom right', 'bottom center', 'bottom left',
        'top right', 'top center', 'top left',
    )

    def __init__(self):
        # 水印放置位置
        self.position_ink = 'bottom right'
        # 水印大小
        self.ratio_ink = 500
        # 黑水印路径
        self.path_ink_black = None
        # 白水印路径
        self.path_ink_white = None
        # 黑白水印阈值
        self.threshold_lighting = 120
        #
        self.site = None

    @classmethod
    @timer
    def rotate(cls, target: str, path_out: str):
        print('rotate')
        path_in = os.path.join(PATH_PROJECT, target)
        path_out = os.path.join(PATH_PROJECT, path_out)
        if not os.path.exists(path_in):
            raise ValueError('path: %s is not exist' % path_in)

        cls.mkdir_if_not_exist(path_out)

        def _do(_path_file):
            print('_do', _path_file)

            image = Image.open(_path_file)
            _, _f = os.path.split(_path_file)
            _path = os.path.join(path_out, _f)

            if hasattr(image, '_getexif'):  # only present in JPEGs
                orientation = None
                for k, v in ExifTags.TAGS.items():
                    if v == 'Orientation':
                        orientation = k
                        break
                if orientation:
                    e = image._getexif()  # returns None if no EXIF data
                    if e:
                        exif = dict(e.items())
                        orientation = exif[orientation] if orientation in exif else None

                        if orientation == 3:
                            image = image.transpose(Image.ROTATE_180)
                        elif orientation == 6:
                            image = image.transpose(Image.ROTATE_270)
                        elif orientation == 8:
                            image = image.transpose(Image.ROTATE_90)
                        else:
                            pass
                    pass
                pass
            pass
            image.save(_path)

        # file
        if os.path.isfile(path_in):
            _do(path_in)
            return

        # folder
        if os.path.isdir(path_in):
            for f in os.listdir(path_in):
                _do(os.path.join(path_in, f))
            return

    @classmethod
    @timer
    def resize(cls, target: str, path_out: str,
               size_max: int = 1800, _format: str = None):
        # 调整尺寸, 保持长宽比
        print('resize')
        path_in = os.path.join(PATH_PROJECT, target)
        path_out = os.path.join(PATH_PROJECT, path_out)
        if not os.path.exists(path_in):
            raise ValueError('path: %s is not exist' % path_in)

        cls.mkdir_if_not_exist(path_out)

        def _do(_path_file):
            print('_do', _path_file)
            try:
                im = Image.open(_path_file)
                width, height = im.size

                if width >= height:
                    height = int(height / (width / size_max))
                    width = size_max
                else:
                    width = int(width / (height / size_max))
                    height = size_max

                _, _f = os.path.split(_path_file)
                _path = os.path.join(path_out, _f)
                im = im.resize((width, height))

                im.save(_path, _format) if _format else im.save(_path)

            except Exception as e:
                print("cannot convert", _path_file, e)

        # file
        if os.path.isfile(path_in):
            _do(path_in)
            return

        # folder
        if os.path.isdir(path_in):
            for f in os.listdir(path_in):
                _do(os.path.join(path_in, f))
            return

        # link or other
        print('path: %s is a link or other file' % path_in)
        return

    @timer
    def ink(self, target: str, path_out: str):
        # 添加水印
        print('ink')
        path_in = os.path.join(PATH_PROJECT, target)
        path_out = os.path.join(PATH_PROJECT, path_out)

        if not os.path.exists(path_in):
            raise ValueError('path: %s is not exist' % path_in)

        if self.position_ink not in self.positions:
            raise ValueError('position error')
        if not os.path.exists(self.path_ink_white):
            raise ValueError('path_ink_white not exist')

        if not os.path.exists(self.path_ink_black):
            raise ValueError('path_ink_black not exist')

        self.mkdir_if_not_exist(path_out)

        def _do(_path_file):
            print('_do', _path_file)
            try:
                im = Image.open(_path_file)
                im_width = im.size[0]
                im_high = im.size[1]

                watermark = Image.open(self.path_ink_white)
                watermark_width = watermark.size[0]
                watermark_high = watermark.size[1]

                # 根据水印放大比率调整水印大小
                watermark_high = int(self.ratio_ink / watermark_width * watermark_high)
                watermark_width = self.ratio_ink
                # print(watermark_width, watermark_high)
                watermark = watermark.resize((watermark_width, watermark_high),
                                             resample=Image.ANTIALIAS)

                # 下居中
                if self.position_ink == 'bottom center':
                    left, top = int((im_width - watermark_width) / 2), im_high - watermark_high
                # 下居左
                elif self.position_ink == 'bottom left':
                    left, top = 10, im_high - watermark_high
                # 下居右
                elif self.position_ink == 'bottom right':
                    left, top = im_width - watermark_width, im_high - watermark_high
                # 上居中
                elif self.position_ink == 'top center':
                    left, top = int((im_width - watermark_width) / 2), 10
                # 上居左
                elif self.position_ink == 'top left':
                    left, top = 10, 10
                # 上居右
                else:
                    left, top = (im_width - watermark_width, 10)

                # 获取水印区域
                right, bottom = left + watermark_width, top + watermark_high
                area = im.crop((left, top, right, bottom))
                stat = ImageStat.Stat(area)
                r, g, b = stat.rms
                lighting = math.sqrt(0.241 * (r ** 2) + 0.691 * (g ** 2) + 0.068 * (b ** 2))

                # print(lighting)
                # use black
                if lighting >= self.threshold_lighting:
                    # print('use black')
                    watermark = Image.open(self.path_ink_black)
                    watermark = watermark.resize((watermark_width, watermark_high),
                                                 resample=Image.ANTIALIAS)

                with open('lighting.py.info', 'a') as lf:
                    lf.write(_path_file + ':' + str(lighting) + '\n')

                # with open(self.file_lighting, 'r') as fff:
                #     lighting = json.load(fff)
                # self.lighting[_path_file] = math.sqrt(0.241 * (r ** 2) + 0.691 * (g ** 2) + 0.068 * (b ** 2))
                #
                # with open(self.file_lighting, 'w') as fff:
                #     json.dump(lighting, fff)

                layer = Image.new('RGBA', im.size, (0, 0, 0, 0))
                layer.paste(watermark, (left, top))
                out = Image.composite(layer, im, layer)
                _, _f = os.path.split(_path_file)
                _path = os.path.join(path_out, _f)
                out.save(_path)
            except Exception as e:
                print("cannot convert", _path_file, e)

        # file
        if os.path.isfile(path_in):
            _do(path_in)
            return

        # folder
        if os.path.isdir(path_in):
            for f in os.listdir(path_in):
                _do(os.path.join(path_in, f))
            return

    @classmethod
    @timer
    def create_thumbnail(cls, path_in: str, path_out: str, size: tuple = (640, 360)):
        # 创建略缩图
        print('create_thumbnail')
        if not os.path.exists(path_in):
            raise ValueError('path: %s is not exist' % path_in)

        cls.mkdir_if_not_exist(path_out)

        def _do(_path_file):
            print('_do', _path_file)

            try:
                im = Image.open(_path_file)
                width, height = im.size

                width_16_9 = width
                height_16_9 = int(width_16_9 / 16.0 * 9.0)
                _size = (
                    0,
                    int((height - height_16_9) / 2),
                    width_16_9,
                    int((height - height_16_9) / 2) + height_16_9
                )
                region = im.crop(_size)
                # region.resize(size)
                region.thumbnail(size)
                _, _f = os.path.split(_path_file)
                _path = os.path.join(path_out, _f)
                region.save(_path + '.webp', 'WEBP')
            except Exception as e:
                print("cannot convert", _path_file, e)

        # file
        if os.path.isfile(path_in):
            _do(path_in)
            return

        # folder
        if os.path.isdir(path_in):
            for f in os.listdir(path_in):
                _do(os.path.join(path_in, f))
            return

        # link or other
        print('path: %s is a link or other file' % path_in)
        return

    @classmethod
    @timer
    def transfer_jpg_to_webp(cls, path_in: str, path_out: str):
        # JPG转WEBP
        print('transfer_jpg_to_webp')
        if not os.path.exists(path_in):
            raise ValueError('path: %s is not exist' % path_in)

        cls.mkdir_if_not_exist(path_out)

        def _do(_path_file):
            print('_do', _path_file)

            try:
                _p, _f = os.path.split(_path_file)
                _file_fix = _f

                _path_fix = os.path.join(_p, _file_fix)
                if _f != _file_fix:
                    os.rename(_path_file, _path_fix)
                _path_dst = os.path.join(path_out, _file_fix)
                if _path_dst[-4:] in ('.jpg', '.mpg', '.png'):
                    _path_dst = _path_dst[:-4]
                if _path_dst.endswith('.mpeg'):
                    _path_dst = _path_dst[:-5]
                Image.open(_path_fix).convert("RGB").save(_path_dst + '.webp', 'WEBP')
            except Exception as e:
                print("cannot convert", _path_file, e)

        # file
        if os.path.isfile(path_in):
            _do(path_in)
            return

        # folder
        if os.path.isdir(path_in):
            for f in os.listdir(path_in):
                _do(os.path.join(path_in, f))
            return

        # link or other
        print('path: %s is a link or other file' % path_in)
        return

    @timer
    def render_md_with_info(self, path_in: str, path_out: str, file_page_info: str, mds: list):
        # 渲染页面单个页面
        print('render_md_with_info')
        if not self.site:
            raise ValueError('site is empty')
        # todo: windows file system does not match
        # folder = path_in.split('/')[-1]
        _, folder = os.path.split(path_in)

        # 加载页面信息文件
        if not os.path.exists(file_page_info):
            raise ValueError('file_page_info not exist:', file_page_info)
        with open(file_page_info, 'r', encoding='utf-8') as f:
            page_info = json.load(f)

        if folder not in page_info:
            raise KeyError('page info not exist: %s' % path_in)

        info = page_info[folder]

        path_out_head, tail = os.path.split(path_out)
        self.mkdir_if_not_exist(path_out_head)

        if not os.path.exists(path_in) or not os.path.isdir(path_in):
            print('path: %s is not exist or is not dir' % path_in)
            return

        md_head, md_item, md_tail = mds

        photos_description = info['photos_description']
        md = md_head.format(author=info['author'],
                            remark=info['remark'],
                            date=info['date'])

        # 先对文件按照名称排序
        path_in_files = os.listdir(path_in)
        path_in_files.sort()

        for f in path_in_files:
            # /home/xxx/static/images/webp/zzz/a.webp
            path_abs_f = os.path.join(path_in, f)
            # size = round(os.path.getsize(path_abs_f) / 1024 / 1024, 2)
            # size_str = 'size: %sM' % size

            # url_home/static/images/webp/zzz/a.webp
            if 'static/images/' not in path_abs_f:
                path = path_abs_f[path_abs_f.find('static\\images\\'):].replace('\\', '/')
            else:
                path = path_abs_f[path_abs_f.find('static/images/'):]

            # 照片描述
            i_description = photos_description[f] if f in photos_description else ''
            item = md_item.format(
                # size=size_str,
                name=f,
                photo_description=i_description,
                path='/' + self.site + '/' + path)
            md += item

        md += md_tail
        with open(os.path.join(path_out_head, tail), 'w') as f:
            f.write(md)
        return

    @timer
    def render_md_with_pages(self, path_in: str, path_out: str, md_item: str):
        print('render_md_with_info')
        # todo
        # if not self.site:
        #     print('site is empty')
        #     return
        # # folder = path_in.split('/')[-1]
        # _, folder = os.path.split(path_in)
        #
        # path_out_head, tail = os.path.split(path_out)
        # self.mkdir_if_not_exist(path_out_head)
        #
        # if not os.path.exists(path_in) or not os.path.isdir(path_in):
        #     print('path: %s is not exist or is not dir' % path_in)
        #     return
        #
        # md = ''
        #
        # # 先对文件按照名称排序
        # path_in_files = os.listdir(path_in)
        # path_in_files.sort()
        #
        # for f in path_in_files:
        #     # /home/xxx/static/images/webp/zzz/a.webp
        #     path_abs_f = os.path.join(path_in, f)
        #
        #     # url_home/static/images/webp/zzz/a.webp
        #     if 'static/images/' not in path_abs_f:
        #         path = path_abs_f[path_abs_f.find('static\\images\\'):].replace('\\', '/')
        #     else:
        #         path = path_abs_f[path_abs_f.find('static/images/'):]
        #
        #     # 照片描述
        #     item = md_item.format(
        #         name=f,
        #         path='/' + self.site + '/' + path)
        #     md += item
        #
        # with open(os.path.join(path_out_head, tail), 'w') as f:
        #     f.write(md)
        # return

    @classmethod
    @timer
    def render_home_page(cls, path_in: str, path_template_home: str,
                         path_template_div: str, path_page_info: str,
                         path_index: str, path_order_render: str):
        # 渲染主页面
        print('render_home_page', path_in)

        for _path in (path_in, path_template_home,
                      path_template_div, path_page_info, path_order_render):
            if not os.path.exists(_path):
                raise ValueError('path: %s is not exist' % _path)

        with open(path_page_info, 'r', encoding='utf-8') as f:
            page_info = json.load(f)
        with open(path_template_div, 'r', encoding='utf-8') as f:
            div_page = f.read()
        with open(path_template_home, 'r', encoding='utf-8') as f:
            home = f.read()
        with open(path_order_render, 'r', encoding='utf-8') as f:
            rendered = json.load(f)

        pages = ''
        # 逆序
        for page in rendered:
            if page not in page_info:
                raise KeyError('page info: %s is not exist' % page)

            info = page_info[page]
            path_author = info['path_author']
            path_resize = info['path_resize']
            author = info['author']
            remark = info['remark']
            title = info['title']
            date = info['date']
            thumbnail = info['thumbnail']
            path_thumbnail = '/'.join(('static/images', path_resize, path_author, thumbnail))
            path_md = '/'.join(('mds', path_resize, path_author))

            pages += div_page.format(
                path_md=path_md,
                author=author,
                title=title,
                date=date,
                path_thumbnail=path_thumbnail,
                remark=remark
            )
        home = home % pages
        # 写入
        with open(path_index, 'w', encoding='utf-8') as f:
            f.write(home)

    @staticmethod
    @timer
    def create_page_info(path_in: str, path_page_info: str, ignore_rendered: bool = True):
        # 创建页面信息
        print('create_page_info', path_in)
        # page_info = {
        #     # dir: {'title': title, 'author': author,
        #     #       'date': date, 'description': description
        #     #       'folder': folder
        #     #      }
        # }
        # 页面信息文件不存在, 则创建
        if not os.path.exists(path_page_info):
            with open(path_page_info, 'w', encoding='utf-8') as f:
                json.dump({}, f)

        with open(path_page_info, 'r', encoding='utf-8') as f:
            page_info = json.load(f)

        # 更新页面信息
        for root, dirs, files in os.walk(path_in):
            # 跳过子目录
            if not files:
                continue

            _, folder = os.path.split(root)
            # folder = root.split('/')[-1]
            # 跳过已渲染
            if ignore_rendered and folder in page_info:
                print('ignore', folder)
                continue
            print('create_page_info', folder)
            author = folder[8:]
            date = folder[:8]
            path_author = root.replace(path_in, '')
            page_info[folder] = {
                'thumbnail': '',
                'title': '',
                'author': author,
                'date': date,
                'remark': '',
                'path_resize': 'webp-resize-2000',
                'path_author': path_author,
                'photos_description': {
                }
            }
            page_info[folder]['photos_description'] = dict([(i, i) for i in files])

        # 保存页面信息
        # todo: 按目录名称降序排序
        with open(path_page_info, 'w', encoding='utf-8') as f:
            json.dump(page_info, f, indent=4, ensure_ascii=False, sort_keys=True)
        return

    @timer
    def rotate_resize_add_ink(self, path_in: str, path_out: str):
        print('rotate_resize_add_ink')
        if not os.path.exists(path_in):
            raise ValueError('path: %s is not exist' % path_in)

        def _do(_path_in, _path_out):
            print('_do', _path_in)
            self.rotate(_path_in, _path_out)
            self.resize(_path_out, _path_out)
            self.ink(_path_out, _path_out)

        pass
        # file
        if os.path.isfile(path_in):
            _do(path_in, path_out)
            return

        # folder
        if os.path.isdir(path_in):
            for root, dirs, files in os.walk(path_in):
                # 跳过子目录
                if not files:
                    continue
                __path_out = os.path.join(path_out, os.path.relpath(root, path_in))
                print('__path_out', __path_out)
                _do(root, __path_out)


if __name__ == '__main__':
    pass
    # hp = HelloPhoto()
    # hp.ratio_ink = 500
    # hp.position_ink = 'bottom right'
    # hp.path_ink_white = '/home/zoo/_L/Zoo-HZ-Media-Volunteers/_files/white.png'
    # hp.path_ink_black = '/home/zoo/_L/Zoo-HZ-Media-Volunteers/_files/black.png'
    # hp.rotate_resize_W(
    #     r'/home/zoo/_L/Zoo-HZ-Media-Volunteers/static/images/raw',
    #     r'/home/zoo/_L/Zoo-HZ-Media-Volunteers/static/images/webp-resize-1800-ink'
    # )
