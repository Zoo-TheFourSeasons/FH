$.ajaxSetup({
    cache: false
});

var csrf_token = $('#csrf_token')[0].value;

var colModel = [{field: 'status', checkbox: true},
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'id', title: 'id', visible: false, sortable: true},
    {field: 'version', title: 'version', visible: false, sortable: true},
    {field: 'idc_business', title: '业务', sortable: true},
    {field: 'account', title: '设备数', sortable: true},
    {field: 'server_count', title: '服务器数', sortable: true},
    {field: 'create_time', title: '创建时间', visible: false, sortable: true},
    {field: 'delete_status', title: '是否已删除', visible: false}];


$('#businessJqGrid').bootstrapTable({
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
    exportOptions: {fileName: 'IDC业务'},
    striped: true,
    showToggle: true,
    showColumns: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#business-toolbar",
    showPaginationSwitch: 'true'

});

function getBusiness() {
    updateGrid(
        '',
        '/idc_business_index',
        'POST',
        '',
        {field: 'show_all', csrf_token: csrf_token},
        '#businessJqGrid',
        ''
    );
}

// Query参数
function idcBusinessGETQueryParameters(params) {
    var _params = getQueryParameters(params, 'idc_business', 20, csrf_token);
    _params.field = 'show_all';
    return _params;
}


// 创建IDC业务
$("#create_button").click(function () {
    updateGrid(
        "#create_button",
        '/idc_business_create',
        'POST',
        '#idc_business_create_form',
        '',
        "#businessJqGrid",
        "#documentModal"
    );
});


// 编辑IDC业务
$("#edit_button").click(function () {
    var item = getSelected('#businessJqGrid', true, false);
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
        '/idc_business_edit',
        'POST',
        '#detail_form',
        '',
        "#businessJqGrid",
        "#documentModal"
    );
});


// 删除IDC业务
$("#delete_button").confirm({
    title: "删除IDC业务",
    text: "确定是否删除该IDC业务? 若该成本中心下存在IDC设备信息, 则无法删除.",
    confirm: function () {
        var _data = getSelected("#businessJqGrid", false, true);

        if (_data == null) {
            return null;
        }
        _data.push({'name': 'csrf_token', 'value': $('#csrf_token')[0].value});
        updateGrid(
            "#delete_button",
            '/idc_business_delete',
            'POST',
            '',
            _data,
            "#businessJqGrid",
            ""
        );

        // deleteSelectedItems("#delete_button", "#businessJqGrid", '/idc_business_delete', true);
    },
    confirmButton: "删除",
    cancelButton: "取消"
});


// 监听创建回车事件
$("#business-toolbar").keydown(function (e) {
    var theEvent = e || window.event;
    var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
    if (code == 13) {
        return false;
    }
});


// 监听修改回车事件
$("#documentModal").keydown(function (e) {
    pressEnter(e, "#save_confirm")
});


var hiddenFields = ['status', 'id', 'version', 'create_time', 'delete_status'];
$(document).ready(function(){
    getBusiness();
    // 表格高度适应
    var top = $('#businessJqGrid').offset().top;
    adjustSize("#businessJqGrid", top, 30);

    $(window).resize(function() {
        adjustSize("#businessJqGrid", top, 30);
        // 隐藏特殊列
        hideSpecialItem(hiddenFields);
    });

    // 隐藏特殊列
    hideSpecialItem(hiddenFields);
});
