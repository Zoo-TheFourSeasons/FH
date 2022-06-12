$.ajaxSetup({
    cache: false
});

var csrf_token = $('#csrf_token')[0].value;


// 请求IDC机房
$.ajax({
    type: 'POST',
    url: '/idc_depository_index',
    async: true,
    data: {'field': 'show_all', 'csrf_token': csrf_token},
    success: function (rows_data) {
        if (rows_data.userdata) {
            alert(rows_data.userdata);
            return 0;
        }
        var idc_depository = rows_data.rows;
        //fill referenced list
        for (var r = 0; r < idc_depository.length; r++) {
            $("#idc_depository").append("<option value='" + idc_depository[r].idc_depository + "'>" + idc_depository[r].idc_depository + "</option>");
            $("#idc_depository_index").append("<option value='" + idc_depository[r].idc_depository + "'>" + idc_depository[r].idc_depository + "</option>");
            $("#idc_depository_modal").append("<option value='" + idc_depository[r].idc_depository + "'>" + idc_depository[r].idc_depository + "</option>");
        }
        if (rows_data.userdata) {
            alert(rows_data.userdata);
        }
    }
});


var colModel = [
    {field: 'status', checkbox: true},
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'id', title: 'id', visible: false},
    {field: 'version', title: 'version', visible: false},
    {field: 'idc_depository', title: 'IDC机房', sortable: true},
    {field: 'protocol', title: '协议', sortable: true},
    {field: 'extranet_ip', title: '外网IP', sortable: true},
    {field: 'extranet_port', title: '外网端口', sortable: true},
    {field: 'intranet_ip', title: '内网IP', sortable: true},
    {field: 'intranet_port', title: '内网端口', sortable: true},
    {field: 'module', title: '服务器信息', sortable: false},
    {field: 'domain', title: '域名', sortable: false},
    {field: 'remark', title: '备注', sortable: true},
    {field: 'create_time', title: '创建时间', visible: false, sortable: true},
    {field: 'delete_status', title: '是否已删除', visible: false}];


// 创建网络映射表格
$('#mappingJqGrid').bootstrapTable({
    columns: colModel,

    pagination: true,
    // height: 800,
    sidePagination: 'server',
    idField: 'id',
    paginationVAlign: 'top',
    pageSize: 20,
    pageNumber: 1,
    pageList: [20, 100, 500, 2000, 10000],
    showExport: true,
    exportOptions: {fileName: '网络映射'},
    striped: true,
    showToggle: true,
    showColumns: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#mapping-toolbar",
    showPaginationSwitch: 'true',
    uniqueId: 'id',

    queryParams: mappingQueryParameters,

    ajaxOptions: {
        url: '/network_mapping_index',
        method: 'get',
        data: {field: 'show_all', csrf_token: csrf_token}
    },

    ajax: function (request) {
        $.ajax(request);
    },

    responseHandler: mappingRespHandler
});


// Query参数
function mappingQueryParameters(params) {
    var _params = getQueryParameters(params, 'extranet_ip', 20, csrf_token);
    _params.field = 'show_all';
    return _params;
}

// responseHandler
function mappingRespHandler(result) {
    // 增加查询该网络映射IP对应IDC信息按钮
    var _result = parserResponding(result);
    for (var i = 0; i < _result.rows.length; i++) {
        _result.rows[i].module = '<a href=javascript:indexModule(\"' + _result.rows[i].id + '"\)>查看</a>';
    }
    return _result;
}


var idcModuleModel = [{field: 'status', checkbox: true},
    {field: 'id', title: 'id', visible: false},
    {field: 'idc_project', title: '项目', sortable: true},
    {field: 'idc_business', title: '业务', sortable: true},
    {field: 'idc_module', title: '模块', sortable: true},
    {field: 'idc_maintainer', title: '维护人', sortable: true},
    {field: 'idc_remark', title: '备注', sortable: true},
    {field: 'create_time', title: '创建时间', visible: false, sortable: true},
    {field: 'delete_status', title: '是否已删除', visible: false}];


// 创建IDC模块信息表格
$('#idcInfoModuleJqGrid').bootstrapTable({
    columns: idcModuleModel,

    pagination: true,
    // height: 800,
    sidePagination: 'server',
    idField: 'id',
    paginationVAlign: 'top',
    pageSize: 10,
    pageNumber: 1,
    pageList: [10, 20],
    striped: true,
    showRefresh: true,
    showToggle: true,
    showColumns: true,
    // detailView: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#module-toolbar",
    showPaginationSwitch: 'true',

    queryParams: moduleQueryParameters,

    ajaxOptions: {
        url: '/idc_info_index',
        method: 'post',
        data: {field: 'show_all', csrf_token: csrf_token}
    },

    responseHandler: moduleRespHandler
});


