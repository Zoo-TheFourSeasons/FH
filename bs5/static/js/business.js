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
            console.log(error);
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

function confirm_do_with_table($btn, $table, title, url, target) {
    $btn.confirm({
        closeIcon: true,
        theme: 'supervan',
        title: title,
        content: "",
        onOpenBefore: function () {
            let select = get_selected($table, false);
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
                    let select = get_selected($table, false);
                    axios.request({url: url, method: 'get', params: {'files': select.ids, 'target': target}}).then(function (response) {
                        $table.bootstrapTable('refresh');
                        console.log(response.data);
                    }).catch(function (error) {
                        console.log(error);
                    });
                }
            },
            cancel: {text: 'CLOSE'}
        }
    });
}

function confirm_do_ns_with_table($btn, $table, title, target, signal, action, ns) {
    $btn.confirm({
        closeIcon: true,
        theme: 'supervan',
        title: title,
        content: "",
        onOpenBefore: function () {
            let select = get_selected($table, false);
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
                    let select = get_selected($table, false);
                    let params;
                    if (target === undefined) {
                        params = {
                            'action': action,
                            'IS_PARALLEL': false,
                            'params': {'files': select.ids, 'target': ''}
                        };
                    } else {
                        params = {
                            'action': action,
                            'IS_PARALLEL': false,
                            'params': {'files': select.ids, 'target': target}
                        };
                    }
                    console.info(params);
                    ns.emit(signal, params);
                }
            },
            cancel: {text: 'CLOSE'}
        }
    });
}

function confirm_do($btn, title, url, data) {
    $btn.confirm({
        closeIcon: true,
        theme: 'supervan',
        title: title,
        content: "",
        buttons: {
            doKey: {
                text: 'YES',
                action: function () {
                    axios.request({url: url, method: 'get', params: data}).then(function (response) {
                    }).catch(function (error) {
                        console.log(error);
                    });
                }
            },
            cancel: {text: 'CLOSE'}
        }
    });
}

function mkdir($btn, $input_dir, url, $table, target) {
    $btn.on('click', function () {
        let p = $input_dir.val();
        if (target) {
            p = target + '/' + p;
        }
        axios.request({url: url, method: 'get', params: {'target': p}}).then(function (response) {
            $table.bootstrapTable('refresh');
            console.log(response.data);
        }).catch(function (error) {
            console.log(error);
        });
    });
}

function view(view_url) {
    $("tbody").on('click', '.view-btn', function () {
        let target = this.name;
        let $img = $("#view-modal img");
        let $textarea = $("#view-modal textarea");
        let $input = $("#view-modal input");
        let $commit = $("#view-modal .commit-btn");
        let $table = $("#view-modal table");
        $textarea.hide();
        $img.hide();
        $commit.hide();
        $table.hide();
        console.log('view:' + view_url);
        console.log('target:' + target);

        axios.request({url: view_url + '?target=' + target, method: 'get'}).then(function (response) {
            let type = response.data.type;
            let rows = response.data.rows;
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
                    columns: response.data.columns,
                    data: response.data.rows,
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
        }).catch(function (error) {
            console.log(error);
        });
    });
}

function listdir($table, url_index, target, url_item) {
    $table.bootstrapTable('refreshOptions', {
        queryParams: function (params) {
            if (target !== undefined) {
                params.target = target;
            }
            return params
        },
        ajax: function (request) {
            axios.request({url: url_index, method: 'get', params: request.data})
                .then(function (response) {
                    request.success({
                        row: response.data
                    });
                    let parents = response.data.parents;
                    let ps = [];
                    for (let i = 0; i < parents.length; i++) {
                        ps.push("<a href='" + url_item + "?target=" + parents[i]['i_path'] + "'><strong>" + parents[i]['i'] + "</strong></a>");
                    }
                    $("#parents").empty();
                    $("#parents").prepend(ps.join(' / '));
                    $table.bootstrapTable('load', response.data);
                })
                .catch(function (error) {
                });
        },
    });

    search_move($table);
    $(window).resize(function () {
        adjust_height($table);
    });

    $("#refresh").on('click', function () {
        $table.bootstrapTable('refresh');
    });
}

function show_modal($btn, $table, modal_id) {
    $btn.on('click', function () {
        let select = get_selected($table, false);
        if (!select.ids) {
            confirm_tip("WARNING", "<h3>PLEASE SELECT ITEM(S)</h3>");
        } else {
            let $modal = new bootstrap.Modal(document.getElementById(modal_id), {
                keyboard: false
            });
            $('#' + modal_id + ' input[name=target]').val(select.ids);
            $modal.show();
        }
    })
}