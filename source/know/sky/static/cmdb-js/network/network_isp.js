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
            $("#resource_idc_depository_create_modal").append(s);
            $("#resource_idc_depository_index_modal").append(s);
            $("#resource_idc_depository_edit_modal").append(s);
        }
    }
});


// 查询ISP
$.ajax({
    type: 'GET',
    url: '/network_isp_index',
    async: true,
    data: {'field': 'show_all', 'csrf_token': csrf_token},
    success: function (rows_data) {
        if (rows_data.userdata){
            alert(rows_data.userdata);
            return 0;
        }
        var isp = rows_data.rows;
        for (var r = 0; r < isp.length; r++) {
            var s = "<option value='" + isp[r].isp_name + "'>" + isp[r].isp_name + "</option>";
            $("#resource_isp_create_modal").append(s);
            $("#resource_isp_index_modal").append(s);
            $("#resource_isp_edit_modal").append(s);
        }
    }
});


var ispModel = [
    {field: 'status', checkbox: true},
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'id', title: 'id', visible: false},
    {field: 'version', title: 'version', visible: false},
    {field: 'isp_name', title: '线路', sortable: true},
    {field: 'account', title: '公网IP资源数'},
    {field: 'ip_account', title: 'IP数'},
    {field: 'create_time', title: '创建时间', visible: false, sortable: true},
    {field: 'delete_status', title: '是否已删除', visible: false}];


var ispResourceModel = [
    {field: 'status', checkbox: true},
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'id', title: 'id', visible: false},
    {field: 'version', title: 'version', visible: false},
    {field: 'isp_name', title: '线路', sortable: true},
    {field: 'idc_depository', title: 'IDC机房', sortable: true},
    {field: 'isp_ip', title: '网络号', sortable: true},
    {field: 'isp_mask', title: '子网掩码', sortable: true},
    {field: 'isp_mask_int', title: '掩码', sortable: true},
    {field: 'isp_ip_start_str', title: '起始IP'},
    {field: 'isp_ip_ended_str', title: '结束IP'},
    {field: 'isp_ip_count', title: 'IP数', visible: false},
    {field: 'isp_dns', title: 'DNS', sortable: true},
    {field: 'isp_gateway', title: '网关', sortable: true},
    // {field: 'ips', title: 'ips', visible: false},
    {field: 'used', title: 'IP使用'},
    {field: 'remark', title: '备注', sortable: true},
    {field: 'create_time', title: '创建时间', visible: false, sortable: true},
    {field: 'delete_status', title: '是否已删除', visible: false}];


// ISP
$('#ispJqGrid').bootstrapTable({
    columns: ispModel,

    pagination: true,
    // height: 800,
    sidePagination: 'server',
    idField: 'id',
    paginationVAlign: 'top',
    pageSize: 5,
    pageNumber: 1,
    pageList: [5, 10, 100],
    showExport: true,
    exportOptions: {fileName: 'ISP'},
    striped: true,
    showToggle: true,
    showColumns: true,
    // detailView: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#isp-toolbar",
    showPaginationSwitch: 'true',

    queryParams: ispQueryParameters,

    ajaxOptions: {
        url: '/network_isp_index',
        method: 'get',
        data: {field: 'show_all', csrf_token: csrf_token}
    },

    ajax: function (request) {
        $.ajax(request);
    },

    responseHandler: parserResponding
});


// 公网IP资源
$('#resourceJqGrid').bootstrapTable({
    columns: ispResourceModel,

    pagination: true,
    // height: 800,
    sidePagination: 'server',
    idField: 'id',
    paginationVAlign: 'top',
    pageSize: 20,
    pageNumber: 1,
    pageList: [20, 100, 500, 2000],
    showExport: true,
    exportOptions: {fileName: '公网IP资源'},
    striped: true,
    showToggle: true,
    showColumns: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#resource-toolbar",
    showPaginationSwitch: 'true',

    queryParams: resourceQueryParameters,

    ajaxOptions: {
        url: '/network_resource_index',
        method: 'get',
        data: {field: 'show_all', csrf_token: csrf_token}
    },

    ajax: function (request) {
        $.ajax(request);
    },

    responseHandler: resourceRespHandler
});


// ISP Query参数
function ispQueryParameters(params) {
    var _params = getQueryParameters(params, 'isp_name', 5, csrf_token);
    _params.field = 'show_all';
    return _params;
}


// 公网IP Query参数
function resourceQueryParameters(params) {
    var _params = getQueryParameters(params, 'isp_ip', 20, csrf_token);
    if (_params.sort == 'isp_name'){
        _params.sort = 'isp_name_id';
    }
    else if (_params.sort == 'idc_depository'){
        _params.sort = 'idc_depository_id';
    }
    else {

    }
    _params.field = 'show_all';
    return _params;
}


// responseHandler
function resourceRespHandler(result){
    var _result = parserResponding(result);
    for (var i = 0; i < _result.rows.length; i++) {
        _result.rows[i].used = '<a href=javascript:indexIps(\"' + _result.rows[i].id + '"\)>查看</a>';
    }
    return _result;
}


var ipModel = [{field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'ip', title: '已使用IP', sortable: true},
    {field: 'idc', title: 'IDC使用', sortable: true},
    {field: 'gateway', title: '网关使用', sortable: true},
    {field: 'mapping', title: '映射使用', sortable: true}];


