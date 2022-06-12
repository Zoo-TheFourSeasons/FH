$.ajaxSetup({
    cache: false
});

var csrf_token = $('#csrf_token')[0].value;

var colModel = [
    {field: 'status', checkbox: true},
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'id', title: 'id', visible: false, sortable: true},
    {field: 'version', title: 'version', visible: false},
    {field: 'idc_hardware_serial', title: '硬件序列号', sortable: true},
    {field: 'ip', title: '管理地址'},
    {field: 'user1', title: '用户1', sortable: true},
    {field: 'password1', title: '密码1', sortable: true},
    {field: 'user2', title: '用户2', sortable: true},
    {field: 'password2', title: '密码2', sortable: true},
    {field: 'blade', title: '刀片编号'},
    {field: 'remark', title: '备注', sortable: true},
    {field: 'create_time', title: '创建时间', visible: false, sortable: true},
    {field: 'delete_status', title: '是否已删除', visible: false}];


// 创建远程管理卡表格
$('#remoteManageCardJqGrid').bootstrapTable({
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
    exportOptions: {fileName: 'IDC远程管理卡'},
    striped: true,
    showToggle: true,
    showColumns: true,
    // detailView: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#remote-manage-card-toolbar",
    showPaginationSwitch: 'true',

    queryParams: remoteManageCardQueryParameters,

    ajaxOptions: {
        url: '/remote_manage_card_index',
        method: 'post',
        data: {field: 'show_all', csrf_token: csrf_token}
    },

    ajax: function (request) {
        $.ajax(request);
    },

    responseHandler: parserResponding
});


// Query参数
function remoteManageCardQueryParameters(params) {
    var _params = getQueryParameters(params, 'idc_hardware_serial', 20, csrf_token);
    _params.field = 'show_all';
    return _params;
}


// 创建远程管理卡
$("#create_button").click(function () {
    getDataAndUpdateGrid("#create_button", '/remote_manage_card_create', 'POST', '#remote_manage_card_create_form', '', "#remoteManageCardJqGrid", 'server', "#documentModal");
});


// 搜索远程管理卡
$("#index_button").click(function () {
    var _data = $("#remote_manage_card_index_form").serializeArray();

    $('#remoteManageCardJqGrid').bootstrapTable('refreshOptions', {
        queryParams: function (params){
            var para = remoteManageCardQueryParameters(params);
            var data = jQuery.extend(true, [], _data);

            // 加入分页 排序参数
            data.push({'name': 'limit', 'value': para.limit});
            data.push({'name': 'offset', 'value': 0});
            data.push({'name': 'sort', 'value': para.sort});
            data.push({'name': 'order', 'value': para.order});
            return data;
        },

        ajaxOptions: {
            url: '/remote_manage_card_index',
            method: 'post',
            data: _data
        }
    });
    hideSpecialItem(hiddenFields);
});


// 编辑远程管理卡
$("#edit_card_button").click(function () {
    var item = getSelected('#remoteManageCardJqGrid', true, false);
    if (item === null){
        return null;
    }
    var document = $("#remoteManageCardEditModal");
    formfiller(item[0], document);
    document.modal('show');
});


// 编辑保存
$("#remoteManageCardEditModalSaveConfirm").click(function () {
    getDataAndUpdateGrid("#remoteManageCardEditModalSaveConfirm",
        '/remote_manage_card_edit',
        'POST',
        '#remoteManageCardEditModalForm',
        '',
        "#remoteManageCardJqGrid",
        'server',
        "#remoteManageCardEditModal"
    );
});


// 删除远程管理卡
$("#delete_card_button").confirm({
    title: "删除远程管理卡",
    text: "确定是否删除该远程管理卡?",
    confirm: function () {
        deleteSelectedItems("#delete_card_button", "#remoteManageCardJqGrid", '/remote_manage_card_delete', true);
    },
    confirmButton: "删除",
    cancelButton: "取消"
});


// 监听搜索回车事件
$("#index_remote_manage_card").bind("keydown", function (e) {
    pressEnter(e, "#index_button");
});


// 监听创建回车事件
$("#create_remote_manage_card").bind("keydown", function (e) {
    pressEnter(e, "#create_button");
});


// 监听修改回车事件
$("#remoteManageCardEditModal").bind("keydown", function (e) {
    pressEnter(e, "#remoteManageCardEditModalSaveConfirm");
});


var hiddenFields = ['status', 'id', 'version', 'create_time', 'delete_status'];
$(document).ready(function(){
    // 表格高度适应
    var top = $('#remoteManageCardJqGrid').offset().top;
    adjustSize("#remoteManageCardJqGrid", top, 30);

    $(window).resize(function() {
        adjustSize("#remoteManageCardJqGrid", top, 30);
        // 隐藏特殊列
        hideSpecialItem(hiddenFields);
    });

    // 隐藏特殊列
    hideSpecialItem(hiddenFields);
});
