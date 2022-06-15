axios.interceptors.response.use(function (response) {
    // hook response
    let content = "";
    let message = response.data.message;

    if (message === undefined) {
        return response;
    }
    if (typeof message === 'object' && Object.keys(message).length !== 0) {
        content = Object.values(message).join('<br>');
    } else if (typeof message === 'string') {
        content = message;
    }

    if (response.data.status) {
        // 执行成功
        // 仍然有消息要显示
        if (content) {
        }
    } else {
        // 执行失败
        // confirm 强制显示
        if (content) {
            confirm_tip('WARNING! ', content)
        }
    }
    return response;
});

let ModelFH = {
    'model': {},
    'show': function (model_id) {
        $("#" + model_id).modal('show');
    },
    'hide': function (model_id) {
        $("#" + model_id).modal('hide');
    },
    'fresh': function (model_id, data) {
        let i;
        let field;
        let fields = $("#" + model_id + ' .f-data');

        console.log('fresh', data);
        for (i = 0; i < fields.length; i++) {
            field = fields[i];
            if (field.name === undefined) {
                continue
            }
            if (data[field.name] === undefined) {
                continue
            }
            console.log(field.name);
            this.fill_one(field, data[field.name]);
        }
    },
    'fill_one': function (field, value) {
        let local_name = field.localName;
        if (local_name === 'input') {
            $(field).val(value);
        } else if (local_name === 'span') {
            $(field)[0].textContent = value;
        } else if (local_name === 'select') {
            $(field).each(function () {
                let that = this;
                if ($(that).hasClass('selectpicker')) {
                    // bootstrap-select
                    $(that).selectpicker('val', value)
                } else {
                    // normal select
                    alert('normal select. ');
                }
            });
        } else if (local_name === 'textarea') {
            $(field).val(value);
        }
    },
    'json': function (model_id) {
        let json = {};
        let fields = $("#" + model_id + ' .f-data');
        let i, field, name;

        for (i = 0; i < fields.length; i++) {
            field = fields[i];
            name = field.name;

            let local_name = field.localName;
            let value;
            if (local_name === 'input') {
                value = $(field).val();
            } else if (local_name === 'span') {
                value = $(field)[0].textContent;
            } else if (local_name === 'select') {
                $(field).each(function () {
                    let that = this;
                    if ($(that).hasClass('selectpicker')) {
                        // todo: 可能会有问题
                        value = $(that).selectpicker('val');
                    } else {
                        // normal select
                        value = that.value;
                        // alert('normal select. ');
                    }
                });
            } else if (local_name === 'textarea') {
                value = $(field).val();
            }
            if (json[name] === undefined) {
                json[name] = value;
            } else {
                if (json[name] instanceof Array) {
                    json[name].push(value);
                } else {
                    let tmp = json[name];
                    json[name] = [tmp, value]
                }
            }
        }
        console.log('json', json);
        return json;
    }
};

function confirm_tip(title, content) {
    // 提示信息
    let confirm = $.confirm({
        closeIcon: false,
        columnClass: 'col-md-12',
        theme: 'supervan',
        type: 'red',
        title: title,
        content: content,
        buttons: {
            cancel: {
                text: 'CLOSE',
                btnClass: 'btn-warning'
            }
        }
    });
    confirm.open();
}

function request(params) {
    let url = params.url;
    let method = params.method;
    let data = params.data;
    let success = params.success;
    let success_params = params.success_params;
    let failed = params.failed;
    let failed_params = params.failed_params;
    let btn = params.btn;
    let header = params.header;
    let after = params.after;
    let after_params = params.after_params;

    if (header === undefined) {
        header = {}
    }

    let config;
    if (method === "get") {
        config = {url: url, method: method, params: data, headers: header}
    } else if (method === 'post') {
        config = {url: url, method: method, data: data, headers: header}
    }

    if (btn !== undefined) {
        btn.attr('disabled', 'true');
    }
    axios.request(config)
        .then(function (response) {
            // 结束回调
            if (after !== undefined) {
                after(response, after_params)
            } else {
                // 正常回调
                if (response.data.status) {
                    if (success !== undefined) {
                        success(response, success_params);
                    }
                }
                // 错误回调
                else {
                    if (failed !== undefined) {
                        failed(response, failed_params);
                    }
                }
            }
            if (btn !== undefined) {
                btn.attr('disabled', false);
            }
        })
        .catch(function (error) {
            if (btn !== undefined) {
                btn.attr('disabled', false);
            }
            // console.log(error);
        });
}

