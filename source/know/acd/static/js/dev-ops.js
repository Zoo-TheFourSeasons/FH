/**
 * Created by MrFish on 2017/3/7.
 */

// $.fn.editable.defaults.mode = 'inline';


window.alert = function(pms){
    dialog({
        title:'提示',
        content: pms,
        okValue: '确定',
        width: "300",
        ok: function () {}
    }).showModal();
};

var output_btn = $("#output-btn")[0];


function debounce(func, wait, immediate) {
    var timeout, result;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) result = func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) result = func.apply(context, args);
        return result;
    };
}


$("body").on('click','th .btn-info',function () {
    // 全选 取消选择
    var btn = this.innerHTML;
    if (btn == '全选'){
        $("tbody tr td label input").each(function () {
            this.checked = true;
        });
        this.innerHTML = '取消';
    }
    else {
        $("tbody tr td label input").each(function () {
            this.checked = false;
        });
        this.innerHTML = '全选';
    }
});


$("#max-size-btn").click(function () {
    $("#output-panel .panel-body").show();
    $(this).hide();
    $("#min-size-btn").show();
    $("#med-size-btn").show();

    var high = $(window).height();
    var of = $("#table-row").offset().top;
    $(".panel-body .output").css('height', high - of - 60);
    $("#table-row").hide();

});

$("#med-size-btn").click(function () {
    $("#output-panel .panel-body").show();
    $(this).hide();
    $("#min-size-btn").show();
    $("#max-size-btn").show();
    $(".panel-body .output").css('height', '250px');
    $("#table-row").show();
    $("#content>.wrapper").css("padding-bottom",'300px')
});


$("#min-size-btn").click(function () {
    $("#output-panel .panel-body").hide();
    $(this).hide();
    $("#max-size-btn").show();
    $("#med-size-btn").show();
    $("#table-row").show();
    $("#content>.wrapper").css("padding-bottom",'52px')
});


function get_selected(string, check) {
    // 获取已选项对象
    // string: 连接符
    // check: 是否检查为空
    var ids = [];
    $("tbody tr td label input:checked").each(function () {
        ids.push(this.name);
    });
    // if (check && ids.length == 0){
    //     $(".label-warning").html("请先勾选操作对象.");
    // }
    if (string != ''){
        return ids.join(string);
    }
    return ids;
}


function get_versions(string) {
    // 获取已选项版本
    var versions = [];
    $("tbody tr td label input:checked").each(function () {
        versions.push($(this).parent().parent().next().text());
    });
    if (string != ''){
        return versions.join(string);
    }
    return versions;
}


function get_ids(id_) {
    // 获取删除等操作的ids
    if (id_){
        return id_
    }
    var ids = get_selected('-', true);
    if (ids == []){
        alert('请选择列表项');
        return '';
    }
    return ids;
}


function del_objects(url_, table_) {
    var data = $(table_).bootstrapTable('getData', {useCurrentPage: false});
    var ids_ = [];
    var versions_ = [];
    for (var i = 0; i < data.length; i++) {
        ids_.push(data[i].id);
        versions_.push(data[i].version);
    }

    var form = $('#del-form');
    form.attr('action', url_);

    var ids = $("<input type='hidden'>");
    ids.attr({"name": 'ids'});
    ids.val(ids_.join(','));
    form.append(ids);

    var versions = $("<input type='hidden'>");
    versions.attr({"name": 'versions'});
    versions.val(versions_.join(','));
    form.append(versions);

    var csrf_token = $("<input type='hidden'>");
    csrf_token.attr({"name": 'csrf_token'});
    csrf_token.val($('meta')[0].content);
    form.append(csrf_token);

    form.submit();
}


