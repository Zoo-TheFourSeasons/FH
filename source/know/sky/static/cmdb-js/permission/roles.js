$.ajaxSetup({
    cache: false
});


var csrf_token = $('#csrf_token')[0].value;


var colModel = [
    {field: 'status', checkbox: true},
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'id', title: 'id', visible: false},
    {field: 'version', title: 'version', visible: false},
    {field: 'role_name', title: '角色', sortable: true},
    {field: 'account', title: '用户数'},
    {field: 'allowed', title: '允许访问路经', visible: false},
    {field: 'allowed_full', title: '完全访问路经', visible: false},
    {field: 'create_time', title: '创建时间', visible: false, sortable: true},
    {field: 'delete_status', title: '是否已删除', visible: false, sortable: true}];


// 创建角色表格
$('#roleJqGrid').bootstrapTable({
    columns: colModel,

    pagination: true,
    // height: 800,
    sidePagination: 'server',
    idField: 'id',
    paginationVAlign: 'top',
    pageSize: 20,
    pageNumber: 1,
    pageList: [20, 100, 500, 2000],
    showExport: true,
    exportOptions: {fileName: '角色'},
    striped: true,
    showToggle: true,
    showColumns: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#role-toolbar",
    showPaginationSwitch: 'true',

    queryParams: roleQueryParameters,

    ajaxOptions: {
        url: '/roles_index',
        method: 'post',
        data: {field: 'show_all', csrf_token: csrf_token}
    },

    ajax: function (request) {
        $.ajax(request);
    },

    responseHandler: parserResponding
});


// ISP Query参数
function roleQueryParameters(params) {
    var _params = getQueryParameters(params, 'role_name', 20, csrf_token);
    _params.field = 'show_all';
    return _params;
}


$(".switch input").bootstrapSwitch('state', false);


//创建角色
$("#create_button").click(function () {
    getDataAndUpdateGrid(
        "#create_button",
        '/roles_create',
        'POST',
        '#create_roles_form',
        '',
        "#roleJqGrid",
        'server',
        ""
    );
});


//搜索角色
$("#index_button").click(function () {
    var _data = $("#index_form").serializeArray();

    $('#roleJqGrid').bootstrapTable('refreshOptions', {
        queryParams: function (params){
            var para = roleQueryParameters(params);
            var data = jQuery.extend(true, [], _data);

            // 加入分页 排序参数
            data.push({'name': 'limit', 'value': para.limit});
            data.push({'name': 'offset', 'value': 0});
            data.push({'name': 'sort', 'value': para.sort});
            data.push({'name': 'order', 'value': para.order});
            return data;
        },

        ajaxOptions: {
            url: '/roles_index',
            method: 'post',
            data: _data
        }
    });
    hideSpecialItem(hiddenFields);
});


//编辑角色
$("#edit_button").click(function () {

    var item = getSelected('#roleJqGrid', true, false);
    if (item === null){
        return null;
    }
    item = item[0];
    var document = $("#roleModal");
    formfiller(item, document);
    document.modal('show');

    var allowed = item.allowed;
    var allowed_full = item.allowed_full;

    changeSwitchState(allowed.concat(allowed_full), false);
});


// 保存编辑
$("#save_confirm").click(function () {
    // 构造请求数据
    var formData = $("#detail_form").serializeArray();
    var data = [];
    var allowed = [];
    var allowed_full = [];
    for (var i=0; i<formData.length; i++){
        if (formData[i].name != 'csrf_token' && formData[i].name != 'id' && formData[i].name != 'version' && formData[i].name != 'role_name'){
            var name = formData[i].name;
            // 提取完全访问权限
            // todo: 检查方式存在问题
            if (name.indexOf('_index_full') != -1){
                allowed_full.push(name);
            }
            else {
                allowed.push(name);
            }
        }
        // csrf_token/id/version/role_name
        else {
            data.push(formData[i])

        }
    }
    data.push({'name': 'allowed_full', 'value': allowed_full.join(',')});
    data.push({'name': 'allowed', 'value': allowed.join(',')});
    getDataAndUpdateGrid(
        "#save_confirm",
        '/roles_edit',
        'POST',
        '#detail_form',
        data,
        "#roleJqGrid",
        'server',
        "#roleModal"
    );
});


$("#delete_button").confirm({
    title:"删除角色",
    text:"确定是否删除该用户角色? 若该角色下存在用户, 则无法删除.",
    confirm: function() {
        deleteSelectedItems("#delete_button", "#roleJqGrid", '/roles_delete', true);
    },
    confirmButton: "删除",
    cancelButton: "取消"
});


// 监听创建回车事件
$("#create_roles_form").bind("keydown", function (e) {
    var theEvent = e || window.event;
    var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
    if (code == 13) {
        return false;
    }
});


// 监听修改回车事件
$("#roleModal").bind("keydown", function (e) {
    pressEnter(e, "#save_confirm")
});


var hiddenFields = ['status', 'id', 'version', 'create_time', 'delete_status', 'allowed', 'allowed_full'];
$(document).ready(function(){
    // 表格高度适应
    var top = $('#roleJqGrid').offset().top;
    adjustSize("#roleJqGrid", top, 30);

    $(window).resize(function() {
        adjustSize("#roleJqGrid", top, 30);
        // 隐藏特殊列
        hideSpecialItem(hiddenFields);
    });

    // 隐藏特殊列
    hideSpecialItem(hiddenFields);
});
