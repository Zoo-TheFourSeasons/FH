$.ajaxSetup({
    cache: false
});

var csrf_token = $('#csrf_token')[0].value;


// 查询IDC机房
$.ajax({
    type: 'POST',
    url: '/idc_depository_index',
    async: true,
    data: {'field': 'show_all', 'csrf_token': csrf_token},
    success: function (rows_data) {
        if (rows_data.userdata){
            alert(rows_data.userdata);
            return 0;
        }
        var idc_depository = rows_data.rows;
        for (var r = 0; r < idc_depository.length; r++) {
            var s = "<option value='" + idc_depository[r].idc_depository + "'>" + idc_depository[r].idc_depository + "</option>";
            $("#lan_idc_depository_create_modal").append(s);
            $("#lan_idc_depository_index_modal").append(s);
            $("#lan_idc_depository_edit_modal").append(s);
        }
    }
});


var lanModel = [
    {field: 'status', checkbox: true},
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'id', title: 'id', visible: false, sortable: true},
    {field: 'version', title: 'version', visible: false},
    {field: 'idc_depository', title: 'IDC机房', sortable: true},
    {field: 'lan_ip', title: '网络号', sortable: true},
    {field: 'lan_mask', title: '子网掩码', sortable: true},
    {field: 'lan_mask_int', title: '子网掩码', sortable: true},
    {field: 'lan_ip_start_str', title: '起始IP'},
    {field: 'lan_ip_ended_str', title: '结束IP'},
    {field: 'lan_ip_count', title: 'IP数'},
    {field: 'lan_gateway', title: '网关', sortable: true},
    {field: 'used', title: 'IP使用情况'},
    {field: 'remark', title: '备注', sortable: true},
    {field: 'create_time', title: '创建时间', visible: false, sortable: true},
    {field: 'delete_status', title: '是否已删除', visible: false}];


// 内网IP资源
$('#lanJqGrid').bootstrapTable({
    columns: lanModel,
    
    pagination: true,
    sidePagination: 'server',
    idField: 'id',
    paginationVAlign: 'top',
    pageSize: 20,
    pageNumber: 1,
    pageList: [20, 100, 500, 2000],
    striped: true,
    showExport: true,
    exportOptions: {fileName: '内网IP资源'},
    showToggle: true,
    showColumns: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#lan-toolbar",
    showPaginationSwitch: 'true',

    queryParams: lanQueryParameters,

    ajaxOptions: {
        url: '/network_lan_index',
        method: 'get',
        data: {field: 'show_all', csrf_token: csrf_token}
    },

    ajax: function (request) {
        $.ajax(request);
    },

    responseHandler: lanRespHandler
});


// 公网IP Query参数
function lanQueryParameters(params) {
    var _params = getQueryParameters(params, 'lan_ip', 20, csrf_token);
    _params.field = 'show_all';
    return _params;
}


// responseHandler
function lanRespHandler(result){
    var _result = parserResponding(result);
    for (var i = 0; i < _result.rows.length; i++) {
        _result.rows[i].used = '<a href=javascript:indexIps(\"' + _result.rows[i].id + '"\)>查看</a>';
    }
    return _result;
}


var ipModel = [
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'ip', title: '已使用IP', sortable: true},
    {field: 'idc', title: 'IDC使用', sortable: true},
    {field: 'gateway', title: '网关使用', sortable: true}];


$('#ipJqGrid').bootstrapTable({
    columns: ipModel,

    pagination: true,
    sidePagination: 'client',
    idField: 'id',
    paginationVAlign: 'top',
    pageSize: 15,
    pageNumber: 1,
    pageList: [15, 30, 256],
    striped: true,
    showExport: true,
    exportOptions: {fileName: '内网IP资源使用情况'},
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#ip-toolbar",
    showPaginationSwitch: 'true'

});


// 查看IP使用情况
function indexIps(id) {
    updateGrid(
        '',
        '/network_lan_ip_index',
        'get',
        '',
        {'lan': id, 'csrf_token': csrf_token},
        '#ipJqGrid',
        '');
    // 显示弹框
    $("#ipModal").modal('show');
}


// 索引内网IP资源
$("#index_button").click(function () {
    var _data = $("#networkLANIndexForm").serializeArray();

    $('#lanJqGrid').bootstrapTable('refreshOptions', {
        queryParams: function (params){
            var para = lanQueryParameters(params);
            var data = jQuery.extend(true, [], _data);

            // 加入分页 排序参数
            data.push({'name': 'limit', 'value': para.limit});
            data.push({'name': 'offset', 'value': 0});
            data.push({'name': 'sort', 'value': para.sort});
            data.push({'name': 'order', 'value': para.order});
            return data;
        },

        ajaxOptions: {
            url: '/network_lan_index',
            method: 'post',
            data: _data
        }
    });
    hideSpecialItem(hiddenFields);
});


// 创建内网IP资源
$("#create_lan_button").click(function () {
    getDataAndUpdateGrid(
        "#create_lan_button",
        '/network_lan_create',
        'POST',
        '#network_lan_create_form',
        '',
        "#lanJqGrid",
        'server',
        ""
    );
});


// 编辑内网IP资源
$("#edit_lan_button").click(function () {
    var item = getSelected('#lanJqGrid', true, false);
    if (item === null){
        return null;
    }
    var document = $("#networkLANEditModal");
    formfiller(item[0], document);
    document.modal('show');
});


// 保存编辑内网IP资源
$("#lanEditModalSave").click(function () {
    getDataAndUpdateGrid(
        "#lanEditModalSave",
        '/network_lan_edit',
        'POST',
        '#networkLANEditModalForm',
        '',
        "#lanJqGrid",
        'server',
        "#networkLANEditModal"
    );
});


// 删除内网IP资源
$("#delete_lan_button").confirm({
    title: "删除内网IP资源",
    text: "确定是否删除该内网IP资源?",
    confirm: function () {
        deleteSelectedItems("#delete_lan_button", "#lanJqGrid", '/network_lan_delete', true);
    },
    confirmButton: "删除",
    cancelButton: "取消"
});


// 监听搜索回车事件
$("#index_lan").bind("keydown", function (e) {
    pressEnter(e, "#index_button");
});


// 监听创建回车事件
$("#create_lan").bind("keydown", function (e) {
    pressEnter(e, "#create_lan_button");
});


// 监听修改回车事件
$("#networkLANEditModal").bind("keydown", function (e) {
    pressEnter(e, "#lanEditModalSave");
});


var hiddenFields = ['status', 'id', 'version', 'create_time', 'delete_status'];
$(document).ready(function(){
    // 表格高度适应
    var top = $('#lanJqGrid').offset().top;
    adjustSize("#lanJqGrid", top, 30);

    $(window).resize(function() {
        adjustSize("#lanJqGrid", top, 30);
        // 隐藏特殊列
        hideSpecialItem(hiddenFields);
    });

    // 隐藏特殊列
    hideSpecialItem(hiddenFields);
});