function objects_delete(url_, idv, table_) {
    var ids_ = [];
    var versions_ = [];
    if (idv){
        if (typeof idv == 'string'){
            ids_ = [idv.split(',')[0]];
            versions_ = [idv.split(',')[1]];
        }
        else {
            for (var j=0;j<idv.length;j++){
                ids_.push(idv[j].split(',')[0]);
                versions_.push(idv[j].split(',')[1]);
            }
        }
    }
    else {
        var data = $(table_).bootstrapTable('getSelections');
        for (var i = 0; i < data.length; i++) {
            ids_.push(data[i].id);
            versions_.push(data[i].version);
        }
    }
    if (ids_.length == 0){
        alert('请选择数据.');
        return false;
    }

    var form = $('#del-form');
    form.attr('action', url_);

    var ids = $("<input type='hidden'>");
    ids.attr({"name": 'ids'});
    ids.val(ids_.join(','));
    form.append(ids);

    var versions = $("<input type='hidden'>");
    versions.attr({"name": 'versions'});
    versions.val(versions_.join(','));
    form.append(versions);

    var csrf_token = $("<input type='hidden'>");
    csrf_token.attr({"name": 'csrf_token'});
    csrf_token.val($('meta')[0].content);
    form.append(csrf_token);

    form.submit();
}


function get_objects(url, table_, modal_, progress_int, prefix, function_) {
    // 查询
    $.ajax({
        type: 'GET',
        url: url,
        success: function (resp) {
            if (!resp.status) {
                alert(resp.message);
            }
            else {
                // 刷新表格
                if (table_ && resp.rows){
                    $(table_).bootstrapTable('load', resp.rows);
                    var tds = $(table_ + ' tbody tr td');
                    if (progress_int){
                        for (var i=1;i<=tds.length;i++){
                            if (i%progress_int==0){
                                tds[i-1].className = 'progress_key';
                                if (prefix){
                                    tds[i-1].id = tds[i-3].textContent+':'+tds[i-2].textContent;
                                }
                                else {
                                    tds[i-1].id = tds[i-2].textContent;
                                }
                            }
                        }
                    }
                }

                // 显示模态框
                if (modal_){
                    $(modal_).modal('show');
                }
                // 回调
                if (function_ != ''){
                    function_(resp)
                }

            }
        }
    });
}


function update_status(token, data) {
    // 更新状态
    if (token != data.token){
        return
    }

    for (var host in data.status) {
        var node = $("td[id='" + host + "']");
        var status = data.status[host];
        if (! status){
            status = '';
        }
        else if (status.indexOf('成功') != -1){
            status = '<span class="label label-warning">'  + status + '</span>';
        }
        else if (status.indexOf('失败') != -1) {
            status = '<span class="label label-danger">' + status + '</span>';
        }
        else if (status.indexOf('正常') != -1){
            status = '<span class="label label-warning">'  + status + '</span>';
        }
        else if (status.indexOf('异常') != -1) {
            status = '<span class="label label-danger">' + status + '</span>';
        }
        else {
            status = '<span class="label label-info">' + status + '</span>';
        }
        for (var i=0; i< node.length; i++){
            node[i].innerHTML = status;
        }
    }
}


function prepend_event(data) {
    // 添加新事件通知
    var event = '<a href="/event/'
                    + data.id
                    +'" target="_blank" class="list-group-item"><span class="clear block m-b-none">'
                    + data.event
                    + '<br/><small class="text-muted">'
                    + data.time_
                    + '-'
                    + data.operator
                    + '</small></span></a>';
    $(".list-group").prepend(event);
}


function host_operate(data_) {
    // 主机操作
    var socket = data_.io;
    var table_ = data_.table;
    var event = data_.event;
    var token = data_.token;
    var btn = data_.button;

    var data = $(table_).bootstrapTable('getData', {useCurrentPage: false});
    if (data.length == 0){
        alert('请勾选数据.');
        return
    }
    $(".output").html("").focus();
    var cache_key = [];
    var ids_ = ',';
    for (var i = 0; i < data.length; i++) {
        cache_key.push(data[i].ssh_address);
        ids_ = ids_ + data[i].id + ','
    }
    socket.emit(event, {
        'cache_key': cache_key.join(','),
        'url': socket.io.uri,
        'token': token,
        'event': event,
        'user__id': data_.user__id,
        'user': data_.user,
        'ids_': ids_
    });

    $(btn).parents('.modal').modal('hide');

    $("#med-size-btn").click();
}


