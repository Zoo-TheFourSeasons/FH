$.ajaxSetup({
    cache: false
});

var csrf_token = $('#csrf_token')[0].value;

var colModel = [
    {field: 'status', checkbox: true},
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'id', title: 'id', visible: false, sortable: true},
    {field: 'version', title: 'version', visible: false},
    {field: 'idc_type', title: '设备类型', sortable: true},
    {field: 'account', title: '设备数', sortable: true},
    {field: 'create_time', title: '创建时间', visible: false, sortable: true},
    {field: 'delete_status', title: '是否已删除', visible: false}];


$('#typeJqGrid').bootstrapTable({
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
    exportOptions: {fileName: 'IDC类型'},
    striped: true,
    showToggle: true,
    showColumns: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#type-toolbar",
    showPaginationSwitch: 'true'

    // queryParams: idcTypeQueryParameters,
    //
    // ajaxOptions: {
    //     url: '/idc_type_index',
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

function getType() {
    updateGrid(
        '',
        '/idc_type_index',
        'POST',
        '',
        {field: 'show_all', csrf_token: csrf_token},
        '#typeJqGrid',
        ''
    );
}


// Query参数
function idcTypeQueryParameters(params) {
    var _params = getQueryParameters(params, 'idc_type', 20, csrf_token);
    _params.field = 'show_all';
    return _params;
}


// 创建IDC类型
$("#create_button").click(function () {
    updateGrid(
        "#create_button",
        '/idc_type_create',
        'POST',
        '#idc_type_create_form',
        '',
        "#typeJqGrid",
        ""
    );
});


// 编辑IDC类型
$("#edit_button").click(function () {
    var item = getSelected('#typeJqGrid', true, false);
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
        '/idc_type_edit',
        'POST',
        '#detail_form',
        '',
        "#typeJqGrid",
        "#documentModal"
    );
});


// 删除IDC类型
$("#delete_button").confirm({
    title:"删除IDC设备类型",
    text:"确定是否删除该IDC设备类型? 若该设备类型下存在IDC信息, 则无法删除.",
    confirm: function() {
        var _data = getSelected("#typeJqGrid", false, true);

        if (_data == null) {
            return null;
        }
        _data.push({'name': 'csrf_token', 'value': $('#csrf_token')[0].value});
        updateGrid(
            "#delete_button",
            '/idc_type_delete',
            'POST',
            '',
            _data,
            "#typeJqGrid",
            ""
        );

        // deleteSelectedItems("#delete_button", "#typeJqGrid", '/idc_type_delete', true);
    },
    confirmButton: "删除",
    cancelButton: "取消"
});


// 监听创建回车事件
$("#type-toolbar").bind("keydown", function (e) {
    var theEvent = e || window.event;
    var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
    if (code == 13) {
        return false;
    }
});


// 监听修改回车事件
$("#documentModal").bind("keydown", function (e) {
    pressEnter(e, "#save_confirm");
});


var hiddenFields = ['status', 'id', 'version', 'create_time', 'delete_status'];
$(document).ready(function(){
    getType();
    // 表格高度适应
    var top = $('#typeJqGrid').offset().top;
    adjustSize("#typeJqGrid", top, 30);

    $(window).resize(function() {
        adjustSize("#typeJqGrid", top, 30);
        // 隐藏特殊列
        hideSpecialItem(hiddenFields);
    });

    // 隐藏特殊列
    hideSpecialItem(hiddenFields);
});

