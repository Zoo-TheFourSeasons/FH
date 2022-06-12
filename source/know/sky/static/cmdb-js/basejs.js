$.ajaxSetup({
    cache: false
});


// 通过数据data填充表单_form(包括input, textarea, select)
function formfiller(data, _form) {
    var types = ['input', 'select', 'textarea'];
    for (var j = 0; j < types.length; j++) {
        var type = types[j];
        var objs = _form.find(type);

        for (var i = 0; i < objs.length; i++) {
            var obj = objs[i];
            var name = obj.name;

            // csrf_token
            if (name == 'csrf_token') {
                continue;
            }
            var value = data[name];
            if (type == "input" || type == "textarea") {
                obj.value = value;
            }
            else if (type == "select") {
                for (var op = 0; op < obj.options.length; op++) {
                    if (obj.options[op].value == value) {
                        obj.options[op].selected = "selected";
                        break;
                    }
                }
            }
            else {
            }
        }
    }
}


// 删除已勾选项
function deleteSelectedItems(btn, grid, url, allUpdate) {
    // url: ajax's url
    // allUpdate: all reload if allUpdate is true, else just the selected item will removed.
    var _data = getSelected(grid, false, true);

    if (_data == null) {
        return null;
    }
    _data.push({'name': 'csrf_token', 'value': $('#csrf_token')[0].value});
    $(btn).attr('disabled', 'disabled');
    //send ajax
    $.ajax({
        type: 'POST',
        url: url,
        data: _data,
        // async: true,
        success: function (rows_data) {
            if (rows_data.userdata) {
                alert(rows_data.userdata);
                $(btn).removeAttr('disabled');
                return 0;
            }
            if (allUpdate) {
                $(grid).bootstrapTable('refresh');
            }
            if (rows_data.message) {
                alert(rows_data.message);
            }

            //enable index button
            $(btn).removeAttr('disabled');
        }
    });
}


// 获取数据更新Grid
function getDataAndUpdateGrid(_button, url, method, _form, data, grid, pagingSide, modal) {
    if (_button) {
        $(_button).attr('disabled', 'disabled');
    }

    if (data.length == 0) {
        data = $(_form).serializeArray();
    }

    $.ajax({
        type: method,
        url: url,
        async: true,
        data: data,
        success: function (rows_data) {
            if (rows_data.userdata) {
                alert(rows_data.userdata);
                if (_button) {
                    $(_button).removeAttr('disabled');
                }
                return 0;
            }
            if (rows_data.message) {
                alert(rows_data.message);
            }

            else {
                if (_form) {
                    $(_form)[0].reset();
                }
            }
            if (modal) {
                $(modal).modal('hide');
            }

            if (_button) {
                $(_button).removeAttr('disabled');
            }

            if (grid) {
                if (pagingSide == 'server') {
                    $(grid).bootstrapTable('refresh');
                }
                else {
                    $(grid).bootstrapTable('load', rows_data.rows);

                }
            }
        }
    });
}


// 显示消息
function showMessage(_button, url, method, data) {
    $(_button).attr('disabled', 'disabled');
    $.ajax({
        type: method,
        url: url,
        data: data,
        async: true,
        success: function (rows_data) {
            if (rows_data.userdata) {
                alert(rows_data.userdata);
                $(_button).removeAttr('disabled');
                return 0;
            }
            //enable index button
            if (rows_data.message) {
                alert(rows_data.message);
            }
            $(_button).removeAttr('disabled');
        }
    });
}


// 变更Switch
function changeSwitchState(data, active) {
    // data: a list of the item that should be true
    // active: readonly if active is true
    var switches = $(".switch input");
    for (var i = 0; i < switches.length; i++) {
        var node = switches[i];
        var nodeName = node.name;
        var tag = $("input[name=" + '"' + nodeName + '"' + "]");
        tag.bootstrapSwitch('readonly', false);
        if (data.indexOf(nodeName) != -1) {
            tag.bootstrapSwitch('state', true);
        }
        else {
            tag.bootstrapSwitch('state', false);
        }
        tag.bootstrapSwitch('readonly', active);
    }
}


// 解析IP
function getIps(ips_str) {
    var reg = /(\d+)\.(\d+)\.(\d+)\.(\d+)/g;
    if (ips_str) {
        return ips_str.toString().match(reg);
    } else {
        return null
    }
}


function debug(data) {
    if (data) {

    }

}


// 回车键 btn click
function pressEnter(e, btn) {
    var theEvent = e || window.event;
    var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
    if (code == 13) {
        //回车执行编辑
        $(btn).click();
        return false;
    }
}


// 系统安装进度查询标识
var flag = true;


// 请求Cobbler profile
function getProfiles() {
    var profileFlag = true;
    $.ajax({
        type: 'GET',
        url: 'cobbler_profiles',
        async: false,
        success: function (data) {
            // 异常退出
            if (data.userdata) {
                alert(data.userdata);
                profileFlag = false;
            }
            // 填充profile option
            if (data.profiles) {
                var profileCreate = $("#profileCreate");
                var profileEdit = $("#profileEdit");
                var profileIndex = $("#profileIndex");
                profileCreate.empty();
                profileEdit.empty();
                profileIndex.empty();
                profileIndex.append("<option></option>");
                for (var r = 0; r < data.profiles.length; r++) {
                    var profile = "<option value='" + data.profiles[r] + "'>" + data.profiles[r] + "</option>";
                    profileCreate.append(profile);
                    profileEdit.append(profile);
                    profileIndex.append(profile);
                }
            }
        }
    });
    return profileFlag;
}


