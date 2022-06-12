$.ajaxSetup({
    cache: false
});

var csrf_token = $('#csrf_token')[0].value;

var colModel = [{field: 'status', checkbox: true},
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'id', title: 'id', visible: false, sortable: true},
    {field: 'version', title: 'version', visible: false},
    {field: 'idc_cost_center', title: '成本中心', sortable: true},
    {field: 'account', title: '项目数', sortable: true},
    {field: 'server_count', title: '服务器数', sortable: true},
    {field: 'create_time', title: '创建时间', visible: false, sortable: true},
    {field: 'delete_status', title: '是否已删除', visible: false}];


$('#costCenterJqGrid').bootstrapTable({
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
    exportOptions: {fileName: 'IDC成本中心'},
    striped: true,
    showToggle: true,
    showColumns: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#cost-center-toolbar",
    showPaginationSwitch: 'true'
});


function getCostCenter() {
    updateGrid(
        '',
        '/idc_cost_center_index',
        'POST',
        '',
        {field: 'show_all', csrf_token: csrf_token},
        '#costCenterJqGrid',
        ''
    );
}


// GET查询参数
function idcCostCenterGETQueryParameters(params) {

    var _params = getQueryParameters(params, 'idc_cost_center', 20, csrf_token);
    _params.field = 'show_all';
    return _params;

}


// 创建IDC成本中心
$("#create_button").click(function () {
    updateGrid(
        "#create_button",
        '/idc_cost_center_create',
        'POST',
        '#idc_cost_center_create_form',
        '',
        "#costCenterJqGrid",
        "#documentModal"
    );
});


// 编辑IDC成本中心
$("#edit_button").click(function () {
    var item = getSelected('#costCenterJqGrid', true, false);
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
        '/idc_cost_center_edit',
        'POST', '#detail_form',
        '',
        "#costCenterJqGrid",
        "#documentModal"
    );
});


// 删除IDC成本中心
$("#delete_button").confirm({
    title:"删除IDC成本中心",
    text:"确定是否删除该IDC成本中心? 若该成本中心下存在IDC信息, 则无法删除.",
    confirm: function() {
        var _data = getSelected("#costCenterJqGrid", false, true);

        if (_data == null) {
            return null;
        }
        _data.push({'name': 'csrf_token', 'value': $('#csrf_token')[0].value});
        updateGrid(
            "#delete_button",
            '/idc_cost_center_delete',
            'POST',
            '',
            _data,
            "#costCenterJqGrid",
            ""
        );
        // deleteSelectedItems("#delete_button", "#costCenterJqGrid", '/idc_cost_center_delete', true);
    },
    confirmButton: "删除",
    cancelButton: "取消"
});


// 监听创建回车事件
$("#cost-center-toolbar").keydown(function (e) {
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
    getCostCenter();
    // 表格高度适应
    var top = $('#costCenterJqGrid').offset().top;
    adjustSize("#costCenterJqGrid", top, 30);

    $(window).resize(function() {
        adjustSize("#costCenterJqGrid", top, 30);
        // 隐藏特殊列
        hideSpecialItem(hiddenFields);
    });

    // 隐藏特殊列
    hideSpecialItem(hiddenFields);
});
