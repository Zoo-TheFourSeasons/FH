$.ajaxSetup({
    cache: false
});


var csrf_token = $('#csrf_token')[0].value;


var colModel = [
    {field: 'status', checkbox: true},
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'id', title: 'id', visible: false, sortable: true},
    {field: 'version', title: 'version', visible: false},
    {field: 'domain', title: '域名', sortable: true},
    {field: 'record_type', title: '记录类型', sortable: true, width: 85, align: 'center'},
    {field: 'host_record', title: '主机记录', sortable: true},
    {field: 'record_value', title: '记录值', sortable: true},
    {field: 'integral_domain', title: '完整域名', sortable: true},
    {field: 'leaf', title: '子项', width: 39, align: 'center'},
    {field: 'final_ip', title: '生效IP', sortable: true},
    {field: 'isp', title: '线路', sortable: true},
    {field: 'area', title: '地区', sortable: true},
    {field: 'port', title: '端口', sortable: true},
    {field: 'remark', title: '备注', sortable: true},
    {field: 'create_time', title: '创建时间', visible: false, sortable: true},
    {field: 'delete_status', title: '是否已删除', visible: false}
];


var subModel = [
    {field: 'status', checkbox: true},
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'id', title: 'id', visible: false, sortable: true},
    {field: 'version', title: 'version', visible: false},
    {field: 'domain', title: '域名', sortable: true},
    {field: 'level', title: '等级', visible: true, width: 31},
    {field: 'record_type', title: '记录类型', sortable: true, width: 85, align: 'center'},
    {field: 'host_record', title: '主机记录', sortable: true},
    {field: 'record_value', title: '记录值', sortable: true},
    {field: 'integral_domain', title: '完整域名', sortable: true},
    {field: 'final_ip', title: '生效IP', sortable: true},
    {field: 'isp', title: '线路', sortable: true},
    {field: 'area', title: '地区', sortable: true},
    {field: 'port', title: '端口', sortable: true},
    {field: 'remark', title: '备注', sortable: true},
    {field: 'create_time', title: '创建时间', visible: false, sortable: true},
    {field: 'delete_status', title: '是否已删除', visible: false}
];


// 创建域名解析表格
$('#domainJqGrid').bootstrapTable({
    columns: colModel,

    pagination: true,
    // height: 800,
    sidePagination: 'server',
    idField: 'id',
    uniqueId: 'id',
    paginationVAlign: 'top',
    pageSize: 20,
    pageNumber: 1,
    pageList: [20, 100, 500, 2000],
    showExport: true,
    exportOptions: {fileName: '域名解析'},
    striped: true,
    showToggle: true,
    showColumns: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#domain-toolbar",
    showPaginationSwitch: 'true',

    queryParams: domainQueryParameters,

    ajaxOptions: {
        url: '/network_domain_index',
        method: 'get',
        data: {field: 'show_all', csrf_token: csrf_token}
    },

    ajax: function (request) {
        $.ajax(request);
    },

    responseHandler: domainRespHandler
});


// 创建域名解析子项表格
$('#subDomainJqGrid').bootstrapTable({
    columns: subModel,
    pagination: true,
    sidePagination: 'client',
    paginationVAlign: 'top',
    idField: 'id',
    uniqueId: 'id',
    pageSize: 12,
    pageNumber: 1,
    pageList: [12, 24],
    striped: true,
    sortable: false,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbar: '#sub-domain-toolbar'
});


// Query参数
function domainQueryParameters(params) {
    var _params = getQueryParameters(params, 'domain', 20, csrf_token);
    _params.field = 'show_all';
    return _params;
}


// responseHandler
function domainRespHandler(result) {
    var _result = parserResponding(result);
    for (var i = 0; i < _result.rows.length; i++) {
        addLeafBtn(_result.rows[i]);
    }
    return _result;
}


// 增加生效IP换行
function addFinalIPBreak(item) {
    var ips = getIps(item.final_ip);
    if (ips && ips.length > 0) {
        item.final_ip = ips.join("<br>");
    }
}


// 查询子项
function getLeafs(id) {
    var _data = {'id': id, "csrf_token": csrf_token};
    updateGrid(
        "",
        '/network_domain_get',
        'POST',
        '',
        _data,
        "#subDomainJqGrid",
        ""
    );
    $("#subDomainModal").modal('show');
}


