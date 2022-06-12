$.ajaxSetup({
    cache: false
});

var csrf_token = $('#csrf_token')[0].value;


var cobblerSystemModel = [
    {field: 'status', checkbox: true},
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'name', title: 'Name', sortable: true},
    {field: 'profile', title: 'Profile', sortable: true},
    // {field: 'status', title: 'Status', sortable: true},
    {field: 'netboot_enabled', title: 'Netboot Enabled', sortable: true}];


var processModel = [
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'name', title: 'Name', sortable: true},
    {field: 'ip', title: '物理IP', sortable: true},
    {field: 's_time', title: '开始安装时间', sortable: true},
    {field: 'e_time', title: '最后更新时间', sortable: true},
    {field: 'progress', title: '进度', sortable: true}];



// 创建Cobbler System表格
function initCobblerJqGrid() {
    // 未获取到profile 退出
    if (!getProfiles()){
        return 0;
    }
    $('#reinstallJqGrid').bootstrapTable({
        columns: cobblerSystemModel,

        pagination: true,
        sidePagination: 'server',
        idField: 'name',
        paginationVAlign: 'top',
        pageSize: 10,
        pageNumber: 1,
        pageList: [10, 20, 200],
        showExport: true,
        exportOptions: {fileName: 'Cobbler-System'},
        striped: true,
        showRefresh: true,
        showToggle: true,
        showColumns: true,
        paginationHAlign: 'left',
        paginationDetailHAlign: 'right',
        toolbarAlign: 'left',
        toolbar: "#cobbler-toolbar",
        showPaginationSwitch: 'true',

        queryParams: cobblerQueryParameters,

        ajaxOptions: {
            url: '/cobbler_system_index',
            method: 'get',
            data: {field: 'show_all', csrf_token: csrf_token}
        },

        ajax: function (request) {
            $.ajax(request);
        },

        responseHandler: parserResponding
    });
}
initCobblerJqGrid();


$('#installingGrid').bootstrapTable({
    columns: processModel,
    pagination: true,
    sidePagination: 'client',
    paginationVAlign: 'top',
    pageSize: 5,
    pageNumber: 1,
    pageList: [5, 10, 20, 200],
    striped: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right'
});


$('#failedGrid').bootstrapTable({
    columns: processModel,
    pagination: true,
    sidePagination: 'client',
    paginationVAlign: 'top',
    pageSize: 5,
    pageNumber: 1,
    pageList: [5, 10, 20, 200],
    striped: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right'
});


// Query 参数
function cobblerQueryParameters(params) {
    var _params = getQueryParameters(params, 'name', 10, csrf_token);
    _params.field = 'show_all';
    return _params;
}


// responseHandler
function failedRespHandler(result){
    var _result = parserResponding(result);
    for (var i = 0; i < _result.failed.length; i++) {
        _result.failed[i].name = '<a href=javascript:getCobblerSystemDetail("' + _result.failed[i].name + '")>' + _result.failed[i].name + '</a>';
    }
    return _result.failed;
}


// 显示连接配置
$("#login_reinstall").click(function () {
    $("#reinstallLoginModal").modal('show');
});


// 连接cobbler服务器
var loginBtn = $("#reinstallLoginConnect");
loginBtn.click(function () {
    loginBtn.attr('disabled', 'disabled');
    $.ajax({
        type: 'POST',
        url: 'cobbler_login',
        async: true,
        data: $("#reinstallLoginModalForm").serializeArray(),
        success: function (rows_data) {
            loginBtn.removeAttr('disabled');
            if (rows_data.userdata) {
                alert(rows_data.userdata);
                return 0;
            }
            $("#reinstallLoginModal").modal('hide');
            initCobblerJqGrid();
        }
    });
});


// 搜索Cobbler System
$("#index_button").click(function () {
    var _data = $("#reinstallIndexForm").serializeArray();

    $('#reinstallJqGrid').bootstrapTable('refreshOptions', {
        queryParams: function (params){
            var para = cobblerQueryParameters(params);
            var data = jQuery.extend(true, [], _data);

            // 加入分页 排序参数
            data.push({'name': 'limit', 'value': para.limit});
            data.push({'name': 'offset', 'value': 0});
            data.push({'name': 'sort', 'value': para.sort});
            data.push({'name': 'order', 'value': para.order});
            return data;
        },

        ajaxOptions: {
            url: '/cobbler_system_index',
            method: 'post',
            data: _data
        }
    });
});


