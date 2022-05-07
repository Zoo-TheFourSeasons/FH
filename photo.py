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

    @classmethod
    @timer
    def render_markdown(cls, path_media):
        path_images = os.path.join(path_media, 'images')
        path_pages = os.path.join(path_media, 'pages.info')
        path_site = os.path.join(path_media, 'site.info')

        if not os.path.exists(path_pages):
            raise ValueError('path_pages not exist:', path_pages)
        with open(path_pages, 'r', encoding='utf-8') as f:
            pages = json.load(f)

        site = open(path_site).read().strip()
        mix = os.path.join(path_images, 'mix')

        md_head = """---
layout: default
---
### 摄影: {author}
### 描述: {remark}
### 提交时间: {date}
"""
        md_item = """##### {size}, {photo_description}
![{name}]({path})

"""
        md_tail = """
[返回](/Zoo-HZ-Media-Volunteers)
"""
        for fd in os.listdir(mix):
            if fd not in pages:
                raise KeyError('page info not exist: %s' % fd)
            info = pages[fd]
            photos_description = info['photos_description']
            md = md_head.format(author=info['author'],
                                remark=info['remark'],
                                date=info['date'])
            path_in = os.path.join(mix, fd)
            path_in_files = os.listdir(path_in)
            path_in_files.sort()
            for f in path_in_files:
                # /home/xxx/images/mix/zzz/a.webp
                path_abs_f = os.path.join(path_in, f)
                size = round(os.path.getsize(path_abs_f) / 1024 / 1024, 2)
                size_str = 'size: %s M' % size
                # url_home/static/images/webp/zzz/a.webp
                if 'images/mix/' not in path_abs_f:
                    path = path_abs_f[path_abs_f.find('images\\mix\\'):].replace('\\', '/')
                else:
                    path = path_abs_f[path_abs_f.find('images/mix/'):]
                # 照片描述
                i_description = photos_description[f] if f in photos_description else ''
                item = md_item.format(
                    size=size_str,
                    name=f,
                    photo_description=i_description,
                    path=site + '/' + path)
                md += item
            md += md_tail
            with open(os.path.join(path_media, fd + '.md'), 'w') as f:
                f.write(md)

    @classmethod
    @timer
    def render_index(cls, path_in, path_index: str):
        print('render_index', path_in)
        template_div = """
                        <div class="col">
                            <div class="card shadow-sm">
                                <img class="bd-placeholder-img card-img-top" width="100%" height="225"
                                     src="{path_thumbnail}"
                                     role="img" aria-label="Placeholder: Thumbnail">
                                    <rect width="100%" height="100%" fill="#55595c"></rect>
                                    <text x="50%" y="50%" fill="#eceeef" dy=".3em"></text>
                                </img>
                                <div class="card-body">
                                    <p class="card-text">{date} {title}</p>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div class="btn-group">
                                            <a href="{path_md}"
                                               class="btn btn-sm btn-outline-secondary">查看</a>
                                        </div>
                                        <small class="text-muted">by {author}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
        """
        template_home = """
        <!DOCTYPE html>
        <!-- saved from url=(0049)https://getbootstrap.com/docs/5.0/examples/album/ -->
        <html lang="en">
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta name="description" content="">
            <meta name="author" content="ZooAtmosphereGroup and Bootstrap contributors">
            <meta name="generator" content="Hugo 0.80.0">
            <title>Zoo-HZ-Media-Volunteers</title>
            <link href="./static/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
            <link rel="manifest" href="./static/manifest.json">
            <meta name="theme-color" content="#7952b3">
            <style>
                .bd-placeholder-img {
                    font-size: 1.125rem;
                    text-anchor: middle;
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    user-select: none;
                }
                @media (min-width: 768px) {
                    .bd-placeholder-img-lg {
                        font-size: 3.5rem;
                    }
                }
            </style>
        </head>
        <body>
        <header>
            <div class="bg-dark collapse hide" id="navbarHeader" style="">
                <div class="container">
                    <div class="row">
                        <div class="col-sm-8 col-md-7 py-4">
                            <h4 class="text-white">About</h4>
                            <p class="text-muted">这里是杭州动物园媒体组志愿者摄影记录分享网站</p>
                            <p class="text-muted">2021-2022</p>
                            <p class="text-muted">关于本站(github io page), 公开仓库, 无限空间, 无限时间, 无主机和相关费用. </p>
                            <p class="text-muted">关于本站图片资源, 请勿用用于任何商业活动. 原图会经加密后存储在github, 密钥不上传. 未加密的压缩图则添加水印用于页面展示. </p>
                            <p class="text-muted">本站内资源大多使用相对路径, 如需将资源切换到其它账户站点, 可较顺利迁移. </p>
                            <p class="text-muted">当前站点, https://zooatmospheregroup.github.io/Zoo-HZ-Media-Volunteers/</p>
                        </div>
                        <div class="col-sm-4 offset-md-1 py-4">
                        </div>
                    </div>
                </div>
            </div>
            <div class="navbar navbar-dark bg-dark shadow-sm">
                <div class="container">
                    <a href="https://zooatmospheregroup.github.io/Zoo-HZ-Media-Volunteers" class="navbar-brand d-flex align-items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor"
                             stroke-linecap="round" stroke-linejoin="round" stroke-width="2" aria-hidden="false" class="me-2"
                             viewBox="0 0 24 24">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                        </svg>
                        <strong>Album</strong>
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarHeader"
                            aria-controls="navbarHeader" aria-expanded="true" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                </div>
            </div>
        </header>
        <main>
            <section class="py-5 container">
                <div class="row py-lg-5">
                    <div class="col-lg-6 col-md-8 mx-auto">
                        <h1 class="fw-light">Zoo-HZ-Media-Volunteers</h1>
                        <h1 class="fw-light">2021-2022</h1>
                        <p class="lead text-muted">WELCOME!</p>
                        <p class="lead text-muted">这里是杭州动物园媒体组志愿者摄影记录分享网站</p>
                        <p class="lead text-muted">
                            <a href="static/mds/2021plans">2021-2022媒体设计组活动计划</a>
                        </p>
                        <p class="lead text-muted">
                            <a href="static/mds/notices">志愿活动及投稿事项</a>
                        </p>
                    </div>
                </div>
            </section>
            <div class="album py-5 bg-light">
                <div class="container">
                    <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
                        %s
                    </div>
                </div>
            </div>
        </main>
        <footer class="text-muted py-5">
            <div class="container">
                <p class="float-end mb-1">
                    <a href="/">Back to top</a>
                </p>
                <p class="mb-1">Album example is © Bootstrap</p>
            </div>
        </footer>
        <script src="./static/bootstrap.bundle.min.js" crossorigin="anonymous"></script>
        </body>
        </html>
        """
        page = ''

        for media in os.listdir(path_in):
            if not media.startswith('MEDIA-'):
                continue
            path_media = os.path.join(path_in, media)
            path_pages = os.path.join(path_media, 'pages.info')
            path_images = os.path.join(path_media, 'images')
            path_mix = os.path.join(path_images, 'mix')
            path_site = os.path.join(path_media, 'site.info')
            site = open(path_site).read().strip()

            with open(path_pages, 'r', encoding='utf-8') as f:
                pages = json.load(f)

            for fd in os.listdir(path_mix):
                if fd not in pages:
                    raise KeyError('page info: %s is not exist' % fd)
                info = pages[fd]
                path_author = info['path_author']
                author = info['author']
                remark = info['remark']
                title = info['title']
                date = info['date']
                thumbnail = info['thumbnail']
                path_thumbnail = '/'.join((site, 'images/mix', path_author, thumbnail))
                path_md = '/'.join((site, path_author))

                page += template_div.format(
                    path_md=path_md,
                    author=author,
                    title=title,
                    date=date,
                    path_thumbnail=path_thumbnail,
                    remark=remark
                )
        home = template_home % page
        with open(path_index, 'w', encoding='utf-8') as f:
            f.write(home)

    @staticmethod
    @timer
    def generate_pages(path_media: str, ignore_rendered: bool = False):
        # 创建页面信息
        print('generate_pages', path_media)
        path_pages = os.path.join(path_media, 'pages.info')
        path_images = os.path.join(path_media, 'images')
        path_mix = os.path.join(path_images, 'mix')

        if not os.path.exists(path_pages):
            with open(path_pages, 'w', encoding='utf-8') as f:
                json.dump({}, f)

        with open(path_pages, 'r', encoding='utf-8') as f:
            pages = json.load(f)

        # 更新页面信息
        for root, dirs, files in os.walk(path_mix):
            # 跳过子目录
            if not files:
                continue

            _, folder = os.path.split(root)
            # folder = root.split('/')[-1]
            # 跳过已渲染
            if ignore_rendered and folder in pages:
                print('ignore', folder)
                continue
            print('create_page_info', folder)
            author = folder[8:]
            date = folder[:8]
            pages[folder] = {
                'thumbnail': '',
                'title': '',
                'author': author,
                'date': date,
                'remark': '',
                'path_author': folder,
                'photos_description': {
                }
            }
            pages[folder]['photos_description'] = dict([(i, i) for i in files])

        # 保存页面信息
        with open(path_pages, 'w', encoding='utf-8') as f:
            json.dump(pages, f, indent=4, ensure_ascii=False, sort_keys=True)
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
    hp = PhotoHelper()
    # hp.create_page_info('/home/zoo/Desktop/_Y/Zoo-HZ-Media-Volunteers/static/images/raw/2022/20220504HuangBingChan')
    #
    # hp.ratio_ink = 500
    # hp.position_ink = 'bottom right'
    # hp.path_ink_white = '/home/zoo/_L/Zoo-HZ-Media-Volunteers/_files/white.png'
    # hp.path_ink_black = '/home/zoo/_L/Zoo-HZ-Media-Volunteers/_files/black.png'
    # hp.rotate_resize_W(
    #     r'/home/zoo/_L/Zoo-HZ-Media-Volunteers/static/images/raw',
    #     r'/home/zoo/_L/Zoo-HZ-Media-Volunteers/static/images/webp-resize-1800-ink'
    # )