// 获取所选择数据
function getSelected(table, single, just_idv) {
    var item = $(table).bootstrapTable('getSelections');
    if (item.length == 0) {
        alert("请勾选行数据.");
        return null;
    }
    if (single && item.length > 1) {
        alert("请勾选一行数据.");
        return null;
    }

    var _data = [];
    // 只返回id
    if (just_idv) {
        for (var i = 0; i < item.length; i++) {
            _data.push({'name': 'id', 'value': item[i].id});
            _data.push({'name': 'version', 'value': item[i].version});
        }
    }
    else {
        _data = item;
    }
    return _data;
}


// 设置默认bootstrap-table contentType
$.extend($.fn.bootstrapTable.defaults, {
    contentType: "application/x-www-form-urlencoded"
});


// 构造Query参数
function getQueryParameters(params, sort, limit, csrf_token) {
    var _sort = sort;
    var _order = 'desc';
    var _limit = limit;
    var _offset = 0;
    if (params.limit) {
        _limit = params.limit;
    }
    if (params.offset) {
        _offset = params.offset;
    }
    if (params.sort) {
        _sort = params.sort;
    }
    if (params.order) {
        _order = params.order;
    }
    return {
        'csrf_token': csrf_token,
        'limit': _limit,
        'offset': _offset,
        'sort': _sort,
        'order': _order
    };
}


// 解析Responding函数
function parserResponding(result) {
    if (result.userdata) {
        alert(result.userdata);
        return {'rows': [], 'row': ''}
    }
    return result;
}


// 表格更新
function updateGrid(_button, _url, _method, _form, _data, _grid, _modal) {
    if (_button) {
        $(_button).attr('disabled', 'disabled');
    }

    if (_data.length == 0) {
        _data = $(_form).serializeArray();
    }

    $.ajax({
        type: _method,
        url: _url,
        async: true,
        data: _data,
        success: function (rows_data) {
            // 错误时提示并退出
            if (rows_data.userdata) {
                alert(rows_data.userdata);
                if (_button) {
                    $(_button).removeAttr('disabled');
                }
                return 0;
            }
            if (rows_data.message) {
                alert(rows_data.message);
            }
            // 表单重置
            else {
                if (_form) {
                    $(_form)[0].reset();
                }
            }
            // 隐藏modal
            if (_modal) {
                $(_modal).modal('hide');
            }
            // 按钮恢复
            if (_button) {
                $(_button).removeAttr('disabled');
            }
            // IP资源查询时显示起始IP、结束IP、已使用IP数
            if (rows_data.max && rows_data.min) {
                $('#ip_range')[0].innerText = '起始IP:' + rows_data.min + ', 结束IP: ' +
                    rows_data.max + ', 已使用IP数: ' + rows_data.used + '.';
            }
            if (rows_data.target) {
                // 表格本地加载数据
                if (rows_data.target == 'load') {
                    $(_grid).bootstrapTable('load', rows_data.rows);
                }
                // 表格刷新
                else if (rows_data.target == 'refresh') {
                    $(_grid).bootstrapTable('refresh');
                }
                // 表格插入
                else if (rows_data.target == 'prepend') {
                    $(_grid).bootstrapTable('insertRow', {index: 0, row: rows_data.row});
                }
                // 表格删除
                else if (rows_data.target == 'remove') {
                    for (var i = 0; i < rows_data.rows.length; i++) {
                        $(_grid).bootstrapTable('removeByUniqueId', rows_data.rows[i]);
                    }
                }
                // 表格更新
                else if (rows_data.target == 'update') {
                    $(_grid).bootstrapTable('updateByUniqueId', {'id': rows_data.row.id, 'row': rows_data.row});
                }
                else {
                }
            }
        }
    });
}


// 隐藏特殊列
function hideSpecialItem(_invisible) {
    $('.dropdown-menu li').each(function () {
        var item = $(this).find('label input').attr('data-field');
        if (_invisible.indexOf(item) != -1) {
            $(this).remove();
        }
    });
}


// 调整表格高度
function adjustSize(_g, _top, _offset) {
    var _height = document.documentElement.clientHeight;
    $(_g).bootstrapTable('refreshOptions', {height: _height - _top + _offset});
}


// 保存列信息
function save_grids(_grid, _module) {
    var show_lines = [];
    var ths = $(_grid + " thead tr th[data-field]");
    for (var i=0; i< ths.length; i++){
        show_lines[i] = ths[i].getAttribute('data-field');

    }
    $.ajax({
        type: 'POST',
        url: '/setting_grid',
        async: true,
        data: {'name': _module, 'value': show_lines.join(";")},
        success: function (rows_data) {
            if (rows_data.userdata) {
                alert(rows_data.userdata);
                return 0;
            }
            if (rows_data.message) {
                alert(rows_data.message);
            }
        }
    });
}


// 显示/隐藏行
function showIps(tid) {
    var tar = $(tid);
    if (tar.attr("hidden")) {
        tar.nextAll()[1].innerText = '收起';
        tar.prop("hidden", false);
    }
    else {

        tar.nextAll()[1].innerText = '更多';
        tar.prop("hidden", true);
    }
}


// 初始化tooltip
$(function() {
    $( document ).tooltip();
});