// 已使用IP
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
    exportOptions: {fileName: '公网IP资源使用情况'},
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#ip-toolbar",
    showPaginationSwitch: 'true'

});


// 查看事件
function indexIps(id) {
    // 请求
    updateGrid(
        '',
        '/network_resource_ip_index',
        'get',
        '',
        {'resource': id, 'csrf_token': csrf_token},
        '#ipJqGrid',
        '');
    // 显示弹框
    $("#ipModal").modal('show');
}


// 创建ISP
$("#create_isp_button").click(function () {
    getDataAndUpdateGrid(
        "#create_isp_button",
        '/network_isp_create',
        'POST',
        '#network_isp_create_form',
        '',
        "#ispJqGrid",
        'server',
        ""
    );
});


// 编辑ISP
$("#edit_isp_button").click(function () {
    var item = getSelected('#ispJqGrid', true, false);
    if (item === null){
        return null;
    }
    var document = $("#networkISPEditModal");
    formfiller(item[0], document);
    document.modal('show');
});


// 编辑保存ISP
$("#networkISPEditModalSaveConfirm").click(function () {
    getDataAndUpdateGrid(
        "#networkISPEditModalSaveConfirm",
        '/network_isp_edit',
        'POST',
        '#networkISPEditModalForm',
        '',
        "#ispJqGrid",
        'server',
        "#networkISPEditModal"
    );
});


// 删除ISP
$("#delete_isp_button").confirm({
    title: "删除ISP",
    text: "确定是否删除该ISP?",
    confirm: function () {
        deleteSelectedItems("#delete_isp_button", "#ispJqGrid", '/network_isp_delete', true);
    },
    confirmButton: "删除",
    cancelButton: "取消"
});


// 条件搜索公网IP资源
$("#networkResourceIndexBtn").click(function () {
    var _data = $("#networkResourceIndexForm").serializeArray();

    $('#resourceJqGrid').bootstrapTable('refreshOptions', {
        queryParams: function (params){
            var para = resourceQueryParameters(params);
            var data = jQuery.extend(true, [], _data);

            // 加入分页 排序参数
            data.push({'name': 'limit', 'value': para.limit});
            data.push({'name': 'offset', 'value': 0});
            data.push({'name': 'sort', 'value': para.sort});
            data.push({'name': 'order', 'value': para.order});
            return data;
        },

        ajaxOptions: {
            url: '/network_resource_index',
            method: 'post',
            data: _data
        }
    });
    hideSpecialItem(hiddenFields);
});


// 创建公网IP资源
$("#create_resource_button").click(function () {
    $("#networkResourceCreateModal").modal('show');
});


// 保存创建公网IP资源
$("#resourceCreateSave").click(function () {
    getDataAndUpdateGrid(
        "#resourceCreateSave",
        '/network_resource_create',
        'POST',
        '#networkResourceCreateModalForm',
        '',
        "#resourceJqGrid",
        'server',
        ""
    );
});


// 编辑公网IP资源
$("#edit_resource_button").click(function () {
    var item = getSelected('#resourceJqGrid', true, false);
    if (item === null){
        return null;
    }
    var document = $("#networkResourceEditModal");
    formfiller(item[0], document);
    document.modal('show');
});


// 保存编辑公网IP资源
$("#resourceEditSave").click(function () {
    getDataAndUpdateGrid(
        "#resourceEditSave",
        '/network_resource_edit',
        'POST',
        '#networkResourceEditModalForm',
        '',
        "#resourceJqGrid",
        'server',
        "#networkResourceEditModal"
    );
});


// 删除公网IP资源
$("#delete_resource_button").confirm({
    title: "删除公网IP资源",
    text: "确定是否删除该公网IP资源?",
    confirm: function () {
        deleteSelectedItems("#delete_resource_button", "#resourceJqGrid", '/network_resource_delete', true);
    },
    confirmButton: "删除",
    cancelButton: "取消"
});


// 监听搜索回车事件
$("#index_resource").bind("keydown", function (e) {
    pressEnter(e, "#networkResourceIndexBtn");
});


// 监听创建回车事件
$("#networkResourceCreateModal").bind("keydown", function (e) {
    pressEnter(e, "#resourceCreateSave");
});


$("#create_isp").bind("keydown", function (e) {
    pressEnter(e, "#create_isp_button");
});


// 监听修改回车事件
$("#networkResourceEditModal").bind("keydown", function (e) {
    pressEnter(e, "#resourceEditSave");
});


$("#networkISPEditModal").bind("keydown", function (e) {
    pressEnter(e, "#networkISPEditModalSaveConfirm");
});


var hiddenFields = ['status', 'id', 'version', 'create_time', 'delete_status'];
$(document).ready(function(){
    // 表格高度适应
    var top = $('#resourceJqGrid').offset().top;
    adjustSize("#resourceJqGrid", top, 30);

    $(window).resize(function() {
        adjustSize("#resourceJqGrid", top, 30);
        // 隐藏特殊列
        hideSpecialItem(hiddenFields);
    });

    // 隐藏特殊列
    hideSpecialItem(hiddenFields);
});