function post(params) {
    params.method = 'post';
    request(params)
}

function get(params) {
    params.method = 'get';
    request(params)
}

function adjust_height(table) {
    // let height = $(document).height() - table.offset().top;
    // console.log('document', $(document).height());
    // console.log(table.offset().top);
    // table.bootstrapTable('resetView', {height: height});
    // table.bootstrapTable('refresh');
}

function search_move(table) {
    let $search = $("#top-search");
    let $input = $(".search input");
    $search.empty();
    $search.append($(".fixed-table-toolbar"));

    $(".search").css("width", '100%');

    $input.addClass('form-control-dark w-100');
    $input.css("width", '100%');
    $input.attr('placeholder', '搜索');

    if (table === undefined)
        return;
    adjust_height(table);
}

function get_selected($table, with_version) {
    let data = $table.bootstrapTable('getSelections');
    let ids_ = [];
    let versions_ = [];
    if (data.length === 0) {
        return {}
    }
    for (let i = 0; i < data.length; i++) {
        ids_.push(data[i].id);
        if (with_version) {
            versions_.push(data[i].version);
        }
    }
    if (with_version) {
        return {'ids': ids_.join(','), 'versions': versions_.join(',')};
    }
    return {'ids': ids_.join(',')};
}

function confirm_do_with_table(model, Model, title) {
    model.$btn.confirm({
        closeIcon: true,
        theme: 'supervan',
        title: title,
        content: "",
        onOpenBefore: function () {
            let select = get_selected(Model.$table, false);
            if (!select.ids) {
                this.setContent("<h3>PLEASE SELECT ITEM(S)</h3>");
                this.buttons.doKey.hide();
            } else {
                this.setContent("ARE YOU SURE TO " + title + " THESE ITEM(S)?");
            }
        },
        buttons: {
            doKey: {
                text: 'YES',
                action: function () {
                    let select = get_selected(Model.$table, false);
                    get({
                        'url': model.u, 'btn': model.$btn, 'data': {'target': select.ids},
                        'success': function () {
                            Model.$table.bootstrapTable('refresh');
                        }
                    });
                }
            },
            cancel: {text: 'CLOSE'}
        }
    });
}

function confirm_do_ns_with_table(model, Model, title, ns) {
    model.$btn.confirm({
        closeIcon: true,
        theme: 'supervan',
        title: title,
        content: "",
        onOpenBefore: function () {
            let select = get_selected(Model.$table, false);
            if (!select.ids) {
                this.setContent("<h3>PLEASE SELECT ITEM(S)</h3>");
                this.buttons.doKey.hide();
            } else {
                this.setContent("ARE YOU SURE TO " + title + " THESE ITEM(S)?");
            }
        },
        buttons: {
            doKey: {
                text: 'YES',
                action: function () {
                    let select = get_selected(Model.$table, false);
                    let params;
                    if (Model.target === undefined) {
                        params = {
                            'action': this.action,
                            'is_parallel': false,
                            'params': {'files': select.ids, 'target': ''}
                        };
                    } else {
                        params = {
                            'action': this.action,
                            'is_parallel': false,
                            'params': {'files': select.ids, 'target': Model.target}
                        };
                    }
                    console.info(params);
                    ns.emit(Model.signal, params);
                }
            },
            cancel: {text: 'CLOSE'}
        }
    });
}

function confirm_do(model, Model, title) {
    model.$btn.confirm({
        closeIcon: true,
        theme: 'supervan',
        title: title,
        content: "",
        buttons: {
            doKey: {
                text: 'YES',
                action: function () {
                    get({
                        'url': model.u, 'data': {}, 'btn': model.$btn, 'success': function (rsp) {
                            Model.$table.bootstrapTable('refresh');
                        }
                    });
                }
            },
            cancel: {text: 'CLOSE'}
        }
    });
}

function commit_from_model(model, Model, with_target) {
    model.$btn.on('click', function () {
        let params = Model.json(model.modal_id);
        console.info('params', params);
        if (with_target) {
            if (Model.target) {
                params.target = Model.target + '/' + params.target;
            }
        }
        if (model.suffix) {
            params.target = params.target + model.suffix;
        }
        get({
            'url': model.u,
            'data': params,
            'btn': model.$btn,
            'success': function (rsp) {
                Model.$table.bootstrapTable('refresh');
                console.log(rsp.data);
            }
        });
    });
}

function commit_from_td(model, Model, success) {
    $("tbody").on('click', model.btn_class, function () {
        get({
            'url': model.u,
            'data': {'target': this.name},
            'btn': $(this),
            'success': success
        });
    });
}