function host_app_operate(data_) {
    // 主机应用操作
    var ssh = data_.ssh;
    var socket = data_.io;
    var table_ = data_.table;
    var event = data_.event;
    var token = data_.token;

    var cache_keys = [];
    var applications = [];

    if (ssh){
        cache_keys.push(ssh);
        applications.push(ssh.split(":")[1])
    }
    else{
        var data = $(table_).bootstrapTable('getSelections');

        if (data.length == 0){
            alert('请勾选数据.');
            return
        }
        for (var i = 0; i < data.length; i++) {
            cache_keys.push(data[i].ssh_address+':'+data[i].application);
            applications.push(data[i].application);
        }
    }

    $(".output").html("").focus();

    socket.emit(event, {
        'event': event,
        'url': socket.io.uri,
        'token': token,
        'user__id': data_.user__id,
        'user': data_.user,
        'id': data_.id,
        'parallel': data_.parallel,
        'cache_key': cache_keys.join(','),
        'application': applications.join(',')
    });

    $("#med-size-btn").click();
}


function node_app_operate(data_) {
    // 节点应用操作
    var ssh = data_.ssh;
    var socket = data_.io;
    var event = data_.event;
    var token = data_.token;

    var cache_keys = [];
    var applications = [];
    if (ssh){
        cache_keys.push(ssh);
        applications.push(ssh.split(":")[1])
    }
    else{
        $("tbody input[type='checkbox']").each(function () {
            if (this.checked){
                var id = $(this).parent().parent().next().next().next()[0].id;
                cache_keys.push(id);
                applications.push(id.split(':')[1]);
            }
        });
    }

    if (cache_keys.length == 0){
        alert('请勾选数据.');
        return
    }

    $(".output").html("").focus();

    socket.emit(event,
        {
            'event': event,
            'url': socket.io.uri,
            'id': data_.id,
            'user__id': data_.user__id,
            'user': data_.user,
            'token': token,
            'cache_key': cache_keys.join(','),
            'application': applications.join(',')
        });

    $("#med-size-btn").click();
}


function app_compile_(data_) {
    // 应用编译操作
    var id_ = data_.id_;
    var socket = data_.io;
    var event = data_.event;
    var token = data_.token;
    var table_ = data_.table;

    var data = $(table_).bootstrapTable('getSelections');

    if (data.length == 0){
        alert('请勾选数据.');
        return
    }
    $(".output").html("").focus();

    // 项目分支
    var trs = $("#project-branch-table tbody tr");
    var project;
    var branch;
    var project_ = [];
    for (var u=0; u<trs.length; u++){
        project = $(trs[u]).find('td:eq(1)')[0].textContent;
        branch = $(trs[u]).find('td:eq(2) input')[0].value;
        branch = branch.replace(/ /g, '');
        if (branch === ""){
            alert('请先填写项目分支.');
            return
        }
        project_.push([project, branch].join(':'));
    }

    // 编译信息
    var compile_ = [];
    // var app_project;
    for (var i = 0; i < data.length; i++) {
        // app_project = data[i].project;
        compile_.push([data[i].application, data[i].project].join(':'));
    }

    $("#select-apps-btn").attr('disabled', true);
    $("#compile-btn").attr('disabled', true);
    $("#distribute-btn").attr('disabled', true);
    $("#timing-btn").attr('disabled', true);
    
    socket.emit(event,
        {
            'event': event,
            'url': socket.io.uri,
            'id': id_,
            'token': token,
            'ids_': id_,
            'user__id': data_.user__id,
            'user': data_.user,
            'project_': project_,
            'compile_': compile_,
            'environment': data_.environment
        });
    $("#med-size-btn").click();
}


