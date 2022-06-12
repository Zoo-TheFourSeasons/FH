$.ajaxSetup({
    cache: false
});

var csrf_token = $('#csrf_token')[0].value;

var colModel = [{field: 'status', checkbox: true},
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'id', title: 'id', visible: false, sortable: true},
    {field: 'version', title: 'version', visible: false},
    {field: 'idc_depository', title: 'IDC机房', sortable: true},
    {field: 'account', title: '设备数', sortable: true},
    {field: 'address', title: '地址', sortable: true},
    {field: 'duty_phone', title: '值班电话', sortable: true},
    {field: 'duty_email', title: '值班邮箱', sortable: true},
    {field: 'support', title: '网络技术支持', sortable: true},
    {field: 'remark', title: '备注', sortable: true},
    {field: 'create_time', title: '创建时间', visible: false, sortable: true},
    {field: 'delete_status', title: '是否已删除', visible: false}];


$('#depositoryJqGrid').bootstrapTable({
    columns: colModel,

    pagination: true,
    sidePagination: 'client',
    idField: 'id',
    uniqueId: 'id',
    paginationVAlign: 'top',
    pageSize: 20,
    pageNumber: 1,
    pageList: [20, 100, 500, 2000],
    showExport: true,
    exportOptions: {fileName: 'IDC机房'},
    striped: true,
    showToggle: true,
    showColumns: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#depository-toolbar",
    showPaginationSwitch: 'true'

    // queryParams: idcDepositoryGETQueryParameters,
    //
    // ajaxOptions: {
    //     url: '/idc_depository_index',
    //     method: 'post',
    //     data: {field: 'show_all', csrf_token: csrf_token}
    // },
    //
    // ajax: function (request) {
    //     $.ajax(request);
    // },
    //
    // responseHandler: parserResponding
});


function getDepository() {
    updateGrid(
        '',
        '/idc_depository_index',
        'POST',
        '',
        {field: 'show_all', csrf_token: csrf_token},
        '#depositoryJqGrid',
        ''
    );
}


// GET查询参数
function idcDepositoryGETQueryParameters(params) {

    var _params = getQueryParameters(params, 'idc_depository', 20, csrf_token);
    _params.field = 'show_all';
    return _params;

}


// 创建IDC机房
$("#create_button").click(function () {
    updateGrid(
        "#create_button",
        '/idc_depository_create',
        'POST',
        '#idc_depository_create_form',
        '',
        "#depositoryJqGrid",
        "#documentModal"
    );
});


// 编辑IDC机房
$("#edit_button").click(function () {
    var item = getSelected('#depositoryJqGrid', true, false);
    if (item === null){
        return null;
    }
    var document = $("#documentModal");
    formfiller(item[0], document);
    document.modal('show');
});


// 编辑保存
$("#save_confirm").click(function () {
    updateGrid(
        "#save_confirm",
        '/idc_depository_edit',
        'POST',
        '#detail_form',
        '',
        "#depositoryJqGrid",
        "#documentModal"
    );
});


// 删除IDC机房
$("#delete_button").confirm({
    title:"删除IDC机房",
    text:"确定是否删除该IDC机房? 若该机房存在IDC信息或公网内网IP资源引用, 则无法删除.",
    confirm: function() {
        var _data = getSelected("#depositoryJqGrid", false, true);

        if (_data == null) {
            return null;
        }
        _data.push({'name': 'csrf_token', 'value': $('#csrf_token')[0].value});
        updateGrid(
            "#delete_button",
            '/idc_depository_delete',
            'POST',
            '',
            _data,
            "#depositoryJqGrid",
            ""
        );

        // deleteSelectedItems("#delete_button", "#depositoryJqGrid", '/idc_depository_delete', true);
    },
    confirmButton: "删除",
    cancelButton: "取消"
});


// 监听创建回车事件
$("#create_depository").keydown(function (e) {
    var theEvent = e || window.event;
    var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
    if (code == 13) {
        // $("#create_button").click();
        return false;
    }
});


// 监听修改回车事件
$("#documentModal").keydown(function (e) {
    pressEnter(e, "#save_confirm")
});


var hiddenFields = ['status', 'id', 'version', 'create_time', 'delete_status'];
$(document).ready(function(){
    getDepository();
    // 表格高度适应
    var top = $('#depositoryJqGrid').offset().top;
    adjustSize("#depositoryJqGrid", top, 30);

    $(window).resize(function() {
        adjustSize("#depositoryJqGrid", top, 30);
        // 隐藏特殊列
        hideSpecialItem(hiddenFields);
    });

    // 隐藏特殊列
    hideSpecialItem(hiddenFields);
});