// 增加子节点按钮
function addLeafBtn(item) {
    // 图标替换
    if (item.leaf == 'false' || item.leaf == false) {
        item.leaf = '<a href=javascript:getLeafs(\"' + item.id + '"\)>查看</a>';
    }
    else {
        item.leaf = '无';
    }
}


// 创建域名解析
$("#create_button").click(function () {
    getDataAndUpdateGrid("#create_button", '/network_domain_create', 'POST', '#network_domain_create_form', '', "#domainJqGrid", 'server', "#documentModal");
});


// 搜索域名解析
$("#index_button").click(function () {
    var _data = $("#network_domain_index_form").serializeArray();

    $('#domainJqGrid').bootstrapTable('refreshOptions', {
        queryParams: function (params) {
            var para = domainQueryParameters(params);
            var data = jQuery.extend(true, [], _data);

            // 加入分页 排序参数
            data.push({'name': 'limit', 'value': para.limit});
            data.push({'name': 'offset', 'value': 0});
            data.push({'name': 'sort', 'value': para.sort});
            data.push({'name': 'order', 'value': para.order});
            return data;
        },

        ajaxOptions: {
            url: '/network_domain_index',
            method: 'post',
            data: _data
        }
    });
    hideSpecialItem(hiddenFields);
});


// 编辑域名解析
$("#edit_domain_button").click(function () {
    var item = getSelected('#domainJqGrid', true, false);
    if (item === null) {
        return null;
    }
    var document = $("#networkDomainEditModal");
    formfiller(item[0], document);
    document.modal('show');
});


// 编辑域名解析子项
$("#edit_sub_domain").click(function () {
    var item = getSelected('#subDomainJqGrid', true, false);
    if (item === null) {
        return null;
    }
    var document = $("#subDomainEditModal");
    formfiller(item[0], document);
    document.modal('show');
});


// 编辑保存域名解析
$("#domainSave").click(function () {
    updateGrid(
        "#domainSave",
        '/network_domain_edit',
        'POST',
        '#networkDomainEditModalForm',
        '',
        "#domainJqGrid",
        "#networkDomainEditModal"
    );
});


// 编辑保存域名解析子项
$("#subDomainSave").click(function () {
    updateGrid(
        "#subDomainSave",
        '/network_domain_edit',
        'POST',
        '#subDomainEditModalForm',
        '',
        "#subDomainJqGrid",
        "#subDomainEditModal"
    );
    $("#domainJqGrid").bootstrapTable('refresh');
});


// 删除域名解析
$("#delete_domain_button").confirm({
    title: "删除域名解析",
    text: "确定是否删除该域名解析?",
    confirm: function () {
        var _data = getSelected("#domainJqGrid", false, true);

        if (_data == null) {
            return null;
        }
        updateGrid(
            "#delete_domain_button",
            '/network_domain_delete',
            'POST',
            '',
            _data,
            "#domainJqGrid",
            ""
        );
    },
    confirmButton: "删除",
    cancelButton: "取消"
});

// 删除域名解析子项
$("#delete_sub_domain").confirm({
    title: "删除域名解析",
    text: "确定是否删除该域名解析?",
    confirm: function () {
        var _data = getSelected("#subDomainJqGrid", false, true);

        if (_data == null) {
            return null;
        }
        _data.push({'name': 'csrf_token', 'value': $('#csrf_token')[0].value});
        updateGrid(
            "#delete_sub_domain",
            '/network_domain_delete',
            'POST',
            '',
            _data,
            "#subDomainJqGrid",
            ""
        );
        $("#domainJqGrid").bootstrapTable('refresh');
    },
    confirmButton: "删除",
    cancelButton: "取消"
});


// 监听搜索回车事件
$("#index_domain").bind("keydown", function (e) {
    pressEnter(e, "#index_button");
});


// 监听创建回车事件
$("#create_domain").bind("keydown", function (e) {
    pressEnter(e, "#create_button");
});


// 监听修改回车事件
$("#networkDomainEditModal").bind("keydown", function (e) {
    pressEnter(e, "#domainSave");
});


var hiddenFields = ['status', 'id', 'version', 'create_time', 'delete_status'];
$(document).ready(function(){
    // 表格高度适应
    var top = $('#domainJqGrid').offset().top;
    adjustSize("#domainJqGrid", top, 30);

    $(window).resize(function() {
        adjustSize("#domainJqGrid", top, 30);
        // 隐藏特殊列
        hideSpecialItem(hiddenFields);
    });

    // 隐藏特殊列
    hideSpecialItem(hiddenFields);
});