function app_distribute_(data_, trees) {
    // 应用发布操作
    var id = data_.id;
    var socket = data_.io;
    var event = data_.event;
    var token = data_.token;
    var table_ = data_.table;
    var trees_ = trees;

    var data = $(table_).bootstrapTable('getSelections');
    if (data.length == 0){
        alert('请勾选数据.');
        return
    }
    
    var app, cluster, node, code, param;
    var deploy_ = [];

    for (var i = 0; i < data.length; i++) {
        app = data[i].application;
        if (data_.timing){
            code = '';
        }
        else{
            code = $(".compile-code-"+app)[0].innerText;
            if(code == 'defeat'){
                code = '';
            }
        }

        var nodes = trees_[app].getCheckedNodes();
        var node_count = 0;
        
        for (var j=0; j<nodes.length; j++){
            param  = nodes[j].split(',');
            if (param.length > 2){
                node_count += 1;
                cluster = param[1];
                node = param[2];
                deploy_.push([app, [cluster, node, code].join(',')].join(':'));
            }
        }

        if (node_count == 0){
            alert('请为 '+app+ ' 选择节点.');
            return
        }
    }

    // 项目分支
    var trs = $("#project-branch-table tbody tr");
    var project;
    var branch;
    var project_ = [];
    for (var u=0; u<trs.length; u++){
        project = $(trs[u]).find('td:eq(1)')[0].textContent;
        branch = $(trs[u]).find('td:eq(2) input')[0].value;
        branch = branch.replace(/ /g, '');
        if (branch === ""){
            alert('请先填写项目分支.');
            return
        }
        project_.push([project, branch].join(':'));
    }

    // 编译信息
    var compile_ = [];
    var app_project;
    for (var c = 0; c < data.length; c++) {
        app_project = data[c].project;
        compile_.push([data[c].application, data[c].project].join(':'));
    }

    $(".output").html("").focus();
    $("#select-apps-btn").attr('disabled', true);
    $("#compile-btn").attr('disabled', true);
    $("#distribute-btn").attr('disabled', true);
    $("#timing-btn").attr('disabled', true);


    socket.emit(event,
        {
            'event': event,
            'url': socket.io.uri,
            'id': id,
            'user__id': data_.user__id,
            'user': data_.user,
            'token': token,
            'parallel': data_.parallel,
            'deploy_': deploy_,
            'project_': project_,
            'timing': data_.timing,
            'compile_': compile_,
            'environment': data_.environment
        });

    $("#med-size-btn").click();
}


function app_rollback(data_, trees) {
    // 应用发布操作
    var id = data_.id;
    var socket = data_.io;
    var event = data_.event;
    var token = data_.token;
    var table_ = data_.table;
    var trees_ = trees;

    var data = $(table_).bootstrapTable('getSelections');
    if (data.length == 0){
        alert('请勾选数据.');
        return
    }

    var app, cluster, node, code, param;
    var deploy_ = [];
    for (var i = 0; i < data.length; i++) {
        app = data[i].application;

        code = $("#code_" + app).selectpicker('val');
        if (code === ''){
            alert("请选择相应版本.");
            return
        }
        var nodes = trees_[app].getCheckedNodes();
        var node_count = 0;

        for (var j=0; j<nodes.length; j++){
            param  = nodes[j].split(',');
            if (param.length > 2){
                node_count += 1;
                cluster = param[1];
                node = param[2];
                deploy_.push([app, [cluster, node, code].join(',')].join(':'));
            }
        }

        if (node_count == 0){
            alert('请为 '+app+ ' 选择节点.');
            return
        }
    }
    $(".output").html("").focus();
    $("#select-apps-btn").attr('disabled', true);
    $("#distribute-btn").attr('disabled', true);

    socket.emit(event,
        {
            'event': event,
            'url': socket.io.uri,
            'id': id,
            'token': token,
            'user__id': data_.user__id,
            'user': data_.user,
            'ids_': id,
            'parallel': data_.parallel,
            'deploy_': deploy_
        });

    $("#med-size-btn").click();
}