// 创建
$("#create_reinstall").click(function () {
    $("#reinstallCreateModal").modal('show');
});


// 创建保存
$("#reinstallCreateSave").click(function () {
    getDataAndUpdateGrid(
        "#reinstallCreateSave",
        '/cobbler_system_create',
        'POST',
        '#reinstallCreateForm',
        '',
        "#reinstallJqGrid",
        'server',
        ""
    );
});


// 获取Cobbler System 详情
function getCobblerSystemDetail(name) {
    $.ajax({
        type: 'POST',
        url: 'cobbler_system_detail',
        async: false,
        data: {'name': name, 'csrf_token': csrf_token},
        success: function (rows_data) {
            if (rows_data.userdata) {
                alert(rows_data.userdata);
                return 0;
            }
            if (rows_data.row) {
                formfiller(rows_data.row, $("#reinstallEditForm"));
                $("#reinstallEditModal").modal('show');
            }
        }
    });
}

// 编辑
$("#edit_reinstall").click(function () {
    var item = getSelected('#reinstallJqGrid', true, false);
    if (item === null){
        return null;
    }
    getCobblerSystemDetail(item[0].name);
});


// 编辑保存
$("#reinstallEditSave").click(function () {
    getDataAndUpdateGrid(
        "#reinstallEditSave",
        '/cobbler_system_edit',
        'POST',
        '#reinstallEditForm',
        '',
        "#reinstallJqGrid",
        'server',
        ""
    );
});


// 删除
$("#delete_reinstall").confirm({
    title: "删除System",
    text: "确定是否删除System?",
    confirm: function () {
        var _data = getSelected("#reinstallJqGrid", false, false);

        var data = [];
        for (var i=0; i<_data.length; i++) {
            data.push({'name': 'name', 'value': _data[i].name});
        }
        data.push({'name': 'csrf_token', 'value': $('#csrf_token')[0].value});
        // alert(JSON.stringify(data));
        $("#delete_reinstall").attr('disabled', 'disabled');
        //send ajax
        $.ajax({
            type: 'POST',
            url: 'cobbler_system_delete',
            data: data,
            // async: true,
            success: function (rows_data) {
                $("#delete_reinstall").removeAttr('disabled');
                if (rows_data.userdata) {
                    alert(rows_data.userdata);
                    return 0;
                }
                $("#reinstallJqGrid").bootstrapTable('refresh');
                if (rows_data.message) {
                    alert(rows_data.message);
                }
            }
        });
    },
    confirmButton: "删除",
    cancelButton: "取消"
});


// 监听创建回车事件
$("#reinstallCreateForm").bind("keydown", function (e) {
    pressEnter(e, "#reinstallCreateSave");
});


// 监听修改回车事件
$("#reinstallEditForm").bind("keydown", function (e) {
    pressEnter(e, "#reinstallEditSave");
});


// 监听搜索回车事件
$("#reinstallIndexForm").bind("keydown", function (e) {
    pressEnter(e, "#index_button");
});


// 开始重装系统
$("#reinstallSystem").click(function () {
    $.ajax({
        type: 'POST',
        url: 'system_reinstall',
        data: $('#reinstallEditForm').serializeArray(),
        async: true,
        success: function (rows_data) {
            if (rows_data.userdata) {
                alert(rows_data.userdata);
                $("#delete_reinstall").removeAttr('disabled');
                return 0;
            }
            if (rows_data.message) {
                alert(rows_data.message);
            }
            //enable index button
            $("#delete_reinstall").removeAttr('disabled');
        }
    });
});


// 查询安装进度信息
function readProgress() {
    var installingGrid = $("#installingGrid");
    // 非系统重装页面退出
    if (installingGrid.length == 0){
        return false;
    }

    $.ajax({
        type: "GET",
        url: '/reinstall_progress_read',
        async: true,
        success: function (rows_data) {
            if (rows_data.userdata){
                alert(rows_data.userdata);
                return 0;
            }
            $("#installingGrid").bootstrapTable('load', rows_data.installing);
            // Hood responding data
            var failed = failedRespHandler(rows_data);
            $("#failedGrid").bootstrapTable('load', failed);
        }
    });
}


// 定时查询
if (flag){
    setInterval(readProgress, 3000);
    flag = false;
}