function emit_from_td(model, Model) {
    $("tbody").on('click', model.btn_class, function () {
        let params = {
            'kid': '',
            'action': model.action,
            'is_parallel': false,
            'params': {'target': this.name}
        };
        if (this.id !== undefined) {
            params.kid = this.id;
        }
        Model.io.emit(Model.signal, params);
    });
}

function emit_from_model(model, Model) {
    model.$btn.on('click', function () {
        let params = {
            'kid': '',
            'action': model.action,
            'is_parallel': false,
            'params': Model.json(model.modal_id)
        };
        if (this.id !== undefined) {
            params.kid = this.id
        }
        console.log('params', params);
        Model.io.emit(Model.signal, params);
    });
}

function list_for_table(model, Model) {
    Model.$table.bootstrapTable('refreshOptions', {
        queryParams: function (params) {
            if (Model.target !== undefined) {
                params.target = Model.target;
            }
            return params
        },
        ajax: function (request) {
            get({
                'url': model.u,
                'data': request.data,
                'success': function (rsp) {
                    request.success({
                        row: rsp.data
                    });
                    let parents = rsp.data.parents;
                    let ps = [];
                    for (let i = 0; i < parents.length; i++) {
                        ps.push("<a href='" + Model.font.u + "?target=" + parents[i]['i_path'] + "'><strong>" + parents[i]['i'] + "</strong></a>");
                    }
                    let $parents = $("#parents");
                    $parents.empty();
                    $parents.prepend(ps.join(' / '));
                    Model.$table.bootstrapTable('load', rsp.data);
                }
            });
        },
    });

    search_move(Model.$table);
    $(window).resize(function () {
        adjust_height(Model.$table);
    });

    $("#refresh").on('click', function () {
        Model.$table.bootstrapTable('refresh');
    });
}

function view(model) {
    $("tbody").on('click', model.btn_class, function () {
        let target = this.name;
        let $img = $(`#${model.modal_id} img`);
        let $textarea = $(`#${model.modal_id} textarea`);
        let $input = $(`#${model.modal_id} input`);
        let $commit = $(`#${model.modal_id} .commit-btn`);
        let $table = $(`#${model.modal_id} table`);
        $textarea.hide();
        $img.hide();
        $commit.hide();
        $table.hide();
        console.log('view:' + model.u);
        console.log('target:' + target);

        get({
            'url': model.u + '?target=' + target,
            'btn': $(this),
            'success': function (rsp) {
                let type = rsp.data.type;
                let rows = rsp.data.rows;
                if (type === 'img') {
                    $img.attr("src", rows);
                    $img.show();
                } else if (type === 'txt') {
                    $textarea.val(rows);
                    $textarea.show();
                    $input.val(target);
                    $commit.show()
                } else if (type === 'xls') {
                    $table.bootstrapTable('destroy');
                    $table.bootstrapTable({
                        columns: rsp.data.columns,
                        data: rsp.data.rows,
                        cache: false,
                        striped: true,
                        sidePagination: "client",
                        sortOrder: "desc",
                        pageSize: 15,
                        width: 667,
                        locale: "zh-CN",
                        pageList: "[15]",
                        pagination: true,
                    });
                    $table.show();
                }
            }
        });
    });
}

function show_modal_if_select_table(model, Model) {
    model.$btn.on('click', function () {
        let select = get_selected(Model.$table, false);
        if (!select.ids) {
            confirm_tip("WARNING", "<h3>PLEASE SELECT ITEM(S)</h3>");
        } else {
            let modal = new bootstrap.Modal(document.getElementById(model.modal_id), {
                keyboard: false
            });
            $('#' + model.modal_id + ' input[name=target]').val(select.ids);
            modal.show();
        }
    })
}

function escape(srcString) {
    let result = srcString;
    // 正则表达式中的特殊字符
    let chars_js = ["\\", "^", "$", "*", "?", ".", "+", "(", ")", "[", "]", "|", "{", "}"];
    // 不是正则表达式中的特殊字符
    let chars_special = ["~", "`", "@", "#", "%", "&", "=", "'", "\"", ":", ";", "<", ">", ",", "/"];
    for (let i = 0; i < chars_js.length; i++) {
        result = result.replace(new RegExp("\\"
            + chars_js[i], "g"), "\\"
            + chars_js[i]);
    }
    for (let i = 0; i < chars_special.length; i++) {
        result = result.replace(new RegExp(chars_special[i],
            "g"), "\\" + chars_special[i]);
    }
    return result;
}