function host_dispatch_execute(data_) {

    var content = data_.content;
    var socket = data_.io;
    var language = data_.language;
    var token = data_.token;
    var hosts = data_.hosts;
    var user = data_.user;

    socket.emit('dispatch_execute',
        {
            'event': 'dispatch_execute',
            'url': socket.io.uri,
            'content': content,
            'user': user,
            'user__id': data_.user__id,
            'token': token,
            'cache_key': hosts,
            'language': language
        });
    $(".output").html("").focus();
    $("#med-size-btn").click();
}


function update_operate_log(data) {
    // 刷新操作日志
    var nod;
    $("#demo .list-group").empty();
    $("#demo .list-group").append('<span class="list-group-item">历史记录</span>');
    for (var k = 0; k < data.rows.length; k++) {

        nod = '<a href="/output/detail/' + data.rows[k].id +
            '" target="_blank" class="list-group-item">' +
            (k + 1) + '#' +
            data.rows[k].event + '#' +
            data.rows[k].time + '</a>';
        $("#demo .list-group").append(nod);
    }
}


function worksheet_operate(btn, labels, btns, this_) {
    // 工单操作
    $(this_).attr('disabled', true);
    var id = btn.split('/')[3];
    $.ajax({
        type: 'GET',
        url: btn,
        success: function (resp) {
            $(this_).attr('disabled', false);

            if (resp.message) {
                alert(resp.message);
            }
            if (resp.status) {

                // 工单审核、关闭
                if (resp.status_) {
                    $("#" + id + '-opt button').attr('style', 'display:none');
                    // 更新状态
                    var sp = $("#" + id + '-opt span');
                    if (sp.length > 0){
                        sp[0].textContent = resp.status_;
                        if (sp.hasClass('label-danger')) {
                            sp.removeClass('label-danger')
                        }
                        if (sp.hasClass('label-info')) {
                            sp.removeClass('label-info')
                        }
                        if (sp.hasClass('label-default')) {
                            sp.removeClass('label-default')
                        }
                        if (sp.hasClass('label-warning')) {
                            sp.removeClass('label-warning')
                        }
                        sp.addClass(labels[resp.status_]);
                    }

                    // 更新按钮
                    var btn = btns[resp.status_];
                    for (var i = 0; i < btn.length; i++) {
                        var b_ = $("#" + id + "-opt button[id*='" + btn[i] + "']");
                        b_.removeAttr('style');
                    }
                }
                //  工单委派
                else{
                    if (resp.duty){
                        $("#"+id+'-duty')[0].textContent = resp.duty;
                        $("#" + id + "-opt button[id]").each(function () {
                            $(this).attr('style', 'display: none');
                        });
                    }
                }

                //  更新发布单号
                if (resp.distribute_id) {
                    var a = $("#" + id + '-distribute');
                    a.attr('href', '/distribute/edit/'+resp.distribute_id);

                    var strong = $("#" + id + '-distribute strong');
                    strong[0].textContent = resp.distribute_id;
                }

                //  更新操作人
                if (resp.operator) {
                    var span = $("#" + id + '-operator');
                    span[0].innerText = resp.operator;
                }
                //  更新操作时间
                if (resp.operate_time) {
                    var span_ = $("#" + id + '-operate_time');
                    span_[0].innerText = resp.operate_time.substring(0, 19);
                }
                //  跳转页面
                if (resp.url){
                    window.open(resp.url);
                }
            }
        }
    });
}


function deal_env(btn_id, type_) {
    // 环境变更
    var btn = btn_id;
    var id = btn_id.split('-')[0];
    var env = btn_id.split('-')[1];
    $.ajax({
        type: 'GET',
        url: '/' + type_ + '/deal/' + id + '/' + env,
        success: function (resp) {
            if (resp.message) {
                alert(resp.message);
            }
            if (resp.status) {
                var btn_ = $('#' + btn);
                var status_ = resp.env_status;
                if (status_ == '已处理') {
                    btn_.removeClass('btn-danger');
                    btn_.addClass('btn-warning');
                }
                else {
                    btn_.removeClass('btn-warning');
                    btn_.addClass('btn-danger');
                }
                btn_[0].textContent = status_;
            }
        }
    });

}