// Query参数
function moduleQueryParameters(params) {
    var _params = getQueryParameters(params, 'idc_module', 10, csrf_token);
    _params.field = 'show_all';
    return _params;
}

// responseHandler
function moduleRespHandler(result) {
    var _result = parserResponding(result);
    for (var i = 0; i < _result.rows.length; i++) {
        var module = _result.rows[i].idc_module.split(';');
        if (module.length > 1) {
            _result.rows[i].idc_module = module.join("<br>");
        }
    }
    return _result;
}


function indexModule(id) {
    // 查询IDC信息

    var item = $("#mappingJqGrid").bootstrapTable('getRowByUniqueId', parseInt(id));
    var _data = [{'name': "andors", 'value': "&&"},
        {'name': "fields", 'value': "idc_manage_ips"},
        {'name': "functions", 'value': "like"},
        {'name': "values", 'value': item.intranet_ip},
        {'name': "andors", 'value': "||"},
        {'name': "fields", 'value': "idc_physical_os_ips"},
        {'name': "functions", 'value': "like"},
        {'name': "values", 'value': item.intranet_ip},
        {'name': "csrf_token", 'value': csrf_token}];


    // 请求
    $('#idcInfoModuleJqGrid').bootstrapTable('refreshOptions', {
        queryParams: function (params) {
            var para = moduleQueryParameters(params);
            var data = jQuery.extend(true, [], _data);

            // 加入分页 排序参数
            data.push({'name': 'limit', 'value': para.limit});
            data.push({'name': 'offset', 'value': para.offset});
            data.push({'name': 'sort', 'value': para.sort});
            data.push({'name': 'order', 'value': para.order});
            return data;
        },
        
        ajax: function (request) {
            $.ajax(request);
        },

        ajaxOptions: {
            url: '/idc_info_index',
            method: 'post',
            data: _data
        }
    });

    $("#idcInfoModuleIndexModal").modal('show');
    $('#mappingIndexIp')[0].innerText = '内网IP:' + item.intranet_ip + ', ' + '内网端口IP: ' + item.intranet_port;
}


// 创建网络映射
$("#create_button").click(function () {
    getDataAndUpdateGrid(
        "#create_button",
        '/network_mapping_create',
        'POST',
        '#network_mapping_create_form',
        '',
        "#mappingJqGrid",
        'server',
        "#documentModal"
    );
});


// 条件搜索网络映射
$("#index_button").click(function () {
    var _data = $("#index_form").serializeArray();
    $('#mappingJqGrid').bootstrapTable('refreshOptions', {
        queryParams: function (params) {
            var para = mappingQueryParameters(params);
            var data = jQuery.extend(true, [], _data);

            // 加入分页 排序参数
            data.push({'name': 'limit', 'value': para.limit});
            data.push({'name': 'offset', 'value': 0});
            data.push({'name': 'sort', 'value': para.sort});
            data.push({'name': 'order', 'value': para.order});
            return data;
        },

        ajaxOptions: {
            url: '/network_mapping_index',
            method: 'post',
            data: _data
        }
    });
    hideSpecialItem(hiddenFields);
});


// 编辑网络映射
$("#edit_button").click(function () {
    var item = getSelected('#mappingJqGrid', true, false);
    if (item === null) {
        return null;
    }
    var document = $("#networkMappingEditModal");
    formfiller(item[0], document);
    document.modal('show');
});


// 编辑保存
$("#mappingEditSave").click(function () {
    getDataAndUpdateGrid(
        "#mappingEditSave",
        '/network_mapping_edit',
        'POST',
        '#networkMappingEditModalForm',
        '',
        "#mappingJqGrid",
        'server',
        "#networkMappingEditModal"
    );
});


$("#delete_button").confirm({
    title: "删除网络映射",
    text: "确定是否删除该网络映射?",
    confirm: function () {
        deleteSelectedItems("#delete_button", "#mappingJqGrid", '/network_mapping_delete', true);
    },
    confirmButton: "删除",
    cancelButton: "取消"
});


// 监听搜索回车事件
$("#index_mapping").bind("keydown", function (e) {
    pressEnter(e, "#index_button");
});


// 监听创建回车事件
$("#create_mapping").bind("keydown", function (e) {
    pressEnter(e, "#create_button");
});


// 监听修改回车事件
$("#networkMappingEditModal").bind("keydown", function (e) {
    pressEnter(e, "#mappingEditSave");
});


var hiddenFields = ['status', 'id', 'version', 'create_time', 'delete_status'];
$(document).ready(function(){
    // 表格高度适应
    var top = $('#mappingJqGrid').offset().top;
    adjustSize("#mappingJqGrid", top, 30);

    $(window).resize(function() {
        adjustSize("#mappingJqGrid", top, 30);
        // 隐藏特殊列
        hideSpecialItem(hiddenFields);
    });

    // 隐藏特殊列
    hideSpecialItem(hiddenFields);
});
